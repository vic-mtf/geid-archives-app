/**
 * ResizeDivider — Séparateur vertical draggable.
 * Le drag ne commence que si le curseur est sur la ligne (zone de 6px).
 * Un overlay couvre l'écran pendant le drag pour capter le mousemove/mouseup.
 */

import React, { useCallback, useState } from "react";
import { Box } from "@mui/material";

interface ResizeDividerProps {
  onResize: (deltaX: number) => void;
}

const ResizeDivider = React.memo(function ResizeDivider({ onResize }: ResizeDividerProps) {
  const [dragging, setDragging] = useState(false);
  const lastX = React.useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    lastX.current = e.clientX;
    setDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const delta = e.clientX - lastX.current;
    lastX.current = e.clientX;
    onResize(delta);
  }, [dragging, onResize]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  return (
    <>
      {/* Ligne visible — zone de déclenchement */}
      <Box
        onMouseDown={handleMouseDown}
        sx={{
          width: 6,
          flexShrink: 0,
          cursor: "col-resize",
          bgcolor: dragging ? "primary.main" : "transparent",
          opacity: dragging ? 0.4 : 1,
          "&:hover": { bgcolor: "primary.main", opacity: 0.3 },
          transition: "background-color 0.15s",
          display: { xs: "none", md: "block" },
        }}
      />
      {/* Overlay transparent pendant le drag — capte le curseur même hors de la ligne */}
      {dragging && (
        <Box
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            cursor: "col-resize",
          }}
        />
      )}
    </>
  );
});

export default ResizeDivider;
