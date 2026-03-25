/**
 * DndWrappers — Composants wrapper pour drag & drop d'archives.
 *
 * DraggableArchive : rend un élément draggable (archive numérique)
 * DroppableDocument : rend un élément droppable (document physique)
 */

import React from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Box } from "@mui/material";
import type { ArchiveDragData, DocumentDropData } from "./useArchiveDnd";

// ── Archive draggable ───────────────────────────────────────

interface DraggableArchiveProps {
  archiveId: string;
  archiveLabel: string;
  sourceDocumentId?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export const DraggableArchive = React.memo(function DraggableArchive({
  archiveId,
  archiveLabel,
  sourceDocumentId,
  disabled,
  children,
}: DraggableArchiveProps) {
  const data: ArchiveDragData = { type: "archive", archiveId, archiveLabel, sourceDocumentId };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `archive-${archiveId}`,
    data,
    disabled,
  });

  return (
    <Box
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={{
        opacity: isDragging ? 0.4 : 1,
        cursor: disabled ? "default" : "grab",
        "&:active": disabled ? {} : { cursor: "grabbing" },
      }}
    >
      {children}
    </Box>
  );
});

// ── Document droppable ──────────────────────────────────────

interface DroppableDocumentProps {
  documentId: string;
  documentLabel: string;
  recordId?: string;
  children: React.ReactNode;
}

export const DroppableDocument = React.memo(function DroppableDocument({
  documentId,
  documentLabel,
  recordId,
  children,
}: DroppableDocumentProps) {
  const data: DocumentDropData = { type: "document", documentId, documentLabel, recordId };
  const { setNodeRef, isOver } = useDroppable({
    id: `doc-drop-${documentId}`,
    data,
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        bgcolor: isOver ? "primary.50" : "transparent",
        outline: isOver ? "2px dashed" : "none",
        outlineColor: "primary.main",
        borderRadius: isOver ? 1 : 0,
        transition: "background-color 0.15s, outline 0.15s",
      }}
    >
      {children}
    </Box>
  );
});
