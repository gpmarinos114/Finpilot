import type { ProviderName } from "@/types/financial";

export interface ProviderInfo {
  model: string;
  models: { id: string; label: string }[];
}

export const PROVIDERS: Record<ProviderName, ProviderInfo> = {
  mimo: {
    model: "mimo-v2.5-pro",
    models: [
      { id: "mimo-v2.5-pro", label: "MiMo V2.5 Pro" },
      { id: "mimo-v2.5", label: "MiMo V2.5 (Omni)" },
      { id: "mimo-v2-flash", label: "MiMo V2 Flash" },
    ],
  },
  deepseek: {
    model: "deepseek-v4-pro",
    models: [
      { id: "deepseek-v4-pro", label: "DeepSeek V4 Pro" },
      { id: "deepseek-v4-flash", label: "DeepSeek V4 Flash" },
    ],
  },
  minimax: {
    model: "MiniMax-M3",
    models: [
      { id: "MiniMax-M3", label: "MiniMax M3" },
      { id: "MiniMax-M2.7", label: "MiniMax M2.7" },
      { id: "MiniMax-M2.5", label: "MiniMax M2.5" },
    ],
  },
};
