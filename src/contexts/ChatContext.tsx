"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type ReasoningEffort = "low" | "medium" | "high" | "max";

export interface Message {
  role: "user" | "assistant" | "tool";
  content: string;
  thinking?: string;
  toolName?: string;
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

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>("high");

  const clearChat = useCallback(() => {
    setMessages([]);
    setTokenUsage(null);
    setSessionId(null);
    setSessionName(null);
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
