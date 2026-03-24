/**
 * HierarchyLevelCards — Cartes de navigation pour chaque niveau de la
 * hiérarchie physique (conteneur, étagère, étage, classeur, dossier).
 */

import React from "react";
import {
  Typography, Box, Stack, Paper, Chip,
  LinearProgress, Tooltip,
} from "@mui/material";
import WarehouseOutlinedIcon       from "@mui/icons-material/WarehouseOutlined";
import LayersOutlinedIcon          from "@mui/icons-material/LayersOutlined";
import FolderOpenOutlinedIcon      from "@mui/icons-material/FolderOpenOutlined";
import BookmarkBorderOutlinedIcon  from "@mui/icons-material/BookmarkBorderOutlined";
import ArticleOutlinedIcon         from "@mui/icons-material/ArticleOutlined";
import CheckCircleIcon             from "@mui/icons-material/CheckCircle";
import ChevronRightIcon            from "@mui/icons-material/ChevronRight";
import type { Item } from "@/views/forms/archives/hierarchyTypes";

// ── Style partagé ────────────────────────────────────────────

export const cardSx = {
  p: 1.5,
  cursor: "pointer",
  borderRadius: 1.5,
  transition: "all .15s",
  "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
};

// ── ContainerCard ────────────────────────────────────────────

export const ContainerCard = React.memo(function ContainerCard({ item, onClick }: { item: Item; onClick: () => void }) {
  return (
    <Paper variant="outlined" onClick={onClick} sx={cardSx}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box sx={{ color: "primary.main", flexShrink: 0 }}>
          <WarehouseOutlinedIcon />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700} noWrap>{item.name as string}</Typography>
          {!!item.location && (
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {item.location as string}
            </Typography>
          )}
        </Box>
        <ChevronRightIcon sx={{ color: "text.disabled", flexShrink: 0 }} />
      </Stack>
    </Paper>
  );
});

// ── ShelfCard ────────────────────────────────────────────────

export const ShelfCard = React.memo(function ShelfCard({ item, onClick }: { item: Item; onClick: () => void }) {
  return (
    <Paper variant="outlined" onClick={onClick} sx={cardSx}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box sx={{ color: "primary.main", flexShrink: 0 }}>
          <LayersOutlinedIcon />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700} noWrap>{item.name as string}</Typography>
          {!!item.description && (
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {item.description as string}
            </Typography>
          )}
        </Box>
        <ChevronRightIcon sx={{ color: "text.disabled", flexShrink: 0 }} />
      </Stack>
    </Paper>
  );
});

// ── FloorCard ────────────────────────────────────────────────

export const FloorCard = React.memo(function FloorCard({ item, onClick }: { item: Item; onClick: () => void }) {
  const unit = (item.administrativeUnit as Record<string, unknown> | undefined)?.name as string | undefined;
  return (
    <Paper variant="outlined" onClick={onClick} sx={cardSx}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box sx={{ color: "primary.main", flexShrink: 0 }}>
          <FolderOpenOutlinedIcon />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700}>
            Étage {item.number as number}
            {item.label ? ` — ${item.label as string}` : ""}
          </Typography>
          {unit && (
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {unit}
            </Typography>
          )}
        </Box>
        <ChevronRightIcon sx={{ color: "text.disabled", flexShrink: 0 }} />
      </Stack>
    </Paper>
  );
});

// ── BinderCard ───────────────────────────────────────────────

export const BinderCard = React.memo(function BinderCard({ item, onClick }: { item: Item; onClick: () => void }) {
  const current  = (item.currentCount as number) ?? 0;
  const capacity = (item.maxCapacity  as number) ?? 1;
  const pct      = Math.min((current / capacity) * 100, 100);
  const full     = current >= capacity;
  return (
    <Tooltip title={full ? "Classeur plein — aucun nouveau dossier possible" : ""} placement="top">
      <Paper
        variant="outlined"
        onClick={full ? undefined : onClick}
        sx={{ ...cardSx, opacity: full ? 0.5 : 1, cursor: full ? "not-allowed" : "pointer" }}>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={0.75}>
          <Box sx={{ color: full ? "text.disabled" : "primary.main", flexShrink: 0 }}>
            <BookmarkBorderOutlinedIcon />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} noWrap>{item.name as string}</Typography>
            <Chip
              label={item.nature as string}
              size="small"
              variant="outlined"
              sx={{ height: 18, fontSize: "0.65rem", mt: 0.25 }}
            />
          </Box>
          {!full && <ChevronRightIcon sx={{ color: "text.disabled", flexShrink: 0 }} />}
        </Stack>
        {/* Barre de capacité */}
        <Box>
          <Stack direction="row" justifyContent="space-between" mb={0.25}>
            <Typography variant="caption" color="text.secondary">Occupation</Typography>
            <Typography variant="caption" color={full ? "error.main" : "text.secondary"}>
              {current} / {capacity}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={pct}
            color={pct >= 90 ? "error" : pct >= 70 ? "warning" : "primary"}
            sx={{ borderRadius: 1, height: 5 }}
          />
        </Box>
      </Paper>
    </Tooltip>
  );
});

// ── RecordCard ───────────────────────────────────────────────

export const RecordCard = React.memo(function RecordCard({ item, selected, onClick, onDrillDown }: { item: Item; selected: boolean; onClick: () => void; onDrillDown?: () => void }) {
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        ...cardSx,
        borderColor: selected ? "primary.main" : undefined,
        bgcolor: selected ? "action.selected" : undefined,
        outline: selected ? "2px solid" : "none",
        outlineColor: "primary.main",
      }}>
      <Stack direction="row" alignItems="flex-start" spacing={1.5}>
        <Box sx={{ color: selected ? "primary.main" : "text.secondary", flexShrink: 0, mt: 0.2 }}>
          {selected ? <CheckCircleIcon fontSize="small" color="primary" /> : <ArticleOutlinedIcon fontSize="small" />}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" mb={0.25}>
            <Typography variant="body2" fontWeight={700}>{String(item.internalNumber ?? "")}</Typography>
            {!!item.category && <Chip label={String(item.category)} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.65rem" }} />}
          </Stack>
          {!!item.subject && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {String(item.subject)}
            </Typography>
          )}
          {!!item.refNumber && (
            <Typography variant="caption" color="text.disabled">
              Réf. {String(item.refNumber)}
            </Typography>
          )}
        </Box>
        {onDrillDown && (
          <Tooltip title="Voir le contenu">
            <Box
              onClick={(e) => { e.stopPropagation(); onDrillDown(); }}
              sx={{ cursor: "pointer", color: "text.disabled", flexShrink: 0, "&:hover": { color: "primary.main" } }}>
              <ChevronRightIcon />
            </Box>
          </Tooltip>
        )}
      </Stack>
    </Paper>
  );
});
