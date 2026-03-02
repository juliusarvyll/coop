import { z } from "zod";

export const positionInputSchema = z.object({
  name: z.string().trim().min(1, "Position name is required.").max(100),
  maxWinners: z.coerce.number().int().min(1).max(20),
  displayOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const candidateInputSchema = z.object({
  name: z.string().trim().min(1, "Candidate name is required.").max(100),
  positionId: z.coerce.number().int().positive(),
});

export const voterInputSchema = z.object({
  coopId: z.string().trim().min(1, "Coop ID is required.").max(50),
  fullName: z.string().trim().max(120).optional().or(z.literal("")),
});

export const voterBulkImportSchema = z.object({
  rows: z.string().trim().min(1, "Provide at least one voter row."),
});

export const voteLoginSchema = z.object({
  coopId: z.string().trim().min(1, "Coop ID is required.").max(50),
});

export const positiveIntIdSchema = z.coerce.number().int().positive();

export const electionStateSchema = z.object({
  isOpen: z.enum(["true", "false"]),
});

export const ballotPositionSelectionSchema = z.object({
  positionId: z.number().int().positive(),
  candidateIds: z.array(z.number().int().positive()),
});

export const ballotSelectionsSchema = z.array(ballotPositionSelectionSchema);
