import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

type GlobalForPrisma = {
  prisma?: PrismaClient;
  prismaPool?: Pool;
};

const globalForPrisma = globalThis as unknown as GlobalForPrisma;

function getConnectionString(): string {
  const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL or DIRECT_URL must be set.");
  }
  return connectionString;
}

function getPool(): Pool {
  if (!globalForPrisma.prismaPool) {
    globalForPrisma.prismaPool = new Pool({
      connectionString: getConnectionString(),
    });
  }

  return globalForPrisma.prismaPool;
}

function createPrismaClient() {
  const adapter = new PrismaPg(getPool());

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client as unknown as object, property, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
