"use server";

import { clearAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/admin/login?success=logged-out");
}
