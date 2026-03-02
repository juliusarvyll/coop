import { startVotingSession } from "@/app/vote/actions";
import { getVoterSessionVoterId } from "@/lib/auth";
import { ensureElectionSettings } from "@/lib/election";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readFirst(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getErrorMessage(error: string | undefined): string | null {
  if (!error) return null;
  if (error === "invalid-coop-id") return "Invalid coop ID.";
  if (error === "duplicate-vote") return "This coop ID has already submitted a ballot.";
  if (error === "election-closed") return "Voting is currently closed.";
  if (error === "session-expired") return "Session expired. Please enter your coop ID again.";
  if (error === "rate-limited") return "Too many attempts. Please wait and try again.";
  return "Unable to continue. Please try again.";
}

export default async function VotePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const error = readFirst(params.error);
  const message = getErrorMessage(error);

  const [settings, sessionVoterId] = await Promise.all([
    ensureElectionSettings(prisma),
    getVoterSessionVoterId(),
  ]);

  if (sessionVoterId) {
    const voter = await prisma.voter.findUnique({
      where: { id: sessionVoterId },
      select: {
        hasVoted: true,
      },
    });

    if (voter && !voter.hasVoted && settings.isOpen) {
      redirect("/vote/ballot");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-10">
      <div className="rounded-xl border border-black/10 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Voter Dashboard</h1>
        <p className="mt-2 text-sm text-black/65">
          Enter your coop ID to continue to ballot submission.
        </p>

        <p className="mt-3 text-sm">
          Election status:{" "}
          <span className={settings.isOpen ? "font-semibold text-green-700" : "font-semibold text-red-700"}>
            {settings.isOpen ? "OPEN" : "CLOSED"}
          </span>
        </p>

        {message ? (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>
        ) : null}

        <form action={startVotingSession} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Coop ID</span>
            <input
              name="coopId"
              type="text"
              placeholder="COOP-1001"
              className="w-full rounded-md border border-black/15 px-3 py-2 outline-none ring-0 focus:border-black/40"
              required
            />
          </label>

          <button
            type="submit"
            className="inline-flex rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/85 disabled:cursor-not-allowed disabled:bg-black/40"
            disabled={!settings.isOpen}
          >
            Continue to Ballot
          </button>
        </form>
      </div>

      <Link href="/" className="mt-4 text-sm text-blue-700 underline">
        Back to home
      </Link>
    </main>
  );
}
