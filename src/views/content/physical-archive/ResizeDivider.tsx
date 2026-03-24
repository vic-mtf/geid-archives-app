/**
 * ResizeDivider — Séparateur vertical ajustable.
 *
 * Conteneur fixe 8px (invisible). Ligne intérieure via ::before.
 * Hover = couleur bleue. Drag = ligne plus épaisse.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
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
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const applyPosition = useCallback((clientX: number) => {
    const el = containerRef.current;
    const parent = el?.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const raw = clientX - rect.left;
    // Calculer l'espace pris par tout ce qui est après le divider (milieu min + détail réel)
    const dividerWidth = 8;
    const lastChild = parent.lastElementChild as HTMLElement | null;
    const detailWidth = lastChild && lastChild !== el ? lastChild.getBoundingClientRect().width : 0;
    const maxLeft = rect.width - dividerWidth - minRight - detailWidth;
    const clamped = Math.max(minLeft, Math.min(maxLeft, raw));
    onResize(clamped);
  }, [minLeft, minRight, onResize]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    applyPosition(e.clientX);
  }, [applyPosition]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => applyPosition(e.clientX);
    const onUp = () => setIsDragging(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, applyPosition]);

  return (
    <Box
      ref={containerRef}
      onMouseDown={onMouseDown}
      sx={{
        // Taille fixe — ne change jamais
        width: 8,
        flexShrink: 0,
        cursor: "col-resize",
        display: { xs: "none", md: "flex" },
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "transparent",
        // Ligne intérieure via pseudo-element
        "&::before": {
          content: '""',
          display: "block",
          width: isDragging ? 3 : 1,
          height: "100%",
          bgcolor: isDragging ? "primary.main" : "divider",
          transition: isDragging ? "none" : "width 0.15s, background-color 0.15s",
        },
        "&:hover::before": {
          bgcolor: "primary.main",
        },
      }}
    />
  );
});

export default ResizeDivider;
