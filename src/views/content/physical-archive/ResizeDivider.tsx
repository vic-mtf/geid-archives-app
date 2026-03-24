/**
 * ResizeDivider — Séparateur vertical mince (2px) avec zone de hover élargie.
 * Le drag utilise des listeners natifs sur document pour éviter le lag.
 */

import React, { useCallback, useRef } from "react";
import { Box } from "@mui/material";

interface ResizeDividerProps {
  onResize: (deltaX: number) => void;
}

const ResizeDivider = React.memo(function ResizeDivider({ onResize }: ResizeDividerProps) {
  const lastX = useRef(0);
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    lastX.current = e.clientX;

    const move = (ev: MouseEvent) => {
      const delta = ev.clientX - lastX.current;
      lastX.current = ev.clientX;
      onResizeRef.current(delta);
    };

    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  return (
    <Box
      onMouseDown={handleMouseDown}
      sx={{
        width: 2,
        flexShrink: 0,
        position: "relative",
        display: { xs: "none", md: "block" },
        bgcolor: "divider",
        // Zone de clic élargie via pseudo-element (12px)
        "&::after": {
          content: '""',
          position: "absolute",
          top: 0,
          bottom: 0,
          left: -5,
          width: 12,
          cursor: "col-resize",
        },
        "&:hover": {
          bgcolor: "primary.main",
        },
        transition: "background-color 0.15s",
      }}
    />
  );
});

export default ResizeDivider;
