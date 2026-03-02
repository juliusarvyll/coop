import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-10">
      <section className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-black/55">Coop Voting</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Election Control Panel</h1>
        <p className="mt-3 max-w-2xl text-sm text-black/70">
          Manage positions, candidates, and voters from the admin dashboard. Voters can submit
          one ballot using their coop ID when the election is open.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            href="/admin"
            className="rounded-xl border border-black/15 p-4 transition-colors hover:bg-black/5"
          >
            <h2 className="text-base font-semibold">Admin Dashboard</h2>
            <p className="mt-1 text-sm text-black/65">
              Configure election settings, candidates, voters, and view tallies.
            </p>
          </Link>

          <Link
            href="/vote"
            className="rounded-xl border border-black/15 p-4 transition-colors hover:bg-black/5"
          >
            <h2 className="text-base font-semibold">Voter Dashboard</h2>
            <p className="mt-1 text-sm text-black/65">
              Enter coop ID, complete ballot by position, and submit one vote.
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
