import { setElectionState } from "@/app/admin/(protected)/summary/actions";
import { ensureElectionSettings } from "@/lib/election";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type CandidateTally = {
  id: number;
  name: string;
  _count: {
    selections: number;
  };
};

type PositionTally = {
  id: number;
  name: string;
  maxWinners: number;
  _count: {
    selections: number;
  };
  candidates: CandidateTally[];
};

function readFirst(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getMessage(error: string | undefined, success: string | undefined): string | null {
  if (success === "election-opened") return "Election is now OPEN.";
  if (success === "election-closed") return "Election is now CLOSED.";
  if (error === "invalid-election-state") return "Invalid election state request.";
  return null;
}

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const error = readFirst(params.error);
  const success = readFirst(params.success);
  const message = getMessage(error, success);

  const [settings, positionCount, candidateCount, voterCount, votedCount, positions] =
    await Promise.all([
      ensureElectionSettings(prisma),
      prisma.position.count(),
      prisma.candidate.count(),
      prisma.voter.count(),
      prisma.voter.count({ where: { hasVoted: true } }),
      prisma.position.findMany({
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        include: {
          candidates: {
            orderBy: [{ name: "asc" }],
            include: {
              _count: {
                select: {
                  selections: true,
                },
              },
            },
          },
          _count: {
            select: {
              selections: true,
            },
          },
        },
      }),
    ]);

  const turnout = voterCount > 0 ? ((votedCount / voterCount) * 100).toFixed(1) : "0.0";

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Election Summary</h2>
          <p className="text-sm text-black/65">Monitor election status and current vote tallies.</p>
        </div>
        <Link
          href="/admin/summary/export.csv"
          className="rounded-md border border-black/20 px-3 py-2 text-sm hover:bg-black/5"
        >
          Export CSV
        </Link>
      </div>

      {message ? (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
          }`}
        >
          {message}
        </p>
      ) : null}

      <div className="rounded-xl border border-black/10 bg-white p-4">
        <h3 className="text-base font-semibold">Election Status</h3>
        <p className="mt-2 text-sm">
          Current state:{" "}
          <span className={settings.isOpen ? "font-semibold text-green-700" : "font-semibold text-red-700"}>
            {settings.isOpen ? "OPEN" : "CLOSED"}
          </span>
        </p>
        <div className="mt-3 flex gap-2">
          <form action={setElectionState}>
            <input type="hidden" name="isOpen" value="true" />
            <button
              type="submit"
              className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
            >
              Open Voting
            </button>
          </form>
          <form action={setElectionState}>
            <input type="hidden" name="isOpen" value="false" />
            <button
              type="submit"
              className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Close Voting
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-black/55">Positions</p>
          <p className="mt-2 text-2xl font-semibold">{positionCount}</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-black/55">Candidates</p>
          <p className="mt-2 text-2xl font-semibold">{candidateCount}</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-black/55">Eligible voters</p>
          <p className="mt-2 text-2xl font-semibold">{voterCount}</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-black/55">Ballots submitted</p>
          <p className="mt-2 text-2xl font-semibold">{votedCount}</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-black/55">Turnout</p>
          <p className="mt-2 text-2xl font-semibold">{turnout}%</p>
        </div>
      </div>

      <div className="space-y-3">
        {positions.map((position: PositionTally) => {
          const ranked = [...position.candidates].sort((left: CandidateTally, right: CandidateTally) => {
            const voteDiff = right._count.selections - left._count.selections;
            if (voteDiff !== 0) return voteDiff;
            return left.name.localeCompare(right.name);
          });

          const winnerIds = new Set(
            ranked
              .slice(0, Math.max(0, position.maxWinners))
              .map((candidate: CandidateTally) => candidate.id),
          );

          return (
            <div key={position.id} className="rounded-xl border border-black/10 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold">{position.name}</h3>
                  <p className="text-xs text-black/60">
                    Max winners: {position.maxWinners} | Total selections cast:{" "}
                    {position._count.selections}
                  </p>
                </div>
              </div>

              {ranked.length === 0 ? (
                <p className="mt-3 text-sm text-black/60">No candidates assigned yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {ranked.map((candidate: CandidateTally) => (
                    <li
                      key={candidate.id}
                      className="flex items-center justify-between rounded-md border border-black/10 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{candidate.name}</span>
                        {winnerIds.has(candidate.id) ? (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            Winner Slot
                          </span>
                        ) : null}
                      </div>
                      <span className="text-sm text-black/70">{candidate._count.selections} vote(s)</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
