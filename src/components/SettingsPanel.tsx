"use client";

import { useState, useEffect } from "react";

interface Props {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: Props) {
  const [keys, setKeys] = useState({
    DEEPSEEK_API_KEY: "",
    MIMO_API_KEY: "",
    MINIMAX_API_KEY: "",
  });
  const [dbConfig, setDbConfig] = useState({
    DB_BACKEND: "local",
    TURSO_URL: "",
    TURSO_TOKEN: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showKeys, setShowKeys] = useState({
    DEEPSEEK_API_KEY: false,
    MIMO_API_KEY: false,
    MINIMAX_API_KEY: false,
    TURSO_TOKEN: false,
  });
  const [needsRestart, setNeedsRestart] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setKeys({
          DEEPSEEK_API_KEY: data.DEEPSEEK_API_KEY || "",
          MIMO_API_KEY: data.MIMO_API_KEY || "",
          MINIMAX_API_KEY: data.MINIMAX_API_KEY || "",
        });
        setDbConfig({
          DB_BACKEND: data.DB_BACKEND || "local",
          TURSO_URL: data.TURSO_URL || "",
          TURSO_TOKEN: data.TURSO_TOKEN || "",
        });
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...keys, ...dbConfig }),
    });
    setSaving(false);
    setSaved(true);
    setNeedsRestart(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const providers = [
    { key: "DEEPSEEK_API_KEY" as const, label: "DeepSeek", placeholder: "sk-..." },
    { key: "MIMO_API_KEY" as const, label: "Xiaomi MiMo", placeholder: "sk-..." },
    { key: "MINIMAX_API_KEY" as const, label: "MiniMax", placeholder: "sk-..." },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">&times;</button>
        </div>

        {/* Database Backend Section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Database</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Backend</label>
              <select
                value={dbConfig.DB_BACKEND}
                onChange={(e) => setDbConfig({ ...dbConfig, DB_BACKEND: e.target.value })}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white"
              >
                <option value="local">Local SQLite</option>
                <option value="turso">Turso (Cloud)</option>
              </select>
            </div>

            {dbConfig.DB_BACKEND === "turso" && (
              <>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Turso Database URL</label>
                  <input
                    type="text"
                    value={dbConfig.TURSO_URL}
                    onChange={(e) => setDbConfig({ ...dbConfig, TURSO_URL: e.target.value })}
                    placeholder="libsql://your-db.turso.io"
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Auth Token</label>
                  <div className="relative">
                    <input
                      type={showKeys.TURSO_TOKEN ? "text" : "password"}
                      value={dbConfig.TURSO_TOKEN}
                      onChange={(e) => setDbConfig({ ...dbConfig, TURSO_TOKEN: e.target.value })}
                      placeholder="eyJ..."
                      className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 pr-10 text-sm text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeys({ ...showKeys, TURSO_TOKEN: !showKeys.TURSO_TOKEN })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                    >
                      {showKeys.TURSO_TOKEN ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Get your database URL and auth token from{" "}
                  <a href="https://turso.tech" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    turso.tech
                  </a>
                </p>
              </>
            )}
          </div>
        </div>

        {/* API Keys Section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">API Keys</h3>
          <div className="space-y-4">
            {providers.map((p) => (
              <div key={p.key}>
                <label className="block text-sm text-gray-300 mb-1">{p.label}</label>
                <div className="relative">
                  <input
                    type={showKeys[p.key] ? "text" : "password"}
                    value={keys[p.key]}
                    onChange={(e) => setKeys({ ...keys, [p.key]: e.target.value })}
                    placeholder={p.placeholder}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 pr-10 text-sm text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeys({ ...showKeys, [p.key]: !showKeys[p.key] })}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                  >
                    {showKeys[p.key] ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-2">
          Keys are stored locally in your database. They are never sent anywhere except to the respective AI provider.
        </p>

        {needsRestart && (
          <p className="text-xs text-amber-400 mb-2">
            Database backend changes require an app restart to take effect.
          </p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium"
          >
            {saving ? "Saving..." : saved ? "Saved!" : "Save"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
