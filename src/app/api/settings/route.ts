import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "db-config.json");
const API_KEYS_PATH = path.join(process.cwd(), "api-keys.json");

interface DbConfig {
  backend: "local" | "turso";
  tursoUrl?: string;
  tursoToken?: string;
}

const API_KEY_NAMES = ["DEEPSEEK_API_KEY", "MIMO_API_KEY", "MINIMAX_API_KEY"];

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

function loadApiKeys(): Record<string, string> {
  try {
    if (fs.existsSync(API_KEYS_PATH)) {
      return JSON.parse(fs.readFileSync(API_KEYS_PATH, "utf-8"));
    }
  } catch { /* ignore */ }
  return {};
}

function saveApiKeys(keys: Record<string, string>) {
  fs.writeFileSync(API_KEYS_PATH, JSON.stringify(keys, null, 2));
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

  // Merge in API keys from local file
  const apiKeys = loadApiKeys();
  for (const [key, value] of Object.entries(apiKeys)) {
    map[key] = value;
  }

  return NextResponse.json(map);
}

export async function PUT(req: NextRequest) {
  const data = await req.json();
  const entries = Object.entries(data) as [string, string][];

  // Categorize entries
  const dbKeys = ["DB_BACKEND", "TURSO_URL", "TURSO_TOKEN"];
  const dbEntries = entries.filter(([k]) => dbKeys.includes(k));
  const apiKeyEntries = entries.filter(([k]) => API_KEY_NAMES.includes(k));
  const settingEntries = entries.filter(([k]) => !dbKeys.includes(k) && !API_KEY_NAMES.includes(k));

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

  // Save API keys to local file
  if (apiKeyEntries.length > 0) {
    const apiKeys = loadApiKeys();
    for (const [key, value] of apiKeyEntries) {
      apiKeys[key] = value;
    }
    saveApiKeys(apiKeys);
  }

  // Save other settings to DB
  if (settingEntries.length > 0) {
    const prisma = await getDb();
    for (const [key, value] of settingEntries) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: value as string },
        create: { key, value: value as string },
      });
    }
  }

  return NextResponse.json({ success: true });
}
