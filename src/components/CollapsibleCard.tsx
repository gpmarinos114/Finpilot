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
    <div className="bg-base-200 rounded-lg border border-base-500 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-base-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-sm">{icon}</span>}
          <h2 className="text-sm font-semibold txt-primary">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          {headerExtra && (
            <span onClick={(e) => e.stopPropagation()}>{headerExtra}</span>
          )}
          <svg
            className={`w-4 h-4 txt-muted transition-transform ${open ? "rotate-180" : ""}`}
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
