/**
 * ResizeDivider — Séparateur vertical ajustable inspiré de BeforeAfterSlider.
 *
 * Une ligne fine avec un handle rond au centre. Le drag utilise des
 * event listeners globaux pour un suivi fluide. Position en pourcentage.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";

interface ResizeDividerProps {
  /** Largeur min du panneau gauche en px */
  minLeft?: number;
  /** Largeur min du panneau droit en px */
  minRight?: number;
  /** Callback avec la nouvelle position du panneau gauche en px */
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
        position: "relative",
        width: 0,
        flexShrink: 0,
        display: { xs: "none", md: "block" },
        zIndex: 2,
      }}
    >
      {/* Ligne verticale fine */}
      <Box sx={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: -1,
        width: 2,
        bgcolor: isDragging ? "primary.main" : "divider",
        transition: isDragging ? "none" : "background-color 0.15s",
      }} />

      {/* Handle rond au centre */}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 24,
          height: 24,
          borderRadius: "50%",
          bgcolor: isDragging ? "primary.main" : "background.paper",
          border: "2px solid",
          borderColor: isDragging ? "primary.main" : "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "col-resize",
          boxShadow: 1,
          transition: isDragging ? "none" : "all 0.15s",
          "&:hover": {
            borderColor: "primary.main",
            bgcolor: "primary.50",
          },
        }}
      >
        <DragIndicatorRoundedIcon sx={{ fontSize: 14, color: isDragging ? "white" : "text.disabled" }} />
      </Box>

      {/* Zone de clic élargie invisible */}
      <Box sx={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: -8,
        width: 16,
        cursor: "col-resize",
      }} />
    </Box>
  );
});

export default ResizeDivider;
