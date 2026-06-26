"use client";

import type { ProviderName } from "@/types/financial";
import type { ReasoningEffort } from "@/contexts/ChatContext";
import { PROVIDERS } from "@/lib/providers";

interface Props {
  provider: ProviderName;
  model: string;
  reasoningEffort: ReasoningEffort;
  onProviderChange: (p: ProviderName) => void;
  onModelChange: (m: string) => void;
  onReasoningChange: (e: ReasoningEffort) => void;
}

const EFFORT_OPTIONS: { value: ReasoningEffort; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Med" },
  { value: "high", label: "High" },
  { value: "max", label: "Max" },
];

export default function ProviderSelector({
  provider, model, reasoningEffort,
  onProviderChange, onModelChange, onReasoningChange,
}: Props) {
  const models = PROVIDERS[provider]?.models || [];

  return (
    <div className="flex items-center gap-2">
      <select
        value={provider}
        onChange={(e) => {
          const p = e.target.value as ProviderName;
          onProviderChange(p);
          const newModels = PROVIDERS[p]?.models || [];
          if (newModels.length > 0) onModelChange(newModels[0].id);
        }}
        className="bg-base-100 border border-base-700 rounded px-2 py-1 text-sm txt-primary"
      >
        <option value="deepseek">DeepSeek</option>
        <option value="mimo">MiMo</option>
        <option value="minimax">MiniMax</option>
      </select>
      <select
        value={model}
        onChange={(e) => onModelChange(e.target.value)}
        className="bg-base-100 border border-base-700 rounded px-2 py-1 text-sm txt-primary"
      >
        {models.map((m) => (
          <option key={m.id} value={m.id}>{m.label}</option>
        ))}
      </select>
      <div className="flex items-center bg-base-100 border border-base-700 rounded overflow-hidden">
        {EFFORT_OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => onReasoningChange(o.value)}
            className={`px-2 py-1 text-xs transition-colors ${
              reasoningEffort === o.value
                ? "bg-accent txt-primary"
                : "txt-muted hover:txt-primary hover:bg-base-600"
            }`}
            title={`Reasoning: ${o.label}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
