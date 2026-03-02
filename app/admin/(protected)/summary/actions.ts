"use server";

import { ensureElectionSettings } from "@/lib/election";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { electionStateSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function setElectionState(formData: FormData) {
  await requireAdminSession();

  const parsed = electionStateSchema.safeParse({
    isOpen: formData.get("isOpen"),
  });

  if (!parsed.success) {
    redirect("/admin/summary?error=invalid-election-state");
  }

  const isOpen = parsed.data.isOpen === "true";
  await ensureElectionSettings(prisma);
  await prisma.electionSettings.update({
    where: { id: 1 },
    data: { isOpen },
  });

  revalidatePath("/admin/summary");
  revalidatePath("/vote");
  revalidatePath("/vote/ballot");
  redirect(`/admin/summary?success=${isOpen ? "election-opened" : "election-closed"}`);
}
