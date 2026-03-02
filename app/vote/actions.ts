"use server";

import { clearVoterSession, setVoterSession } from "@/lib/auth";
import { ensureElectionSettings } from "@/lib/election";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getClientIdentifier } from "@/lib/request";
import { voteLoginSchema } from "@/lib/validation";
import { normalizeCoopId } from "@/lib/coop-id";
import { redirect } from "next/navigation";

export async function startVotingSession(formData: FormData) {
  const parsed = voteLoginSchema.safeParse({
    coopId: formData.get("coopId"),
  });

  if (!parsed.success) {
    redirect("/vote?error=invalid-coop-id");
  }

  const clientId = await getClientIdentifier();
  const limitResult = consumeRateLimit(`vote-check:${clientId}`, 15, 60_000);
  if (!limitResult.ok) {
    redirect("/vote?error=rate-limited");
  }

  const settings = await ensureElectionSettings(prisma);
  if (!settings.isOpen) {
    redirect("/vote?error=election-closed");
  }

  const coopIdNormalized = normalizeCoopId(parsed.data.coopId);
  const voter = await prisma.voter.findUnique({
    where: { coopIdNormalized },
    select: {
      id: true,
      hasVoted: true,
    },
  });

  if (!voter) {
    redirect("/vote?error=invalid-coop-id");
  }

  if (voter.hasVoted) {
    redirect("/vote?error=duplicate-vote");
  }

  await setVoterSession(voter.id);
  redirect("/vote/ballot");
}

export async function clearVotingSession() {
  await clearVoterSession();
  redirect("/vote");
}
