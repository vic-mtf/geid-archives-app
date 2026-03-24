/**
 * ResizeDivider — Séparateur vertical draggable pour redimensionner deux panneaux.
 */

import React, { useCallback, useRef } from "react";
import { Box } from "@mui/material";

interface ResizeDividerProps {
  onResize: (deltaX: number) => void;
}

const ResizeDivider = React.memo(function ResizeDivider({ onResize }: ResizeDividerProps) {
  const startX = useRef(0);
  const dragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startX.current = e.clientX;
    dragging.current = true;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const delta = ev.clientX - startX.current;
      startX.current = ev.clientX;
      onResize(delta);
    };

    const handleMouseUp = () => {
      dragging.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [onResize]);

  return (
    <Box
      onMouseDown={handleMouseDown}
      sx={{
        width: 4,
        flexShrink: 0,
        cursor: "col-resize",
        bgcolor: "transparent",
        "&:hover": { bgcolor: "primary.main", opacity: 0.3 },
        transition: "background-color 0.15s",
        display: { xs: "none", md: "block" },
      }}
    />
  );
});

export default ResizeDivider;
