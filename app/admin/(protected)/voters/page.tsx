import {
  createVoter,
  deleteVoter,
  importVoters,
  updateVoter,
} from "@/app/admin/(protected)/voters/actions";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readFirst(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getMessage(
  error: string | undefined,
  success: string | undefined,
  importCount: number | null,
): string | null {
  if (success) {
    if (success === "voter-created") return "Voter created.";
    if (success === "voter-updated") return "Voter updated.";
    if (success === "voter-deleted") return "Voter deleted.";
    if (success === "voters-imported") return `Imported ${importCount ?? 0} voter(s).`;
  }

  if (error) {
    if (error === "voter-duplicate") return "A voter with this coop ID already exists.";
    if (error === "invalid-import")
      return "Invalid import format. Use one row per voter: COOP-ID or COOP-ID, Full Name";
    if (error === "invalid-voter") return "Invalid voter input values.";
    if (error === "voter-delete-failed")
      return "Unable to delete voter. Voters with submitted ballots cannot be deleted.";
    return "Voter action failed.";
  }

  return null;
}

export default async function VotersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const success = readFirst(params.success);
  const error = readFirst(params.error);
  const countRaw = Number(readFirst(params.count));
  const importCount = Number.isFinite(countRaw) ? countRaw : null;
  const message = getMessage(error, success, importCount);

  const [voters, totalCount, votedCount] = await Promise.all([
    prisma.voter.findMany({
      orderBy: [{ createdAt: "desc" }],
      include: {
        ballot: {
          select: {
            submittedAt: true,
          },
        },
      },
    }),
    prisma.voter.count(),
    prisma.voter.count({
      where: {
        hasVoted: true,
      },
    }),
  ]);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Voters</h2>
        <p className="text-sm text-black/65">
          Manage eligible voters by coop ID. Voters can submit exactly one ballot.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-black/55">Total voters</p>
          <p className="mt-2 text-2xl font-semibold">{totalCount}</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-black/55">Already voted</p>
          <p className="mt-2 text-2xl font-semibold">{votedCount}</p>
        </div>
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

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <h3 className="text-base font-semibold">Add Voter</h3>
          <form action={createVoter} className="mt-3 space-y-3">
            <label className="block text-xs text-black/65">
              <span className="mb-1 block">Coop ID</span>
              <input
                name="coopId"
                className="w-full rounded-md border border-black/15 px-3 py-2 text-sm"
                placeholder="COOP-1234"
                required
              />
            </label>
            <label className="block text-xs text-black/65">
              <span className="mb-1 block">Full Name (optional)</span>
              <input
                name="fullName"
                className="w-full rounded-md border border-black/15 px-3 py-2 text-sm"
                placeholder="Juan Dela Cruz"
              />
            </label>
            <button
              type="submit"
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/85"
            >
              Add
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-4">
          <h3 className="text-base font-semibold">Bulk Import</h3>
          <p className="mt-1 text-xs text-black/60">
            Format: one voter per line as <code>COOP-ID</code> or <code>COOP-ID, Full Name</code>.
          </p>
          <form action={importVoters} className="mt-3 space-y-3">
            <textarea
              name="rows"
              rows={8}
              className="w-full rounded-md border border-black/15 px-3 py-2 text-sm"
              placeholder={"COOP-1001, Alex Rivera\nCOOP-1002, Bianca Dela Cruz\nCOOP-1003"}
              required
            />
            <button
              type="submit"
              className="rounded-md border border-black/20 px-4 py-2 text-sm hover:bg-black/5"
            >
              Import
            </button>
          </form>
        </div>
      </div>

      {voters.length === 0 ? (
        <div className="rounded-xl border border-black/10 bg-white p-4 text-sm text-black/60">
          No voters yet.
        </div>
      ) : null}

      <div className="space-y-3">
        {voters.map((voter) => (
          <div key={voter.id} className="rounded-xl border border-black/10 bg-white p-4">
            <form action={updateVoter} className="grid gap-3 md:grid-cols-[1.5fr_2fr_auto]">
              <input type="hidden" name="id" value={voter.id} />

              <label className="text-xs text-black/65">
                <span className="mb-1 block">Coop ID</span>
                <input
                  name="coopId"
                  defaultValue={voter.coopId}
                  className="w-full rounded-md border border-black/15 px-3 py-2 text-sm"
                  required
                />
              </label>

              <label className="text-xs text-black/65">
                <span className="mb-1 block">Full Name</span>
                <input
                  name="fullName"
                  defaultValue={voter.fullName ?? ""}
                  className="w-full rounded-md border border-black/15 px-3 py-2 text-sm"
                />
              </label>

              <button
                type="submit"
                className="self-end rounded-md border border-black/20 px-3 py-2 text-sm hover:bg-black/5"
              >
                Save
              </button>
            </form>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-black/60">
                Status: {voter.hasVoted ? "Voted" : "Not voted"}{" "}
                {voter.ballot ? `| Submitted: ${voter.ballot.submittedAt.toLocaleString()}` : ""}
              </p>

              <form action={deleteVoter}>
                <input type="hidden" name="id" value={voter.id} />
                <button
                  type="submit"
                  className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
