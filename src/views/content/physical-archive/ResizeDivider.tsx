/**
 * ResizeDivider — Séparateur vertical ajustable.
 *
 * Conteneur fixe 8px. Ligne ::before fine par défaut, grosse au drag.
 * Utilise des classes CSS pour éviter les re-renders pendant le drag.
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

  const applyPosition = useCallback((clientX: number) => {
    const el = containerRef.current;
    const parent = el?.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const raw = clientX - rect.left;
    const dividerWidth = 8;
    const lastChild = parent.lastElementChild as HTMLElement | null;
    const detailWidth = lastChild && lastChild !== el ? lastChild.getBoundingClientRect().width : 0;
    const maxLeft = rect.width - dividerWidth - minRight - detailWidth;
    const clamped = Math.max(minLeft, Math.min(maxLeft, raw));
    onResizeRef.current(clamped);
  }, [minLeft, minRight]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;

    // Ajouter la classe "dragging" directement sur le DOM — pas de re-render
    el.classList.add("dragging");
    applyPosition(e.clientX);

    const onMove = (ev: MouseEvent) => applyPosition(ev.clientX);
    const onUp = () => {
      el.classList.remove("dragging");
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [applyPosition]);

  return (
    <Box
      ref={containerRef}
      onMouseDown={onMouseDown}
      sx={{
        width: 8,
        flexShrink: 0,
        cursor: "col-resize",
        display: { xs: "none", md: "flex" },
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "transparent",
        // Ligne fine par défaut
        "&::before": {
          content: '""',
          display: "block",
          width: 1,
          height: "100%",
          bgcolor: "divider",
          transition: "width 0.1s, background-color 0.15s",
        },
        // Hover → couleur bleue
        "&:hover::before": {
          bgcolor: "primary.main",
        },
        // Drag → grosse + bleue (classe ajoutée via DOM, pas de re-render)
        "&.dragging::before": {
          width: 3,
          bgcolor: "primary.main",
          transition: "none",
        },
      }}
    />
  );
});

export default ResizeDivider;
