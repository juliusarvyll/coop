import { isAdminAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminEntryPage() {
  if (await isAdminAuthenticated()) {
    redirect("/admin/summary");
  }

  redirect("/admin/login");
}
