import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL waa lagama maarmaan .env-ka gudihiisa.");
}

// Neon requires SSL; node-pg (used by Prisma 7 driver adapters) needs this
// explicitly set instead of relying on the old query-engine defaults.
const adapter = new PrismaPg({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
