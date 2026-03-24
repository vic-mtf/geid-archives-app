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
import ArticleOutlinedIcon    from "@mui/icons-material/ArticleOutlined";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";

import scrollBarSx from "@/utils/scrollBarSx";
import type { PhysicalLevel } from "@/constants/physical";
import InlineEditableLabel from "./InlineEditableLabel";

// ── Types ────────────────────────────────────────────────

export interface DisplayItem {
  id: string;
  label: string;
  sub?: string;
  meta?: string;
  itemType?: "document" | "archive";
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
  onSelect: (id: string, label: string, itemType?: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string, label: string) => void;
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
  onRename,
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
            Utilisez le bouton + dans l&apos;arborescence pour en créer
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box overflow="auto" flex={1} sx={{ ...scrollBarSx }}>
      {items.map((item) => {
        const isSelected = selectedId === item.id;
        return (
          <Box
            key={item.id}
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
            onClick={() => onSelect(item.id, item.label, item.itemType)}
            onContextMenu={(e) => onContextMenu(e, item.id, item.label)}>
            {/* Icone */}
            <Box sx={{
              color: item.itemType === "archive" ? "#43A047" : levelConfig[currentLevel].color,
              display: "flex", flexShrink: 0
            }}>
              {item.itemType === "archive"
                ? <ArticleOutlinedIcon fontSize="small" />
                : React.cloneElement(levelConfig[currentLevel].icon as React.ReactElement, { fontSize: "small" })
              }
            </Box>
            {/* Nom (renommable) + sous-titre */}
            <Box flex={1} minWidth={0}>
              <InlineEditableLabel
                value={item.label}
                editable={canWrite && item.itemType !== "archive"}
                forceEdit={renamingId === item.id}
                onEditEnd={onRenamingEnd}
                onSave={(newValue) => onRename(item.id, newValue)}
                variant="body2"
                fontWeight={500}
                noWrap
              />
              {item.sub && (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {item.sub}
                </Typography>
              )}
            </Box>
            {/* Fleche navigation (pas pour les archives) */}
            {item.itemType !== "archive" && (
              <NavigateNextRoundedIcon fontSize="small" sx={{ color: "text.disabled", flexShrink: 0 }} />
            )}
          </Box>
        );
      })}
    </Box>
  );
});

export default PhysicalItemsList;
