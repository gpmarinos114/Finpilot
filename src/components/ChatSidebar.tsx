"use client";

import { useState, useRef, useEffect, memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChat } from "@/contexts/ChatContext";
import { emitDataChanged } from "@/lib/events";
import type { ReasoningEffort, Message } from "@/contexts/ChatContext";
import type { ProviderName } from "@/types/financial";

/* eslint-disable @typescript-eslint/no-explicit-any */
const THINKING_COMPONENTS: any = {
  p: ({ children }: { children: React.ReactNode }) => <p className="mb-1 last:mb-0">{children}</p>,
  ul: ({ children }: { children: React.ReactNode }) => <ul className="list-disc pl-3 mb-1">{children}</ul>,
  ol: ({ children }: { children: React.ReactNode }) => <ol className="list-decimal pl-3 mb-1">{children}</ol>,
  li: ({ children }: { children: React.ReactNode }) => <li className="mb-0.5">{children}</li>,
  code: ({ children, ...props }: any) => <code className="bg-base-100/50 px-1 rounded text-[10px]" {...props}>{children}</code>,
};

const MAIN_COMPONENTS: any = {
  p: ({ children }: { children: React.ReactNode }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }: { children: React.ReactNode }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
  ol: ({ children }: { children: React.ReactNode }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
  li: ({ children }: { children: React.ReactNode }) => <li className="mb-1">{children}</li>,
  h1: ({ children }: { children: React.ReactNode }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
  h2: ({ children }: { children: React.ReactNode }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
  h3: ({ children }: { children: React.ReactNode }) => <h3 className="text-sm font-bold mb-2">{children}</h3>,
  code: ({ children, className, ...props }: any) => {
    const isInline = !className;
    return isInline ? (
      <code className="bg-base-100 px-1 rounded text-xs" {...props}>{children}</code>
    ) : (
      <code className="block bg-base-300 p-2 rounded text-xs overflow-x-auto" {...props}>{children}</code>
    );
  },
  pre: ({ children }: { children: React.ReactNode }) => <pre className="bg-base-300 p-2 rounded mb-2 overflow-x-auto">{children}</pre>,
  table: ({ children }: { children: React.ReactNode }) => <table className="border-collapse mb-2 text-xs">{children}</table>,
  th: ({ children }: { children: React.ReactNode }) => <th className="border border-base-700 px-2 py-1 bg-base-100">{children}</th>,
  td: ({ children }: { children: React.ReactNode }) => <td className="border border-base-700 px-2 py-1">{children}</td>,
  strong: ({ children }: { children: React.ReactNode }) => <strong className="font-bold txt-primary">{children}</strong>,
  em: ({ children }: { children: React.ReactNode }) => <em className="italic">{children}</em>,
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="border-l-2 border-base-600 pl-2 italic mb-2">{children}</blockquote>
  ),
};

const PLUGINS = [remarkGfm];

const ChatMessage = memo(function ChatMessage({ msg, index }: { msg: Message; index: number }) {
  return (
    <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          msg.role === "user"
            ? "bg-accent txt-primary"
            : msg.role === "tool"
            ? "bg-base-100 txt-secondary text-xs italic"
            : "bg-base-200 txt-secondary"
        }`}
      >
        {msg.role === "user" ? (
          <span className="whitespace-pre-wrap">{msg.content}</span>
        ) : (
          <div>
            {msg.thinking && (
              <details className="mb-2 group">
                <summary className="text-xs text-accent cursor-pointer hover:text-accent flex items-center gap-1 select-none">
                  <span className="transition-transform group-open:rotate-90">▶</span>
                  Thinking
                  <span className="text-accent">
                    ({msg.thinking.length > 0 ? `${Math.ceil(msg.thinking.length / 4)} tokens` : "..."})
                  </span>
                </summary>
                <div className="mt-2 pl-3 border-l-2 border-purple-500/30 text-xs text-accent/80 italic max-h-60 overflow-y-auto">
                  <ReactMarkdown remarkPlugins={PLUGINS} components={THINKING_COMPONENTS}>
                    {msg.thinking}
                  </ReactMarkdown>
                </div>
              </details>
            )}
            {msg.content && (
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={PLUGINS} components={MAIN_COMPONENTS}>
                  {msg.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

interface Props {
  provider: ProviderName;
  model: string;
  onCollapse?: () => void;
}

const EFFORT_OPTIONS: { value: ReasoningEffort; label: string; desc: string }[] = [
  { value: "low", label: "Low", desc: "Fast, minimal thinking" },
  { value: "medium", label: "Medium", desc: "Balanced" },
  { value: "high", label: "High", desc: "Thorough reasoning" },
  { value: "max", label: "Max", desc: "Deep analysis" },
];

const SLASH_COMMANDS = [
  { cmd: "/help", desc: "Show available commands" },
  { cmd: "/clear", desc: "Clear current chat" },
  { cmd: "/session new", desc: "Start a new session" },
  { cmd: "/session save", desc: "Save current session" },
  { cmd: "/session load", desc: "Load a saved session" },
  { cmd: "/session list", desc: "List all saved sessions" },
  { cmd: "/context", desc: "Show context usage details" },
  { cmd: "/export", desc: "Export chat as markdown" },
];

export default function ChatSidebar({ provider, model, onCollapse }: Props) {
  const {
    messages, tokenUsage, sessionId, sessionName, reasoningEffort,
    setMessages, setTokenUsage, setSessionId, setSessionName, setReasoningEffort,
    clearChat, addMessage,
  } = useChat();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState(SLASH_COMMANDS);
  const [attachments, setAttachments] = useState<{ name: string; content: string; isImage: boolean }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!showMenu) return;
    const close = () => setShowMenu(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showMenu]);

  const handleInputChange = (value: string) => {
    setInput(value);
    if (value.startsWith("/")) {
      setShowCommands(true);
      setFilteredCommands(
        SLASH_COMMANDS.filter((c) => c.cmd.startsWith(value.toLowerCase()))
      );
    } else {
      setShowCommands(false);
    }
  };

  const executeSlashCommand = async (cmd: string) => {
    setShowCommands(false);
    setInput("");

    const parts = cmd.split(" ");
    const command = parts[0];
    const arg = parts.slice(1).join(" ");

    switch (command) {
      case "/help":
        addMessage({
          role: "assistant",
          content: `**Available Commands:**\n\n${SLASH_COMMANDS.map((c) => `\`${c.cmd}\` — ${c.desc}`).join("\n")}`,
        });
        break;

      case "/clear":
        clearChat();
        break;

      case "/session":
        await handleSessionCommand(arg);
        break;

      case "/context":
        if (tokenUsage) {
          addMessage({
            role: "assistant",
            content: `**Context Usage:**\n\n- **Input tokens:** ${tokenUsage.inputTokens.toLocaleString()}\n- **Output tokens:** ${tokenUsage.outputTokens?.toLocaleString() || "N/A"}\n- **Total tokens:** ${tokenUsage.totalTokens?.toLocaleString() || "N/A"}\n- **Max context:** ${tokenUsage.maxContext.toLocaleString()}\n- **Used:** ${tokenUsage.usedPercent}%`,
          });
        } else {
          addMessage({ role: "assistant", content: "No context usage data yet. Send a message first." });
        }
        break;

      case "/export":
        const md = messages
          .map((m) => `**${m.role === "user" ? "You" : "AI"}:** ${m.content}`)
          .join("\n\n---\n\n");
        const blob = new Blob([md], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `chat-export-${new Date().toISOString().slice(0, 10)}.md`;
        a.click();
        URL.revokeObjectURL(url);
        addMessage({ role: "assistant", content: "Chat exported as markdown file." });
        break;

      default:
        addMessage({ role: "assistant", content: `Unknown command: \`${command}\`. Type \`/help\` for available commands.` });
    }
  };

  const handleSessionCommand = async (arg: string) => {
    const parts = arg.split(" ");
    const action = parts[0];
    const name = parts.slice(1).join(" ");

    switch (action) {
      case "new": {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name || undefined, messages: [] }),
        });
        const session = await res.json();
        setSessionId(session.id);
        setSessionName(session.name);
        setMessages([]);
        setTokenUsage(null);
        addMessage({ role: "assistant", content: `Started new session: **${session.name}**` });
        break;
      }

      case "save": {
        if (!sessionId) {
          const res = await fetch("/api/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: name || sessionName || `Session ${new Date().toLocaleString()}`,
              messages,
            }),
          });
          const session = await res.json();
          setSessionId(session.id);
          setSessionName(session.name);
          addMessage({ role: "assistant", content: `Session saved as: **${session.name}**` });
        } else {
          await fetch("/api/sessions", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: sessionId, name: name || sessionName, messages }),
          });
          addMessage({ role: "assistant", content: `Session **${sessionName || sessionId}** updated.` });
        }
        break;
      }

      case "load": {
        if (!name) {
          const res = await fetch("/api/sessions");
          const sessions = await res.json();
          if (sessions.length === 0) {
            addMessage({ role: "assistant", content: "No saved sessions found." });
          } else {
            const list = sessions
              .map((s: { name: string; id: string; createdAt: string }) =>
                `- **${s.name}** (${new Date(s.createdAt).toLocaleDateString()}) \`${s.id}\``
              )
              .join("\n");
            addMessage({ role: "assistant", content: `**Saved Sessions:**\n\n${list}\n\nUse \`/session load <id>\` to load one.` });
          }
          break;
        }

        const res = await fetch(`/api/sessions/${name}`);
        if (!res.ok) {
          addMessage({ role: "assistant", content: `Session not found: ${name}` });
          break;
        }
        const data = await res.json();
        setSessionId(data.session.id);
        setSessionName(data.session.name);
        setMessages(
          data.messages.map((m: { role: string; content: string; toolName?: string }) => ({
            role: m.role,
            content: m.content,
            toolName: m.toolName,
          }))
        );
        addMessage({ role: "assistant", content: `Loaded session: **${data.session.name}**` });
        break;
      }

      case "list": {
        const res = await fetch("/api/sessions");
        const sessions = await res.json();
        if (sessions.length === 0) {
          addMessage({ role: "assistant", content: "No saved sessions found." });
        } else {
          const list = sessions
            .map((s: { name: string; id: string; createdAt: string }) =>
              `- **${s.name}** (${new Date(s.createdAt).toLocaleDateString()}) \`${s.id}\``
            )
            .join("\n");
          addMessage({ role: "assistant", content: `**Saved Sessions:**\n\n${list}` });
        }
        break;
      }

      default:
        addMessage({
          role: "assistant",
          content: "**Session commands:**\n\n- `/session new [name]` — Start new session\n- `/session save [name]` — Save current session\n- `/session load <id>` — Load a session\n- `/session list` — List all sessions",
        });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAttachments: { name: string; content: string; isImage: boolean }[] = [];
    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/")) {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        newAttachments.push({ name: file.name, content: dataUrl, isImage: true });
      } else {
        const text = await file.text();
        newAttachments.push({ name: file.name, content: text, isImage: false });
      }
    }
    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    if (input.startsWith("/")) {
      await executeSlashCommand(input);
      setInput("");
      return;
    }

    const userMessage = input.trim();
    setInput("");
    const currentAttachments = [...attachments];
    setAttachments([]);
    addMessage({ role: "user", content: userMessage + (currentAttachments.length > 0 ? `\n\n📎 ${currentAttachments.map((a) => a.name).join(", ")}` : ""), attachments: currentAttachments.map((a) => ({ name: a.name, content: a.content, isImage: a.isImage })) });
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, provider, model, sessionId, reasoning_effort: reasoningEffort, attachments: currentAttachments }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        addMessage({ role: "assistant", content: `Error: ${errorText || "Request failed"}` });
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let assistantContent = "";
      let assistantThinking = "";
      let chunkIdx = 0;
      let hadToolCalls = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            chunkIdx++;
            if (data.type === "thinking") {
              assistantThinking += data.text;
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "assistant" && last.thinking !== undefined) {
                  updated[updated.length - 1] = { ...last, thinking: assistantThinking };
                } else {
                  updated.push({ role: "assistant", content: "", thinking: assistantThinking });
                }
                return updated;
              });
            } else if (data.type === "content") {
              assistantContent += data.text;
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "assistant") {
                  updated[updated.length - 1] = { ...last, content: assistantContent, thinking: assistantThinking || last.thinking };
                } else {
                  updated.push({ role: "assistant", content: assistantContent, thinking: assistantThinking || undefined });
                }
                return [...updated];
              });
            } else if (data.type === "tool_call") {
              hadToolCalls = true;
              addMessage({ role: "tool", content: `Calling tool: ${data.name}...`, toolName: data.name });
            } else if (data.type === "tool_result") {
              setMessages((prev) => {
                const updated = [...prev];
                const toolMsg = updated.findLast((m) => m.role === "tool" && m.toolName === data.name);
                if (toolMsg) toolMsg.content = `✓ ${data.result}`;
                return [...updated];
              });
            } else if (data.type === "error") {
              console.log(`[FE DEBUG] Error event: ${data.error}`);
              addMessage({ role: "assistant", content: `Error: ${data.error}` });
            } else if (data.type === "done") {
              console.log(`[FE DEBUG] Done event received. content="${assistantContent}"`);
            }
          } catch {}
        }
      }
      console.log(`[FE DEBUG] Stream complete. finalContent="${assistantContent}", finalThinking="${assistantThinking.slice(0, 100)}..."`);
      if (hadToolCalls) {
        emitDataChanged();
      }

      // Auto-save session to DB
      if (sessionId) {
        fetch("/api/sessions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: sessionId, name: sessionName, messages }),
        }).catch(() => {});
      } else {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: `Session ${new Date().toLocaleString()}`, messages }),
        }).catch(() => null);
        if (res && res.ok) {
          const session = await res.json();
          setSessionId(session.id);
          setSessionName(session.name);
        }
      }
    } catch (error) {
      addMessage({
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Failed to get response"}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTokens = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  const usageColor = tokenUsage
    ? tokenUsage.usedPercent > 80
      ? "text-err"
      : tokenUsage.usedPercent > 50
      ? "text-yellow-400"
      : "text-ok"
    : "txt-muted";

  return (
    <div className="flex flex-col h-full bg-base-300 border-l border-base-500">
      <div className="p-3 border-b border-base-500">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="txt-muted hover:txt-primary p-1 rounded hover:bg-base-100"
                title="Menu"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <rect y="2" width="16" height="2" rx="1" />
                  <rect y="7" width="16" height="2" rx="1" />
                  <rect y="12" width="16" height="2" rx="1" />
                </svg>
              </button>
              {showMenu && (
                <div className="absolute top-full left-0 mt-1 bg-base-200 border border-base-700 rounded-lg shadow-lg z-50 min-w-[160px]">
                  <button
                    onClick={() => { executeSlashCommand("/session new"); setShowMenu(false); }}
                    className="w-full text-left px-3 py-2 text-sm txt-secondary hover:bg-base-100 rounded-t-lg"
                  >
                    New Session
                  </button>
                  <button
                    onClick={() => { executeSlashCommand("/session save"); setShowMenu(false); }}
                    className="w-full text-left px-3 py-2 text-sm txt-secondary hover:bg-base-100"
                  >
                    Save Session
                  </button>
                  <button
                    onClick={() => { executeSlashCommand("/session load"); setShowMenu(false); }}
                    className="w-full text-left px-3 py-2 text-sm txt-secondary hover:bg-base-100"
                  >
                    Load Session
                  </button>
                  <div className="border-t border-base-700" />
                  <button
                    onClick={() => { executeSlashCommand("/export"); setShowMenu(false); }}
                    className="w-full text-left px-3 py-2 text-sm txt-secondary hover:bg-base-100"
                  >
                    Export Chat
                  </button>
                  <div className="border-t border-base-700" />
                  {onCollapse && (
                    <button
                      onClick={() => { onCollapse(); setShowMenu(false); }}
                      className="w-full text-left px-3 py-2 text-sm txt-secondary hover:bg-base-100"
                    >
                      Collapse Panel
                    </button>
                  )}
                  <button
                    onClick={() => { clearChat(); setShowMenu(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-err hover:bg-base-100 rounded-b-lg"
                  >
                    Clear Chat
                  </button>
                </div>
              )}
            </div>
            <h2 className="font-semibold txt-primary text-sm">AI Planner</h2>
            {sessionName && (
              <span className="text-xs text-accent bg-accent-soft px-2 py-0.5 rounded">
                {sessionName}
              </span>
            )}
          </div>
        </div>
        {tokenUsage && (
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className={usageColor}>
              {formatTokens(tokenUsage.inputTokens)} / {formatTokens(tokenUsage.maxContext)} tokens
            </span>
            <div className="flex-1 bg-base-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  tokenUsage.usedPercent > 80
                    ? "bg-err"
                    : tokenUsage.usedPercent > 50
                    ? "bg-warn"
                    : "bg-ok"
                }`}
                style={{ width: `${Math.min(tokenUsage.usedPercent, 100)}%` }}
              />
            </div>
            <span className={usageColor}>{tokenUsage.usedPercent}%</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center txt-faint text-sm py-8">
            <p className="mb-2">Ask me anything about your finances.</p>
            <p className="text-xs">Type <code className="bg-base-100 px-1 rounded">/help</code> for commands</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage key={i} msg={msg} index={i} />
        ))}
        {loading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="bg-base-200 rounded-lg px-3 py-2 text-sm txt-muted">
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-base-500 relative">
        {showCommands && filteredCommands.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 mb-1 mx-3 bg-base-200 border border-base-700 rounded-lg overflow-hidden shadow-lg">
            {filteredCommands.map((c) => (
              <button
                key={c.cmd}
                onClick={() => {
                  setInput(c.cmd + " ");
                  setShowCommands(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-base-100 flex justify-between"
              >
                <span className="txt-primary font-mono">{c.cmd}</span>
                <span className="txt-muted">{c.desc}</span>
              </button>
            ))}
          </div>
        )}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {attachments.map((a, i) => (
              <span key={i} className="inline-flex items-center gap-1 bg-base-200 border border-base-700 rounded px-2 py-0.5 text-xs txt-secondary">
                {a.isImage ? (
                  <img src={a.content} alt={a.name} className="w-5 h-5 rounded object-cover" />
                ) : "📎"}
                <span className="max-w-[80px] truncate">{a.name}</span>
                <button onClick={() => removeAttachment(i)} className="txt-faint hover:text-err ml-0.5">&times;</button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
            accept=".csv,.txt,.json,.md,.tsv,.xlsx,.xls,.pdf,image/*"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-base-100 hover:bg-base-600 txt-secondary px-2 py-2 rounded text-sm"
            title="Attach file"
          >
            📎
          </button>
          <input
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask or type / for commands..."
            className="flex-1 bg-base-200 border border-base-700 rounded px-3 py-2 text-sm txt-primary"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || (!input.trim() && attachments.length === 0)}
            className="bg-accent hover:bg-accent-hover disabled:bg-base-600 txt-primary px-4 py-2 rounded text-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
