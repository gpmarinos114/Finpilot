import { PrismaClient } from "@/generated/prisma/client";
import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "db-config.json");

interface DbConfig {
  backend: "local" | "turso";
  tursoUrl?: string;
  tursoToken?: string;
}

function loadConfig(): DbConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch {
    /* ignore */
  }
  return { backend: "local" };
}

function createLocalClient(): PrismaClient {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  });
  return new PrismaClient({ adapter });
}

async function createTursoClient(url: string, token: string): Promise<PrismaClient> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require("@libsql/client");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaLibSql } = require("@prisma/adapter-libsql");
  const libsql = createClient({ url, authToken: token });
  const adapter = new PrismaLibSql(libsql);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  prismaBackend: string;
};

async function getPrismaClient(): Promise<PrismaClient> {
  const config = loadConfig();
  const backend = config.backend;

  // Return cached client if backend hasn't changed
  if (globalForPrisma.prisma && globalForPrisma.prismaBackend === backend) {
    return globalForPrisma.prisma;
  }

  // Disconnect old client if backend changed
  if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect().catch(() => {});
  }

  let client: PrismaClient;
  if (backend === "turso" && config.tursoUrl && config.tursoToken) {
    try {
      client = await createTursoClient(config.tursoUrl, config.tursoToken);
    } catch (err) {
      console.error("Turso connection failed, falling back to local SQLite:", err);
      client = createLocalClient();
    }
  } else {
    client = createLocalClient();
  }

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaBackend = backend;
  }

  return client;
}

// Lazy singleton — initialized on first access
let _prisma: PrismaClient | null = null;
let _initPromise: Promise<PrismaClient> | null = null;

export async function getDb(): Promise<PrismaClient> {
  if (_prisma) return _prisma;
  if (!_initPromise) {
    _initPromise = getPrismaClient().then((client) => {
      _prisma = client;
      return client;
    });
  }
  return _initPromise;
}

// For backward compatibility — synchronous access assumes local backend
// Prefer `getDb()` in new code
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!_prisma) {
      _prisma = createLocalClient();
    }
    const value = (_prisma as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(_prisma);
    }
    return value;
  },
});
