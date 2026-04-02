"use client";

import { useEffect, useRef } from "react";

export function ContentProtect({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Block right-click context menu
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Block copy
    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    // Block cut
    const onCut = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    // Block drag
    const onDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    // Block keyboard shortcuts (Ctrl+C, Ctrl+A, Ctrl+U, Ctrl+S, Ctrl+P)
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ["c", "a", "u", "s", "p"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
      }
      // Block PrintScreen
      if (e.key === "PrintScreen") {
        e.preventDefault();
      }
    };

    el.addEventListener("contextmenu", onContextMenu);
    el.addEventListener("copy", onCopy);
    el.addEventListener("cut", onCut);
    el.addEventListener("dragstart", onDragStart);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      el.removeEventListener("contextmenu", onContextMenu);
      el.removeEventListener("copy", onCopy);
      el.removeEventListener("cut", onCut);
      el.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="select-none"
      style={{ WebkitUserSelect: "none", MozUserSelect: "none" } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
