"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MemoryFile {
  path: string;
  preview: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const MD_COMPONENTS: any = {
  p: ({ children }: { children: React.ReactNode }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }: { children: React.ReactNode }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
  ol: ({ children }: { children: React.ReactNode }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
  li: ({ children }: { children: React.ReactNode }) => <li className="mb-1">{children}</li>,
  h1: ({ children }: { children: React.ReactNode }) => <h1 className="text-lg font-bold mb-2 text-white">{children}</h1>,
  h2: ({ children }: { children: React.ReactNode }) => <h2 className="text-base font-bold mb-2 text-white">{children}</h2>,
  h3: ({ children }: { children: React.ReactNode }) => <h3 className="text-sm font-bold mb-2 text-white">{children}</h3>,
  code: ({ children, className, ...props }: any) => {
    const isInline = !className;
    return isInline ? (
      <code className="bg-gray-700 px-1 rounded text-xs" {...props}>{children}</code>
    ) : (
      <code className="block bg-gray-900 p-2 rounded text-xs overflow-x-auto" {...props}>{children}</code>
    );
  },
  pre: ({ children }: { children: React.ReactNode }) => <pre className="bg-gray-900 p-2 rounded mb-2 overflow-x-auto">{children}</pre>,
  table: ({ children }: { children: React.ReactNode }) => <table className="border-collapse mb-2 text-xs w-full">{children}</table>,
  th: ({ children }: { children: React.ReactNode }) => <th className="border border-gray-600 px-2 py-1 bg-gray-700 text-left">{children}</th>,
  td: ({ children }: { children: React.ReactNode }) => <td className="border border-gray-600 px-2 py-1">{children}</td>,
  strong: ({ children }: { children: React.ReactNode }) => <strong className="font-bold text-white">{children}</strong>,
  em: ({ children }: { children: React.ReactNode }) => <em className="italic">{children}</em>,
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="border-l-2 border-gray-500 pl-2 italic mb-2">{children}</blockquote>
  ),
  hr: () => <hr className="border-gray-600 my-3" />,
  a: ({ children, href }: { children: React.ReactNode; href?: string }) => (
    <a href={href} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>
  ),
};

type ViewMode = "split" | "edit" | "preview";

export default function MemoryPanel() {
  const [files, setFiles] = useState<MemoryFile[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("split");

  const fetchFiles = async () => {
    const res = await fetch("/api/memories");
    const data = await res.json();
    setFiles(data);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const openFile = async (filepath: string) => {
    const res = await fetch(`/api/memories?path=${encodeURIComponent(filepath)}`);
    const data = await res.json();
    setEditing(filepath);
    setContent(data.content || "");
    setViewMode("split");
  };

  const saveFile = async () => {
    if (!editing) return;
    setSaving(true);
    await fetch("/api/memories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: editing, content }),
    });
    setSaving(false);
    fetchFiles();
  };

  const closeFile = () => {
    setEditing(null);
    setContent("");
  };

  const groupedFiles = files.reduce((acc, f) => {
    const dir = f.path.includes("/") ? f.path.split("/")[0] : "root";
    if (!acc[dir]) acc[dir] = [];
    acc[dir].push(f);
    return acc;
  }, {} as Record<string, MemoryFile[]>);

  const viewButtons: { mode: ViewMode; label: string; icon: string }[] = [
    { mode: "edit", label: "Edit", icon: "✎" },
    { mode: "split", label: "Split", icon: "◫" },
    { mode: "preview", label: "Preview", icon: "👁" },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-gray-300">AI Memory Files</h3>
      <p className="text-xs text-gray-500">These files give the AI context about your goals, decisions, and preferences. The AI can also create plans and simulations here.</p>

      {editing ? (
        <div className="space-y-3">
          {/* Header bar */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-white font-medium">{editing}</p>
            <div className="flex items-center gap-2">
              {/* View mode toggles */}
              <div className="flex bg-gray-800 rounded border border-gray-700 overflow-hidden">
                {viewButtons.map((btn) => (
                  <button
                    key={btn.mode}
                    onClick={() => setViewMode(btn.mode)}
                    className={`px-2 py-1 text-xs transition-colors ${
                      viewMode === btn.mode
                        ? "bg-blue-600 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-700"
                    }`}
                    title={btn.label}
                  >
                    {btn.icon}
                  </button>
                ))}
              </div>
              <button onClick={saveFile} disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-xs">
                {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={closeFile} className="text-gray-400 hover:text-white text-xs">Close</button>
            </div>
          </div>

          {/* Editor / Preview / Split */}
          <div className={`flex gap-3 ${viewMode === "split" ? "" : "flex-col"}`}>
            {(viewMode === "edit" || viewMode === "split") && (
              <div className={viewMode === "split" ? "w-1/2" : "w-full"}>
                {viewMode === "split" && <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Editor</p>}
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-[32rem] bg-gray-800 border border-gray-600 rounded p-3 text-sm text-white font-mono resize-y"
                  spellCheck={false}
                />
              </div>
            )}
            {(viewMode === "preview" || viewMode === "split") && (
              <div className={viewMode === "split" ? "w-1/2" : "w-full"}>
                {viewMode === "split" && <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Preview</p>}
                <div className="h-[32rem] overflow-y-auto bg-gray-800 border border-gray-600 rounded p-3 text-sm text-gray-300 prose-invert">
                  {content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
                      {content}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-gray-500 italic">Nothing to preview</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedFiles).map(([dir, dirFiles]) => (
            <div key={dir}>
              <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-2">{dir === "root" ? "Memory" : dir}</h4>
              <div className="space-y-2">
                {dirFiles.map((f) => (
                  <button
                    key={f.path}
                    onClick={() => openFile(f.path)}
                    className="w-full text-left bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-500 transition-colors"
                  >
                    <p className="text-sm text-white font-medium">{f.path}</p>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{f.preview || "Empty"}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {files.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No memory files found.</p>}
        </div>
      )}
    </div>
  );
}
