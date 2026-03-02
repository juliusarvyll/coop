import {
  createCandidate,
  deleteCandidate,
  updateCandidate,
} from "@/app/admin/(protected)/candidates/actions";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readFirst(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getMessage(error: string | undefined, success: string | undefined): string | null {
  if (success) {
    if (success === "candidate-created") return "Candidate created.";
    if (success === "candidate-updated") return "Candidate updated.";
    if (success === "candidate-deleted") return "Candidate deleted.";
  }

  if (error) {
    if (error === "candidate-duplicate")
      return "Candidate name already exists for the selected position.";
    if (error === "candidate-delete-failed")
      return "Unable to delete candidate. This candidate may already be part of recorded ballots.";
    if (error === "invalid-position") return "Selected position is invalid.";
    if (error === "invalid-candidate")
      return "Invalid candidate values. Ensure name and position are provided.";
    return "Candidate action failed.";
  }

  return null;
}

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const success = readFirst(params.success);
  const error = readFirst(params.error);
  const message = getMessage(error, success);

  const [positions, candidates] = await Promise.all([
    prisma.position.findMany({
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.candidate.findMany({
      orderBy: [{ position: { displayOrder: "asc" } }, { position: { name: "asc" } }, { name: "asc" }],
      include: {
        position: true,
        _count: {
          select: {
            selections: true,
          },
        },
      },
    }),
  ]);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Candidates</h2>
        <p className="text-sm text-black/65">
          Add and maintain candidates, then assign each candidate to one position.
        </p>
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
        <h3 className="text-base font-semibold">Add Candidate</h3>
        {positions.length === 0 ? (
          <p className="mt-3 text-sm text-black/65">
            Create positions first before adding candidates.
          </p>
        ) : (
          <form action={createCandidate} className="mt-3 grid gap-3 md:grid-cols-[2fr_1.5fr_auto]">
            <input
              name="name"
              placeholder="Candidate name"
              className="rounded-md border border-black/15 px-3 py-2 text-sm"
              required
            />
            <select
              name="positionId"
              className="rounded-md border border-black/15 px-3 py-2 text-sm"
              defaultValue={positions[0]?.id}
              required
            >
              {positions.map((position: { id: number; name: string }) => (
                <option key={position.id} value={position.id}>
                  {position.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/85"
            >
              Add
            </button>
          </form>
        )}
      </div>

      {candidates.length === 0 ? (
        <div className="rounded-xl border border-black/10 bg-white p-4 text-sm text-black/60">
          No candidates yet.
        </div>
      ) : null}

      <div className="space-y-3">
        {candidates.map((candidate) => (
          <div key={candidate.id} className="rounded-xl border border-black/10 bg-white p-4">
            <form action={updateCandidate} className="grid gap-3 md:grid-cols-[2fr_1.5fr_auto]">
              <input type="hidden" name="id" value={candidate.id} />

              <label className="text-xs text-black/65">
                <span className="mb-1 block">Candidate Name</span>
                <input
                  name="name"
                  defaultValue={candidate.name}
                  className="w-full rounded-md border border-black/15 px-3 py-2 text-sm"
                  required
                />
              </label>

              <label className="text-xs text-black/65">
                <span className="mb-1 block">Position</span>
                <select
                  name="positionId"
                  defaultValue={candidate.positionId}
                  className="w-full rounded-md border border-black/15 px-3 py-2 text-sm"
                  required
                >
                  {positions.map((position: { id: number; name: string }) => (
                    <option key={position.id} value={position.id}>
                      {position.name}
                    </option>
                  ))}
                </select>
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
                Position: {candidate.position.name} | Ballot selections: {candidate._count.selections}
              </p>

              <form action={deleteCandidate}>
                <input type="hidden" name="id" value={candidate.id} />
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
