/**
 * ResizeDivider — Séparateur vertical ajustable.
 *
 * Largeur fixe. Change de couleur au hover. Curseur col-resize.
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
    const parent = containerRef.current?.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const raw = clientX - rect.left;
    const clamped = Math.max(minLeft, Math.min(rect.width - minRight, raw));
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
        width: isDragging ? 3 : 1,
        flexShrink: 0,
        cursor: "col-resize",
        display: { xs: "none", md: "block" },
        bgcolor: isDragging ? "primary.main" : "divider",
        transition: isDragging ? "none" : "background-color 0.2s",
        "&:hover": { bgcolor: "primary.main" },
      }}
    />
  );
});

export default ResizeDivider;
