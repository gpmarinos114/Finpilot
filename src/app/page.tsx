"use client";

import { useState, useEffect } from "react";
import Dashboard from "@/components/Dashboard";
import ChatSidebar from "@/components/ChatSidebar";
import ProviderSelector from "@/components/ProviderSelector";
import SettingsPanel from "@/components/SettingsPanel";
import ResizablePanel from "@/components/ResizablePanel";
import { ChatProvider, useChat } from "@/contexts/ChatContext";
import type { ProviderName } from "@/types/financial";
import type { ReasoningEffort } from "@/contexts/ChatContext";

function AppContent() {
  const { reasoningEffort, setReasoningEffort } = useChat();
  const [provider, setProvider] = useState<ProviderName>("deepseek");
  const [model, setModel] = useState("");
  const [swapped, setSwapped] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.SELECTED_PROVIDER) setProvider(data.SELECTED_PROVIDER as ProviderName);
        if (data.SELECTED_MODEL) setModel(data.SELECTED_MODEL);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const saveSetting = async (key: string, value: string) => {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
  };

  const handleProviderChange = (p: ProviderName) => {
    setProvider(p);
    saveSetting("SELECTED_PROVIDER", p);
  };

  const handleModelChange = (m: string) => {
    setModel(m);
    saveSetting("SELECTED_MODEL", m);
  };

  if (!loaded) return null;

  const chatPanel = (
    <ResizablePanel
      defaultWidth={380}
      minWidth={280}
      maxWidth={600}
      side={swapped ? "left" : "right"}
      collapsed={chatCollapsed}
      onToggleCollapse={() => setChatCollapsed(!chatCollapsed)}
    >
      <ChatSidebar provider={provider} model={model} onCollapse={() => setChatCollapsed(true)} />
    </ResizablePanel>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900">
        <h1 className="text-lg font-bold">AI Financial Planner</h1>
        <div className="flex items-center gap-3">
          <ProviderSelector
            provider={provider}
            model={model}
            reasoningEffort={reasoningEffort}
            onProviderChange={handleProviderChange}
            onModelChange={handleModelChange}
            onReasoningChange={setReasoningEffort}
          />
          <button
            onClick={() => setSwapped(!swapped)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
            title="Swap layout"
          >
            ⇄
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
            title="API Settings"
          >
            Settings
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {swapped ? (
          <>
            {chatPanel}
            <div className="flex-1 overflow-y-auto">
              <Dashboard />
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              <Dashboard />
            </div>
            {chatPanel}
          </>
        )}
      </div>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default function Home() {
  return (
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  );
}
