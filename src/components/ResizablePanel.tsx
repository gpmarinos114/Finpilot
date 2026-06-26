"use client";

import { useState, useRef, useCallback, useEffect, ReactNode } from "react";

interface Props {
  children: ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  side?: "left" | "right";
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function ResizablePanel({
  children,
  defaultWidth = 380,
  minWidth = 280,
  maxWidth = 600,
  side = "right",
  collapsed = false,
  onToggleCollapse,
}: Props) {
  const [width, setWidth] = useState(defaultWidth);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth =
        side === "right"
          ? window.innerWidth - e.clientX
          : e.clientX;
      setWidth(Math.min(maxWidth, Math.max(minWidth, newWidth)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, side, minWidth, maxWidth]);

  if (collapsed) {
    return (
      <div className="flex items-center border-l border-base-300 bg-base-300">
        <button
          onClick={onToggleCollapse}
          className="p-2 txt-muted hover:txt-primary hover:bg-base-100 rounded"
          title="Expand chat"
        >
          {side === "right" ? "◀" : "▶"}
        </button>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className="relative flex flex-shrink-0 overflow-hidden"
      style={{ width }}
    >
      <div
        className={`absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-accent transition-colors z-10 ${
          isDragging ? "bg-accent" : "bg-transparent"
        } ${side === "right" ? "left-0" : "right-0"}`}
        onMouseDown={handleMouseDown}
      />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
