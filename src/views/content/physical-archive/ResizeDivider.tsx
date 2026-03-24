/**
 * ResizeDivider — Séparateur vertical ajustable.
 *
 * Conteneur fixe 8px. Ligne ::before 1px par défaut.
 * Hover = couleur bleue. Curseur dedans + maintenu = ligne 3px.
 * Pendant le drag (curseur hors zone) = ligne revient à 1px.
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
  const [isHover, setIsHover] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  // Grosse ligne = bouton maintenu (tout le drag)
  const thick = isDragging;

  return (
    <Box
      ref={containerRef}
      onMouseDown={onMouseDown}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      sx={{
        width: 8,
        flexShrink: 0,
        cursor: "col-resize",
        display: { xs: "none", md: "flex" },
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "transparent",
        "&::before": {
          content: '""',
          display: "block",
          width: thick ? 3 : 1,
          height: "100%",
          bgcolor: isHover || isDragging ? "primary.main" : "divider",
          transition: "width 0.1s, background-color 0.15s",
        },
      }}
    />
  );
});

export default ResizeDivider;
