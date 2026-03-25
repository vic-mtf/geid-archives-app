/**
 * PhysicalItemsList — Liste des elements du niveau courant
 * avec skeleton de chargement et etat vide.
 */

import React from "react";
import {
  Box,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";

import { Virtuoso } from "react-virtuoso";
import scrollBarSx from "@/utils/scrollBarSx";
import type { PhysicalLevel } from "@/constants/physical";
import InlineEditableLabel from "./InlineEditableLabel";
import getFileIcon from "@/utils/getFileIcon";
import openArchiveFile from "@/utils/openArchiveFile";
import { DraggableArchive, DroppableDocument } from "./DndWrappers";

// ── Types ────────────────────────────────────────────────

export interface DisplayItem {
  id: string;
  label: string;
  sub?: string;
  meta?: string;
  isArchive?: boolean;
  fileUrl?: string;
}

interface LevelConfig {
  icon: React.ReactNode;
  label: string;
  color: string;
}

interface PhysicalItemsListProps {
  loading: boolean;
  items: DisplayItem[];
  currentLevel: PhysicalLevel;
  levelConfig: Record<PhysicalLevel, LevelConfig>;
  selectedId: string | null;
  canWrite: boolean;
  renamingId: string | null;
  onRenamingEnd: () => void;
  onSelect: (id: string, label: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string, label: string) => void;
  parentDocumentId?: string;
  onArchiveContextMenu?: (e: React.MouseEvent, archiveId: string, label: string) => void;
  onRename: (id: string, newValue: string) => Promise<void>;
}

// ── Composant ────────────────────────────────────────────

const PhysicalItemsList = React.memo(function PhysicalItemsList({
  loading,
  items,
  currentLevel,
  levelConfig,
  selectedId,
  canWrite,
  renamingId,
  onRenamingEnd,
  onSelect,
  onContextMenu,
  onArchiveContextMenu,
  onRename,
  parentDocumentId,
}: PhysicalItemsListProps) {
  if (loading) {
    return (
      <Box overflow="auto" flex={1} sx={{ ...scrollBarSx }}>
        <Stack spacing={0}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Box key={i} px={2} py={0.75} display="flex" alignItems="center" gap={1} borderBottom="1px solid" borderColor="divider">
              <Skeleton variant="circular" width={20} height={20} />
              <Box flex={1}>
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton variant="text" width="40%" height={14} />
              </Box>
              <Skeleton variant="text" width={80} height={14} sx={{ display: { xs: "none", sm: "block" } }} />
            </Box>
          ))}
        </Stack>
      </Box>
    );
  }

  if (items.length === 0) {
    return (
      <Box overflow="auto" flex={1} sx={{ ...scrollBarSx }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={6} gap={1}>
          <Box sx={{ color: levelConfig[currentLevel].color, opacity: 0.4 }}>
            {React.cloneElement(levelConfig[currentLevel].icon as React.ReactElement, { sx: { fontSize: 40 } })}
          </Box>
          <Typography color="text.secondary" variant="body2">
            Aucun {levelConfig[currentLevel].label.toLowerCase()}
          </Typography>
          <Typography color="text.disabled" variant="caption">
            Utilisez le bouton + pour en créer
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Virtuoso
      style={{ flex: 1 }}
      totalCount={items.length}
      overscan={200}
      itemContent={(index) => {
        const item = items[index];
        const isSelected = selectedId === item.id;
        const isDoc = !item.isArchive && currentLevel === "document";

        const row = (
          <Box
            data-highlight-id={item.id}
            px={2}
            py={0.75}
            display="flex"
            alignItems="center"
            gap={1}
            sx={{
              cursor: "pointer",
              bgcolor: isSelected ? "action.selected" : "transparent",
              "&:hover": { bgcolor: isSelected ? "action.selected" : "action.hover" },
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
            onClick={() => {
              if (item.isArchive) {
                openArchiveFile(item.id, item.label);
              } else {
                onSelect(item.id, item.label);
              }
            }}
            onContextMenu={(e) => {
              if (item.isArchive) {
                e.preventDefault();
                e.stopPropagation();
                onArchiveContextMenu?.(e, item.id, item.label);
              } else {
                onContextMenu(e, item.id, item.label);
              }
            }}>
            {/* Icone — typée pour les archives, niveau pour les éléments physiques */}
            {item.isArchive ? (() => {
              const fi = getFileIcon(item.fileUrl ?? item.label);
              return (
                <Box sx={{ color: fi.color, display: "flex", flexShrink: 0 }}>
                  {React.cloneElement(fi.icon, { fontSize: "small" })}
                </Box>
              );
            })() : (
              <Box sx={{ color: levelConfig[currentLevel].color, display: "flex", flexShrink: 0 }}>
                {React.cloneElement(levelConfig[currentLevel].icon as React.ReactElement, { fontSize: "small" })}
              </Box>
            )}
            {/* Nom + sous-titre */}
            <Box flex={1} minWidth={0}>
              {item.isArchive ? (
                <Typography variant="body2" fontWeight={500} noWrap>{item.label}</Typography>
              ) : (
                <InlineEditableLabel
                  value={item.label}
                  editable={canWrite}
                  forceEdit={renamingId === item.id}
                  onEditEnd={onRenamingEnd}
                  onSave={(newValue) => onRename(item.id, newValue)}
                  variant="body2"
                  fontWeight={500}
                  noWrap
                />
              )}
              {item.sub && (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {item.sub}
                </Typography>
              )}
            </Box>
            {/* Fleche navigation (pas pour les archives) */}
            {!item.isArchive && (
              <NavigateNextRoundedIcon fontSize="small" sx={{ color: "text.disabled", flexShrink: 0 }} />
            )}
          </Box>
        );

        // Wrap avec DnD : archives = draggable, documents = droppable
        if (item.isArchive) {
          return (
            <DraggableArchive archiveId={item.id} archiveLabel={item.label} sourceDocumentId={parentDocumentId} disabled={!canWrite}>
              {row}
            </DraggableArchive>
          );
        }
        if (isDoc) {
          return (
            <DroppableDocument documentId={item.id} documentLabel={item.label}>
              {row}
            </DroppableDocument>
          );
        }
        return row;
      }}
    />
  );
});

export default PhysicalItemsList;
