import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
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
      return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    }
  } catch { /* ignore */ }
  return { backend: "local" };
}

function saveConfig(config: DbConfig) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export async function GET() {
  const prisma = await getDb();
  const settings = await prisma.setting.findMany();
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;

  // Merge in DB config
  const dbConfig = loadConfig();
  map.DB_BACKEND = dbConfig.backend;
  if (dbConfig.tursoUrl) map.TURSO_URL = dbConfig.tursoUrl;
  if (dbConfig.tursoToken) map.TURSO_TOKEN = dbConfig.tursoToken;

  return NextResponse.json(map);
}

export async function PUT(req: NextRequest) {
  const data = await req.json();
  const entries = Object.entries(data) as [string, string][];

  // Handle DB config separately (stored in file, not DB)
  const dbKeys = ["DB_BACKEND", "TURSO_URL", "TURSO_TOKEN"];
  const dbEntries = entries.filter(([k]) => dbKeys.includes(k));
  const settingEntries = entries.filter(([k]) => !dbKeys.includes(k));

  // Save DB config to file
  if (dbEntries.length > 0) {
    const config = loadConfig();
    for (const [key, value] of dbEntries) {
      if (key === "DB_BACKEND") config.backend = value as "local" | "turso";
      if (key === "TURSO_URL") config.tursoUrl = value;
      if (key === "TURSO_TOKEN") config.tursoToken = value;
    }
    saveConfig(config);
  }

  // Save other settings to DB
  const prisma = await getDb();
  for (const [key, value] of settingEntries) {
    await prisma.setting.upsert({
      where: { key },
      update: { value: value as string },
      create: { key, value: value as string },
    });
  }

  return NextResponse.json({ success: true });
}
