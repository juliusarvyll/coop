"use server";

import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPrismaKnownRequestError } from "@/lib/prisma-errors";
import { candidateInputSchema, positiveIntIdSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseId(value: FormDataEntryValue | null): number | null {
  const parsed = positiveIntIdSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export async function createCandidate(formData: FormData) {
  await requireAdminSession();

  const parsed = candidateInputSchema.safeParse({
    name: formData.get("name"),
    positionId: formData.get("positionId"),
  });

  if (!parsed.success) {
    redirect("/admin/candidates?error=invalid-candidate");
  }

  try {
    await prisma.candidate.create({
      data: parsed.data,
    });
  } catch (error) {
    if (isPrismaKnownRequestError(error, "P2002")) {
      redirect("/admin/candidates?error=candidate-duplicate");
    }
    if (isPrismaKnownRequestError(error, "P2003")) {
      redirect("/admin/candidates?error=invalid-position");
    }
    throw error;
  }

  revalidatePath("/admin/candidates");
  revalidatePath("/admin/summary");
  revalidatePath("/vote/ballot");
  redirect("/admin/candidates?success=candidate-created");
}

export async function updateCandidate(formData: FormData) {
  await requireAdminSession();

  const id = parseId(formData.get("id"));
  if (!id) {
    redirect("/admin/candidates?error=invalid-id");
  }

  const parsed = candidateInputSchema.safeParse({
    name: formData.get("name"),
    positionId: formData.get("positionId"),
  });

  if (!parsed.success) {
    redirect("/admin/candidates?error=invalid-candidate");
  }

  try {
    await prisma.candidate.update({
      where: { id },
      data: parsed.data,
    });
  } catch (error) {
    if (isPrismaKnownRequestError(error, "P2002")) {
      redirect("/admin/candidates?error=candidate-duplicate");
    }
    if (isPrismaKnownRequestError(error, "P2003")) {
      redirect("/admin/candidates?error=invalid-position");
    }
    redirect("/admin/candidates?error=candidate-update-failed");
  }

  revalidatePath("/admin/candidates");
  revalidatePath("/admin/summary");
  revalidatePath("/vote/ballot");
  redirect("/admin/candidates?success=candidate-updated");
}

export async function deleteCandidate(formData: FormData) {
  await requireAdminSession();

  const id = parseId(formData.get("id"));
  if (!id) {
    redirect("/admin/candidates?error=invalid-id");
  }

  try {
    await prisma.candidate.delete({
      where: { id },
    });
  } catch {
    redirect("/admin/candidates?error=candidate-delete-failed");
  }

  revalidatePath("/admin/candidates");
  revalidatePath("/admin/summary");
  revalidatePath("/vote/ballot");
  redirect("/admin/candidates?success=candidate-deleted");
}
