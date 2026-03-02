"use server";

import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPrismaKnownRequestError } from "@/lib/prisma-errors";
import { positionInputSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function getId(value: FormDataEntryValue | null): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function createPosition(formData: FormData) {
  await requireAdminSession();

  const parsed = positionInputSchema.safeParse({
    name: formData.get("name"),
    maxWinners: formData.get("maxWinners"),
    displayOrder: formData.get("displayOrder"),
  });

  if (!parsed.success) {
    redirect("/admin/positions?error=invalid-position");
  }

  try {
    await prisma.position.create({
      data: parsed.data,
    });
  } catch (error) {
    if (isPrismaKnownRequestError(error, "P2002")) {
      redirect("/admin/positions?error=position-duplicate");
    }
    throw error;
  }

  revalidatePath("/admin/positions");
  revalidatePath("/admin/summary");
  revalidatePath("/vote/ballot");
  redirect("/admin/positions?success=position-created");
}

export async function updatePosition(formData: FormData) {
  await requireAdminSession();

  const id = getId(formData.get("id"));
  if (!id) {
    redirect("/admin/positions?error=invalid-id");
  }

  const parsed = positionInputSchema.safeParse({
    name: formData.get("name"),
    maxWinners: formData.get("maxWinners"),
    displayOrder: formData.get("displayOrder"),
  });

  if (!parsed.success) {
    redirect("/admin/positions?error=invalid-position");
  }

  try {
    await prisma.position.update({
      where: { id },
      data: parsed.data,
    });
  } catch (error) {
    if (isPrismaKnownRequestError(error, "P2002")) {
      redirect("/admin/positions?error=position-duplicate");
    }
    redirect("/admin/positions?error=position-update-failed");
  }

  revalidatePath("/admin/positions");
  revalidatePath("/admin/summary");
  revalidatePath("/vote/ballot");
  redirect("/admin/positions?success=position-updated");
}

export async function deletePosition(formData: FormData) {
  await requireAdminSession();

  const id = getId(formData.get("id"));
  if (!id) {
    redirect("/admin/positions?error=invalid-id");
  }

  try {
    await prisma.position.delete({
      where: { id },
    });
  } catch {
    redirect("/admin/positions?error=position-delete-failed");
  }

  revalidatePath("/admin/positions");
  revalidatePath("/admin/summary");
  revalidatePath("/vote/ballot");
  redirect("/admin/positions?success=position-deleted");
}
