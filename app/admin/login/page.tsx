import { isAdminAuthenticated } from "@/lib/auth";
import { loginAdmin } from "@/app/admin/login/actions";
import Link from "next/link";
import { redirect } from "next/navigation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readFirst(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (await isAdminAuthenticated()) {
    redirect("/admin/summary");
  }

  const params = await searchParams;
  const error = readFirst(params.error);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-10">
      <div className="rounded-xl border border-black/10 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Admin Login</h1>
        <p className="mt-2 text-sm text-black/70">
          Sign in to manage candidates, positions, voters, and election settings.
        </p>

        {error ? (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error === "rate-limited"
              ? "Too many login attempts. Please wait a minute and try again."
              : error === "missing-credentials"
                ? "Please provide both username and password."
                : "Invalid username or password."}
          </p>
        ) : null}

        <form action={loginAdmin} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Username</span>
            <input
              name="username"
              type="text"
              className="w-full rounded-md border border-black/15 px-3 py-2 outline-none ring-0 focus:border-black/40"
              required
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Password</span>
            <input
              name="password"
              type="password"
              className="w-full rounded-md border border-black/15 px-3 py-2 outline-none ring-0 focus:border-black/40"
              required
            />
          </label>

          <button
            type="submit"
            className="inline-flex rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/85"
          >
            Sign in
          </button>
        </form>
      </div>

      <Link href="/" className="mt-4 text-sm text-blue-700 underline">
        Back to home
      </Link>
    </main>
  );
}
