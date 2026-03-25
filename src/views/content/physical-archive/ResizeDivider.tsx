/**
 * ResizeDivider — Séparateur vertical ajustable via CSS Grid.
 *
 * La colonne fait 1px dans le grid parent. Le divider remplit cette colonne.
 * Aucun changement de taille — seule la couleur change.
 * La zone de clic est élargie via un pseudo-element invisible.
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
    const children = Array.from(parent.children) as HTMLElement[];
    const detailEl = children[children.length - 1];
    const detailWidth = detailEl && detailEl !== el ? detailEl.getBoundingClientRect().width : 0;
    const raw = clientX - rect.left;
    const maxLeft = rect.width - 1 - minRight - detailWidth;
    const clamped = Math.max(minLeft, Math.min(maxLeft, raw));
    onResizeRef.current(clamped);
  }, [minLeft, minRight]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;

    el.classList.add("active");
    applyPosition(e.clientX);

    const onMove = (ev: MouseEvent) => applyPosition(ev.clientX);
    const onUp = () => {
      el.classList.remove("active");
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
        // Remplit la colonne grid de 1px
        width: "100%",
        bgcolor: "divider",
        cursor: "col-resize",
        position: "relative",
        display: { xs: "none", md: "block" },
        // Zone de clic élargie (invisible, 12px)
        "&::after": {
          content: '""',
          position: "absolute",
          top: 0,
          bottom: 0,
          left: -6,
          width: 13,
          cursor: "col-resize",
          zIndex: 1,
        },
        "&:hover, &.active": {
          bgcolor: "primary.main",
        },
        transition: "background-color 0.15s",
      }}
    />
  );
});

export default ResizeDivider;
