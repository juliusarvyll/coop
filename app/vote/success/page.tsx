import Link from "next/link";

export default function VoteSuccessPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-10">
      <section className="rounded-xl border border-green-200 bg-green-50 p-8">
        <h1 className="text-2xl font-semibold text-green-900">Ballot Submitted</h1>
        <p className="mt-2 text-sm text-green-900/80">
          Your vote has been recorded successfully. Thank you for participating in the coop
          election.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/vote"
            className="rounded-md border border-green-300 bg-white px-4 py-2 text-sm text-green-900 hover:bg-green-100"
          >
            Back to Voter Login
          </Link>
          <Link
            href="/"
            className="rounded-md bg-green-700 px-4 py-2 text-sm text-white hover:bg-green-800"
          >
            Home
          </Link>
        </div>
      </section>
    </main>
  );
}
