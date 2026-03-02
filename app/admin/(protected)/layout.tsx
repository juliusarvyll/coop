import { logoutAdmin } from "@/app/admin/(protected)/actions";
import { requireAdminSession } from "@/lib/auth";
import Link from "next/link";

const adminLinks = [
  { href: "/admin/summary", label: "Summary" },
  { href: "/admin/positions", label: "Positions" },
  { href: "/admin/candidates", label: "Candidates" },
  { href: "/admin/voters", label: "Voters" },
];

export default async function AdminProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdminSession();

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold">Coop Voting Admin</h1>
            <p className="text-xs text-black/65">Manage election setup and monitor results.</p>
          </div>
          <form action={logoutAdmin}>
            <button
              type="submit"
              className="rounded-md border border-black/20 px-3 py-1.5 text-sm hover:bg-black/5"
            >
              Logout
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-6 md:grid-cols-[220px_1fr]">
        <aside className="rounded-xl border border-black/10 bg-white p-3">
          <nav className="space-y-1">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-md px-3 py-2 text-sm hover:bg-black/5"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/" className="block rounded-md px-3 py-2 text-sm text-blue-700 underline">
              Back to Home
            </Link>
          </nav>
        </aside>

        <main className="space-y-4">{children}</main>
      </div>
    </div>
  );
}
