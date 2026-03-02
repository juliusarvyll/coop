"use server";

import { clearVoterSession, getVoterSessionVoterId } from "@/lib/auth";
import { ensureElectionSettings } from "@/lib/election";
import { prisma } from "@/lib/prisma";
import { isPrismaKnownRequestError } from "@/lib/prisma-errors";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getClientIdentifier } from "@/lib/request";
import { ballotSelectionsSchema } from "@/lib/validation";
import { extractSelectionsFromFormData, validateBallotSelections } from "@/lib/voting-rules";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

class BallotSubmissionError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

export async function submitBallot(formData: FormData) {
  const clientId = await getClientIdentifier();
  const limitResult = consumeRateLimit(`vote-submit:${clientId}`, 8, 60_000);
  if (!limitResult.ok) {
    redirect("/vote/ballot?error=rate-limited");
  }

  const voterId = await getVoterSessionVoterId();
  if (!voterId) {
    redirect("/vote?error=session-expired");
  }

  const extractedSelections = extractSelectionsFromFormData(formData);
  const parsedSelections = ballotSelectionsSchema.safeParse(extractedSelections);
  if (!parsedSelections.success) {
    redirect("/vote/ballot?error=invalid-selection");
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const settings = await ensureElectionSettings(transaction);
      if (!settings.isOpen) {
        throw new BallotSubmissionError("election-closed");
      }

      const voter = await transaction.voter.findUnique({
        where: { id: voterId },
        include: {
          ballot: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!voter) {
        throw new BallotSubmissionError("session-expired");
      }

      if (voter.hasVoted || voter.ballot) {
        throw new BallotSubmissionError("duplicate-vote");
      }

      const [positions, candidates] = await Promise.all([
        transaction.position.findMany({
          select: {
            id: true,
            maxWinners: true,
          },
        }),
        transaction.candidate.findMany({
          select: {
            id: true,
            positionId: true,
          },
        }),
      ]);

      const validationResult = validateBallotSelections(
        parsedSelections.data,
        positions,
        candidates,
      );
      if (!validationResult.ok) {
        if (validationResult.code === "over-selection") {
          throw new BallotSubmissionError("over-selection");
        }
        throw new BallotSubmissionError("invalid-selection");
      }

      const ballot = await transaction.ballot.create({
        data: {
          voterId,
        },
      });

      if (validationResult.selections.length > 0) {
        await transaction.ballotSelection.createMany({
          data: validationResult.selections.map((selection) => ({
            ballotId: ballot.id,
            positionId: selection.positionId,
            candidateId: selection.candidateId,
          })),
        });
      }

      await transaction.voter.update({
        where: { id: voterId },
        data: { hasVoted: true },
      });
    });
  } catch (error) {
    if (error instanceof BallotSubmissionError) {
      if (error.code === "session-expired") {
        await clearVoterSession();
        redirect("/vote?error=session-expired");
      }
      if (error.code === "duplicate-vote") {
        await clearVoterSession();
        redirect("/vote?error=duplicate-vote");
      }
      if (error.code === "election-closed") {
        redirect("/vote?error=election-closed");
      }
      if (error.code === "over-selection") {
        redirect("/vote/ballot?error=over-selection");
      }
      redirect("/vote/ballot?error=invalid-selection");
    }

    if (isPrismaKnownRequestError(error, "P2002")) {
      await clearVoterSession();
      redirect("/vote?error=duplicate-vote");
    }

    redirect("/vote/ballot?error=submission-failed");
  }

  await clearVoterSession();
  revalidatePath("/admin/summary");
  revalidatePath("/admin/voters");
  redirect("/vote/success");
}
