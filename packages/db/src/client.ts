import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function getDatasourceUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return undefined;
  }

  const configuredConnectionLimit = process.env.DATABASE_POOL_SIZE;
  const connectionLimit =
    configuredConnectionLimit ??
    (process.env.VERCEL === "1" ? "1" : undefined) ??
    (process.env.NODE_ENV === "production" ? "5" : undefined);
  const poolTimeout = process.env.DATABASE_POOL_TIMEOUT;

  if (!connectionLimit && !poolTimeout) {
    return databaseUrl;
  }

  const url = new URL(databaseUrl);

  if (
    connectionLimit &&
    (configuredConnectionLimit || !url.searchParams.has("connection_limit"))
  ) {
    url.searchParams.set("connection_limit", connectionLimit);
  }

  if (poolTimeout && !url.searchParams.has("pool_timeout")) {
    url.searchParams.set("pool_timeout", poolTimeout);
  }

  return url.toString();
}

const datasourceUrl = getDatasourceUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(datasourceUrl ? { datasourceUrl } : {}),
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
