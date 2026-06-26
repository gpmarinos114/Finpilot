"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

export type ReasoningEffort = "low" | "medium" | "high" | "max";

export interface Message {
  role: "user" | "assistant" | "tool";
  content: string;
  thinking?: string;
  toolName?: string;
  attachments?: { name: string; content: string; isImage: boolean }[];
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens?: number;
  totalTokens?: number;
  maxContext: number;
  usedPercent: number;
}

interface ChatContextType {
  messages: Message[];
  tokenUsage: TokenUsage | null;
  sessionId: string | null;
  sessionName: string | null;
  reasoningEffort: ReasoningEffort;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setTokenUsage: (usage: TokenUsage | null) => void;
  setSessionId: (id: string | null) => void;
  setSessionName: (name: string | null) => void;
  setReasoningEffort: (effort: ReasoningEffort) => void;
  clearChat: () => void;
  addMessage: (msg: Message) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

const STORAGE_KEY = "finpilot-chat";

function saveToStorage(sessionId: string | null, sessionName: string | null, messages: Message[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId, sessionName, messages }));
  } catch { /* quota exceeded, ignore */ }
}

function loadFromStorage(): { sessionId: string | null; sessionName: string | null; messages: Message[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [sessionId, setSessionIdState] = useState<string | null>(null);
  const [sessionName, setSessionNameState] = useState<string | null>(null);
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>("high");
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = loadFromStorage();
    if (saved) {
      setSessionIdState(saved.sessionId);
      setSessionNameState(saved.sessionName);
      setMessages(saved.messages || []);
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage when state changes (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    saveToStorage(sessionId, sessionName, messages);
  }, [sessionId, sessionName, messages, hydrated]);

  const setSessionId = useCallback((id: string | null) => {
    setSessionIdState(id);
  }, []);

  const setSessionName = useCallback((name: string | null) => {
    setSessionNameState(name);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setTokenUsage(null);
    setSessionIdState(null);
    setSessionNameState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const addMessage = useCallback((msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        tokenUsage,
        sessionId,
        sessionName,
        reasoningEffort,
        setMessages,
        setTokenUsage,
        setSessionId,
        setSessionName,
        setReasoningEffort,
        clearChat,
        addMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
