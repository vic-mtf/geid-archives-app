/**
 * ResizeDivider — Séparateur vertical ajustable via CSS Grid.
 *
 * La colonne fait 1px dans le grid parent.
 * Pendant le drag : appelle onResize throttlé à 60fps (rAF).
 * Au mouseUp : un dernier appel onResize pour la valeur finale.
 */

import React, { useCallback, useRef } from "react";
import { Box } from "@mui/material";

interface ResizeDividerProps {
  minLeft?: number;
  minRight?: number;
  onResize: (leftWidth: number) => void;
}

const ResizeDivider = React.memo(function ResizeDivider({
  minLeft = 180,
  minRight = 250,
  onResize,
}: ResizeDividerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;
  const rafRef = useRef<number | null>(null);

  const clamp = useCallback((clientX: number): number | null => {
    const el = containerRef.current;
    const parent = el?.parentElement;
    if (!parent) return null;
    const rect = parent.getBoundingClientRect();
    const raw = clientX - rect.left;
    // Largeur du panneau detail : uniquement s'il existe apres la colonne centrale
    // (sidebar | divider | center | detail?). Le divider est a l'index 1.
    // S'il y a 4 enfants ou plus, le dernier est le panneau detail.
    const children = Array.from(parent.children) as HTMLElement[];
    const detailW = children.length >= 4
      ? children[children.length - 1].getBoundingClientRect().width
      : 0;
    const maxLeft = rect.width - 1 - minRight - detailW;
    return Math.max(minLeft, Math.min(maxLeft, raw));
  }, [minLeft, minRight]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;

    el.classList.add("active");

    const onMove = (ev: MouseEvent) => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const v = clamp(ev.clientX);
        if (v !== null) onResizeRef.current(v);
      });
    };

    const onUp = (ev: MouseEvent) => {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      el.classList.remove("active");
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      const v = clamp(ev.clientX);
      if (v !== null) onResizeRef.current(v);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [clamp]);

  return (
    <Box
      ref={containerRef}
      onMouseDown={onMouseDown}
      sx={{
        width: "100%",
        bgcolor: "divider",
        cursor: "col-resize",
        position: "relative",
        zIndex: 10,
        display: { xs: "none", md: "block" },
        "&::after": {
          content: '""',
          position: "absolute",
          top: 0, bottom: 0, left: -6,
          width: 13,
          cursor: "col-resize",
          zIndex: 10,
        },
        "&:hover, &.active": { bgcolor: "primary.main", width: 3 },
        transition: "background-color 0.15s, width 0.15s",
      }}
    />
  );
});

export default ResizeDivider;
