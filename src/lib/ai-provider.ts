import OpenAI from "openai";
import { getDb } from "./db";
import { PROVIDERS } from "./providers";
import type { ProviderName } from "@/types/financial";
import fs from "fs";
import path from "path";

const API_KEYS_PATH = path.join(process.cwd(), "api-keys.json");

function loadApiKeys(): Record<string, string> {
  try {
    if (fs.existsSync(API_KEYS_PATH)) {
      return JSON.parse(fs.readFileSync(API_KEYS_PATH, "utf-8"));
    }
  } catch { /* ignore */ }
  return {};
}

async function getSetting(key: string): Promise<string | null> {
  // Check local API keys file first
  const apiKeys = loadApiKeys();
  if (apiKeys[key]) return apiKeys[key];

  // Fall back to DB settings
  try {
    const prisma = await getDb();
    const setting = await prisma.setting.findUnique({ where: { key } });
    return setting?.value || null;
  } catch {
    return null;
  }
}

export async function createAIProvider(
  provider: ProviderName,
  apiKey?: string
): Promise<OpenAI> {
  const baseURL = `https://${provider === "mimo" ? "api.xiaomimimo.com/v1" : provider === "deepseek" ? "api.deepseek.com" : "api.minimax.io/v1"}`;
  let key = apiKey;
  if (!key) {
    const envKey = provider === "mimo" ? "MIMO_API_KEY" : provider === "deepseek" ? "DEEPSEEK_API_KEY" : "MINIMAX_API_KEY";
    key = (await getSetting(envKey)) || process.env[envKey] || "";
  }
  if (!key) throw new Error(`No API key configured for provider: ${provider}`);
  return new OpenAI({ baseURL, apiKey: key });
}

export async function getApiKeyForProvider(provider: ProviderName): Promise<string> {
  const envKey = provider === "mimo" ? "MIMO_API_KEY" : provider === "deepseek" ? "DEEPSEEK_API_KEY" : "MINIMAX_API_KEY";
  const dbKey = await getSetting(envKey);
  const key = dbKey || process.env[envKey] || "";
  if (!key) throw new Error(`No API key configured for provider: ${provider}`);
  return key;
}

export async function getSavedProvider(): Promise<ProviderName> {
  const saved = await getSetting("SELECTED_PROVIDER");
  if (saved && saved in PROVIDERS) return saved as ProviderName;
  return (process.env.DEFAULT_AI_PROVIDER as ProviderName) ?? "deepseek";
}

export async function getSavedModel(provider: ProviderName): Promise<string> {
  const saved = await getSetting("SELECTED_MODEL");
  if (saved) return saved;
  return PROVIDERS[provider].model;
}

export function getDefaultProvider(): ProviderName {
  return (process.env.DEFAULT_AI_PROVIDER as ProviderName) ?? "deepseek";
}
