import {
  createPosition,
  deletePosition,
  updatePosition,
} from "@/app/admin/(protected)/positions/actions";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readFirst(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getMessage(error: string | undefined, success: string | undefined): string | null {
  if (success) {
    if (success === "position-created") return "Position created.";
    if (success === "position-updated") return "Position updated.";
    if (success === "position-deleted") return "Position deleted.";
  }

  if (error) {
    if (error === "position-duplicate") return "Position name already exists.";
    if (error === "position-delete-failed")
      return "Unable to delete position. It may already be used by recorded votes.";
    if (error === "invalid-position")
      return "Invalid position values. Ensure name is set and max winners is at least 1.";
    return "Position action failed.";
  }

  return null;
}

export default async function PositionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const success = readFirst(params.success);
  const error = readFirst(params.error);
  const message = getMessage(error, success);

  const positions = await prisma.position.findMany({
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          candidates: true,
          selections: true,
        },
      },
    },
  });

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Positions</h2>
        <p className="text-sm text-black/65">
          Configure election positions and maximum winners for each position.
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
        <h3 className="text-base font-semibold">Add Position</h3>
        <form action={createPosition} className="mt-3 grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
          <input
            name="name"
            placeholder="Position name"
            className="rounded-md border border-black/15 px-3 py-2 text-sm"
            required
          />
          <input
            name="maxWinners"
            type="number"
            min={1}
            max={20}
            placeholder="Max winners"
            className="rounded-md border border-black/15 px-3 py-2 text-sm"
            required
          />
          <input
            name="displayOrder"
            type="number"
            min={0}
            max={9999}
            placeholder="Display order"
            className="rounded-md border border-black/15 px-3 py-2 text-sm"
            defaultValue={positions.length + 1}
            required
          />
          <button
            type="submit"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/85"
          >
            Add
          </button>
        </form>
      </div>

      {positions.length === 0 ? (
        <div className="rounded-xl border border-black/10 bg-white p-4 text-sm text-black/60">
          No positions yet.
        </div>
      ) : null}

      <div className="space-y-3">
        {positions.map((position) => (
          <div key={position.id} className="rounded-xl border border-black/10 bg-white p-4">
            <form action={updatePosition} className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
              <input type="hidden" name="id" value={position.id} />

              <label className="text-xs text-black/65">
                <span className="mb-1 block">Position Name</span>
                <input
                  name="name"
                  defaultValue={position.name}
                  className="w-full rounded-md border border-black/15 px-3 py-2 text-sm"
                  required
                />
              </label>

              <label className="text-xs text-black/65">
                <span className="mb-1 block">Max Winners</span>
                <input
                  name="maxWinners"
                  type="number"
                  min={1}
                  max={20}
                  defaultValue={position.maxWinners}
                  className="w-full rounded-md border border-black/15 px-3 py-2 text-sm"
                  required
                />
              </label>

              <label className="text-xs text-black/65">
                <span className="mb-1 block">Display Order</span>
                <input
                  name="displayOrder"
                  type="number"
                  min={0}
                  max={9999}
                  defaultValue={position.displayOrder}
                  className="w-full rounded-md border border-black/15 px-3 py-2 text-sm"
                  required
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
                Candidates: {position._count.candidates} | Votes cast (selections):{" "}
                {position._count.selections}
              </p>

              <form action={deletePosition}>
                <input type="hidden" name="id" value={position.id} />
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
