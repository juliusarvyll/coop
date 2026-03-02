import { submitBallot } from "@/app/vote/ballot/actions";
import { clearVotingSession } from "@/app/vote/actions";
import { getVoterSessionVoterId } from "@/lib/auth";
import { ensureElectionSettings } from "@/lib/election";
import { prisma } from "@/lib/prisma";
import { BallotForm } from "./ballot-form";
import { redirect } from "next/navigation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readFirst(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getErrorMessage(error: string | undefined): string | null {
  if (!error) return null;
  if (error === "over-selection")
    return "You selected more candidates than allowed for at least one position.";
  if (error === "invalid-selection")
    return "Invalid candidate selection detected. Please review your ballot and try again.";
  if (error === "rate-limited")
    return "Too many submission attempts. Please wait a moment before trying again.";
  if (error === "submission-failed") return "Ballot submission failed. Please try again.";
  return "Unable to submit ballot.";
}

export default async function BallotPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const voterId = await getVoterSessionVoterId();
  if (!voterId) {
    redirect("/vote?error=session-expired");
  }

  const params = await searchParams;
  const error = readFirst(params.error);
  const errorMessage = getErrorMessage(error);

  const [settings, voter, positions] = await Promise.all([
    ensureElectionSettings(prisma),
    prisma.voter.findUnique({
      where: { id: voterId },
      select: {
        id: true,
        fullName: true,
        coopId: true,
        hasVoted: true,
      },
    }),
    prisma.position.findMany({
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      include: {
        candidates: {
          orderBy: [{ name: "asc" }],
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
  ]);

  if (!voter) {
    redirect("/vote?error=session-expired");
  }

  if (voter.hasVoted) {
    redirect("/vote/success");
  }

  if (!settings.isOpen) {
    redirect("/vote?error=election-closed");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/10 bg-white p-4">
        <div>
          <h1 className="text-xl font-semibold">Ballot Form</h1>
          <p className="text-sm text-black/65">
            Voter: {voter.fullName ?? "Unnamed voter"} ({voter.coopId})
          </p>
        </div>
        <form action={clearVotingSession}>
          <button
            type="submit"
            className="rounded-md border border-black/20 px-3 py-2 text-sm hover:bg-black/5"
          >
            Use Different Coop ID
          </button>
        </form>
      </div>

      {errorMessage ? (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
      ) : null}

      {positions.length === 0 ? (
        <section className="rounded-xl border border-black/10 bg-white p-4 text-sm text-black/65">
          No positions are configured yet. Please contact the election administrator.
        </section>
      ) : (
        <BallotForm positions={positions} submitAction={submitBallot} />
      )}
    </main>
  );
}
