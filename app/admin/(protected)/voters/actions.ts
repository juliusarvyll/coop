"use server";

import { requireAdminSession } from "@/lib/auth";
import { normalizeCoopId } from "@/lib/coop-id";
import { prisma } from "@/lib/prisma";
import { isPrismaKnownRequestError } from "@/lib/prisma-errors";
import { positiveIntIdSchema, voterBulkImportSchema, voterInputSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseId(value: FormDataEntryValue | null): number | null {
  const parsed = positiveIntIdSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function optionalName(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function createVoter(formData: FormData) {
  await requireAdminSession();

  const parsed = voterInputSchema.safeParse({
    coopId: formData.get("coopId"),
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    redirect("/admin/voters?error=invalid-voter");
  }

  const coopId = parsed.data.coopId;
  const coopIdNormalized = normalizeCoopId(coopId);
  const fullName = optionalName(parsed.data.fullName);

  try {
    await prisma.voter.create({
      data: {
        coopId,
        coopIdNormalized,
        fullName,
      },
    });
  } catch (error) {
    if (isPrismaKnownRequestError(error, "P2002")) {
      redirect("/admin/voters?error=voter-duplicate");
    }
    throw error;
  }

  revalidatePath("/admin/voters");
  redirect("/admin/voters?success=voter-created");
}

export async function updateVoter(formData: FormData) {
  await requireAdminSession();

  const id = parseId(formData.get("id"));
  if (!id) {
    redirect("/admin/voters?error=invalid-id");
  }

  const parsed = voterInputSchema.safeParse({
    coopId: formData.get("coopId"),
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    redirect("/admin/voters?error=invalid-voter");
  }

  try {
    await prisma.voter.update({
      where: { id },
      data: {
        coopId: parsed.data.coopId,
        coopIdNormalized: normalizeCoopId(parsed.data.coopId),
        fullName: optionalName(parsed.data.fullName),
      },
    });
  } catch (error) {
    if (isPrismaKnownRequestError(error, "P2002")) {
      redirect("/admin/voters?error=voter-duplicate");
    }
    redirect("/admin/voters?error=voter-update-failed");
  }

  revalidatePath("/admin/voters");
  redirect("/admin/voters?success=voter-updated");
}

export async function deleteVoter(formData: FormData) {
  await requireAdminSession();

  const id = parseId(formData.get("id"));
  if (!id) {
    redirect("/admin/voters?error=invalid-id");
  }

  try {
    await prisma.voter.delete({
      where: { id },
    });
  } catch {
    redirect("/admin/voters?error=voter-delete-failed");
  }

  revalidatePath("/admin/voters");
  redirect("/admin/voters?success=voter-deleted");
}

type ParsedImportRow = {
  coopId: string;
  coopIdNormalized: string;
  fullName: string | null;
};

function parseImportRows(rowsText: string): ParsedImportRow[] {
  const parsedRows = new Map<string, ParsedImportRow>();
  const lines = rowsText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const [coopIdPart, ...nameParts] = line.split(",");
    const coopId = coopIdPart?.trim() ?? "";
    if (!coopId) {
      continue;
    }

    const fullNameRaw = nameParts.join(",").trim();
    const coopIdNormalized = normalizeCoopId(coopId);
    if (!coopIdNormalized) {
      continue;
    }

    parsedRows.set(coopIdNormalized, {
      coopId,
      coopIdNormalized,
      fullName: fullNameRaw.length > 0 ? fullNameRaw : null,
    });
  }

  return [...parsedRows.values()];
}

export async function importVoters(formData: FormData) {
  await requireAdminSession();

  const parsed = voterBulkImportSchema.safeParse({
    rows: formData.get("rows"),
  });

  if (!parsed.success) {
    redirect("/admin/voters?error=invalid-import");
  }

  const rows = parseImportRows(parsed.data.rows);
  if (rows.length === 0) {
    redirect("/admin/voters?error=invalid-import");
  }

  let createdCount = 0;
  await prisma.$transaction(async (transaction) => {
    for (const row of rows) {
      const existing = await transaction.voter.findUnique({
        where: { coopIdNormalized: row.coopIdNormalized },
        select: { id: true },
      });

      if (existing) {
        continue;
      }

      await transaction.voter.create({
        data: row,
      });
      createdCount += 1;
    }
  });

  revalidatePath("/admin/voters");
  redirect(`/admin/voters?success=voters-imported&count=${createdCount}`);
}
