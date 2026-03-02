/* eslint-disable @typescript-eslint/no-require-imports */
const { randomBytes, scryptSync } = require("node:crypto");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL must be set.");
}

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

function normalizeCoopId(input) {
  return input.trim().toLowerCase().replace(/[\s-]+/g, "");
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 64).toString("base64url");
  return `s1$${salt}$${hash}`;
}

async function main() {
  const adminUsername = (process.env.ADMIN_USERNAME ?? "admin").trim();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";

  if (!adminUsername || !adminPassword) {
    throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD must be set for seeding.");
  }

  await prisma.adminUser.upsert({
    where: { username: adminUsername },
    update: {
      passwordHash: hashPassword(adminPassword),
      isActive: true,
    },
    create: {
      username: adminUsername,
      passwordHash: hashPassword(adminPassword),
      isActive: true,
    },
  });

  await prisma.electionSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      isOpen: false,
    },
  });

  const seedPositions = [
    {
      name: "Chairperson",
      maxWinners: 1,
      displayOrder: 1,
      candidates: ["Maria Santos", "John Cruz"],
    },
    {
      name: "Board Member",
      maxWinners: 2,
      displayOrder: 2,
      candidates: ["Ana Lopez", "Carlo Reyes", "Nina Bautista"],
    },
  ];

  for (const positionSeed of seedPositions) {
    const position = await prisma.position.upsert({
      where: { name: positionSeed.name },
      update: {
        maxWinners: positionSeed.maxWinners,
        displayOrder: positionSeed.displayOrder,
      },
      create: {
        name: positionSeed.name,
        maxWinners: positionSeed.maxWinners,
        displayOrder: positionSeed.displayOrder,
      },
    });

    for (const candidateName of positionSeed.candidates) {
      await prisma.candidate.upsert({
        where: {
          positionId_name: {
            positionId: position.id,
            name: candidateName,
          },
        },
        update: {},
        create: {
          name: candidateName,
          positionId: position.id,
        },
      });
    }
  }

  const seedVoters = [
    { coopId: "COOP-1001", fullName: "Alex Rivera" },
    { coopId: "COOP-1002", fullName: "Bianca Dela Cruz" },
    { coopId: "COOP-1003", fullName: "Miguel Torres" },
  ];

  for (const voter of seedVoters) {
    await prisma.voter.upsert({
      where: { coopIdNormalized: normalizeCoopId(voter.coopId) },
      update: {},
      create: {
        coopId: voter.coopId,
        coopIdNormalized: normalizeCoopId(voter.coopId),
        fullName: voter.fullName,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
