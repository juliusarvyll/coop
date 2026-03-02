"use server";

import { setAdminSession, validateAdminCredentials } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getClientIdentifier } from "@/lib/request";
import { redirect } from "next/navigation";

export async function loginAdmin(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const clientId = await getClientIdentifier();
  const limitResult = consumeRateLimit(`admin-login:${clientId}`, 10, 60_000);
  if (!limitResult.ok) {
    redirect("/admin/login?error=rate-limited");
  }

  if (!username || !password) {
    redirect("/admin/login?error=missing-credentials");
  }

  if (!(await validateAdminCredentials(username, password))) {
    redirect("/admin/login?error=invalid-credentials");
  }

  await setAdminSession();
  redirect("/admin/summary?success=logged-in");
}
