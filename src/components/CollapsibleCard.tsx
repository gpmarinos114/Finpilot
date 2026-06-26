"use client";

import { useState, type ReactNode } from "react";

interface Props {
  title: string;
  icon?: string;
  defaultOpen?: boolean;
  headerExtra?: ReactNode;
  children: ReactNode;
}

export default function CollapsibleCard({ title, icon, defaultOpen = true, headerExtra, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-sm">{icon}</span>}
          <h2 className="text-sm font-semibold text-white">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          {headerExtra && (
            <span onClick={(e) => e.stopPropagation()}>{headerExtra}</span>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
