import { PrismaClient } from "@prisma/client";

type DbClient = Pick<PrismaClient, "electionSettings">;

export async function ensureElectionSettings(db: DbClient) {
  return db.electionSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      isOpen: false,
    },
  });
}
