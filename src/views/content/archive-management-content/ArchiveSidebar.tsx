/**
 * ArchiveSidebar — Panneau latéral gauche de la gestion des archives (md+).
 *
 * Contient :
 *   - Boutons Ajouter / Rechercher / Exporter
 *   - Filtres par statut
 *   - Filtres rapides (DUA expirées, ce mois)
 *   - Accès rapide aux 5 dernières archives
 *   - Statistiques en pied de sidebar
 */

import React from "react";
import {
  Box as MuiBox,
  Button,
  Chip,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon            from "@mui/icons-material/AddRounded";
import SearchRoundedIcon         from "@mui/icons-material/SearchRounded";
import FileDownloadOutlinedIcon  from "@mui/icons-material/FileDownloadOutlined";
import AlarmRoundedIcon          from "@mui/icons-material/AlarmRounded";
import CalendarTodayRoundedIcon  from "@mui/icons-material/CalendarTodayRounded";
import BoltRoundedIcon           from "@mui/icons-material/BoltRounded";
import scrollBarSx               from "@/utils/scrollBarSx";
import { STATUS_COLOR, normalizeStatus, type NormalizedStatus } from "@/constants/lifecycle";

// ── Types ────────────────────────────────────────────────────

type StatusFilter = "ALL" | NormalizedStatus;

interface StatusNavItem {
  key: StatusFilter;
  label: string;
  icon: React.ReactNode;
  color: string;
}

interface RecentArchive {
  id: string;
  status?: string;
  validated?: boolean;
  designation?: string;
  [key: string]: unknown;
}

export interface ArchiveSidebarProps {
  canWrite: boolean;
  statusNav: StatusNavItem[];
  statusFilter: StatusFilter;
  quickFilter: "dua_expired" | "this_month" | null;
  totalCount: number;
  statusCounts: Record<NormalizedStatus, number>;
  duaExpiredCount: number;
  thisMonthCount: number;
  recentArchives: RecentArchive[];
  focusedId: string | null;
  rowCount: number;
  onStatusFilter: (key: StatusFilter) => void;
  onQuickFilter: (key: "dua_expired" | "this_month" | null) => void;
  onOpenAdd: () => void;
  onExportCSV: () => void;
  onSelectArchive: (id: string) => void;
}

// ── Component ────────────────────────────────────────────────

const ArchiveSidebar = React.memo(function ArchiveSidebar({
  canWrite,
  statusNav,
  statusFilter,
  quickFilter,
  totalCount,
  statusCounts,
  duaExpiredCount,
  thisMonthCount,
  recentArchives,
  focusedId,
  rowCount,
  onStatusFilter,
  onQuickFilter,
  onOpenAdd,
  onExportCSV,
  onSelectArchive,
}: ArchiveSidebarProps) {
  return (
    <MuiBox
      sx={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Boutons Ajouter + Rechercher + Exporter */}
      <MuiBox px={1.5} pt={1.5} pb={0.75} display="flex" gap={1}>
        {canWrite && (
          <Button
            variant="contained"
            size="small"
            fullWidth
            startIcon={<AddRoundedIcon />}
            onClick={onOpenAdd}
            disableElevation
          >
            Ajouter
          </Button>
        )}
        <Tooltip title="Recherche globale (Ctrl+K)" placement="right">
          <IconButton
            size="small"
            onClick={() => {
              document.getElementById("root")?.dispatchEvent(
                new CustomEvent("__global_search_open")
              );
            }}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
            <SearchRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={`Exporter la liste en CSV (${rowCount} lignes)`} placement="right">
          <IconButton
            size="small"
            onClick={onExportCSV}
            disabled={rowCount === 0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
            <FileDownloadOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </MuiBox>

      {/* Filtres scrollables */}
      <MuiBox flex={1} overflow="auto" sx={{ ...scrollBarSx, pt: canWrite ? 0.5 : 1 }}>
        <List dense disablePadding>
          {statusNav.map(({ key, label, icon, color }) => {
            const count    = key === "ALL" ? totalCount : statusCounts[key] ?? 0;
            const isActive = statusFilter === key && quickFilter === null;
            return (
              <ListItemButton
                key={key}
                selected={isActive}
                onClick={() => onStatusFilter(key)}
                sx={{ borderRadius: 1, mx: 0.5, my: 0.125, py: 0.75 }}
              >
                <ListItemIcon sx={{ minWidth: 28, color: isActive ? undefined : color }}>
                  {icon}
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{ variant: "body2", noWrap: true }}
                />
                {count > 0 && (
                  <Chip
                    label={count}
                    size="small"
                    color={key === "PENDING" ? "warning" : "default"}
                    sx={{ height: 18, fontSize: 11, ".MuiChip-label": { px: 0.75 } }}
                  />
                )}
              </ListItemButton>
            );
          })}
        </List>

        {/* Filtres rapides */}
        <Divider sx={{ mx: 1, my: 0.75 }} />
        <List dense disablePadding>
          <ListItemButton
            selected={quickFilter === "dua_expired"}
            onClick={() => onQuickFilter(quickFilter === "dua_expired" ? null : "dua_expired")}
            sx={{ borderRadius: 1, mx: 0.5, my: 0.125, py: 0.75 }}
          >
            <ListItemIcon sx={{ minWidth: 28, color: quickFilter === "dua_expired" ? undefined : "error.main" }}>
              <AlarmRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Durée de conservation dépassées" primaryTypographyProps={{ variant: "body2", noWrap: true }} />
            {duaExpiredCount > 0 && (
              <Chip
                label={duaExpiredCount}
                size="small"
                color="error"
                sx={{ height: 18, fontSize: 11, ".MuiChip-label": { px: 0.75 } }}
              />
            )}
          </ListItemButton>

          <ListItemButton
            selected={quickFilter === "this_month"}
            onClick={() => onQuickFilter(quickFilter === "this_month" ? null : "this_month")}
            sx={{ borderRadius: 1, mx: 0.5, my: 0.125, py: 0.75 }}
          >
            <ListItemIcon sx={{ minWidth: 28, color: quickFilter === "this_month" ? undefined : "text.secondary" }}>
              <CalendarTodayRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Ce mois" primaryTypographyProps={{ variant: "body2", noWrap: true }} />
            {thisMonthCount > 0 && (
              <Chip
                label={thisMonthCount}
                size="small"
                sx={{ height: 18, fontSize: 11, ".MuiChip-label": { px: 0.75 } }}
              />
            )}
          </ListItemButton>
        </List>
      </MuiBox>

      {/* Accès rapide : 5 dernières archives */}
      {recentArchives.length > 0 && (
        <>
          <Divider sx={{ mx: 1, my: 0.75 }} />
          <MuiBox px={1} pb={0.5}>
            <MuiBox display="flex" alignItems="center" gap={0.5} px={0.5} pb={0.25}>
              <BoltRoundedIcon sx={{ fontSize: 14, color: "text.disabled" }} />
              <Typography variant="caption" color="text.disabled" fontWeight="bold" textTransform="uppercase" letterSpacing={0.5}>
                Récents
              </Typography>
            </MuiBox>
            <List dense disablePadding>
              {recentArchives.map((r) => {
                const norm = normalizeStatus(r.status, r.validated);
                const isFocused = focusedId === r.id;
                return (
                  <ListItemButton
                    key={r.id}
                    selected={isFocused}
                    onClick={() => onSelectArchive(r.id)}
                    sx={{ borderRadius: 1, mx: 0, my: 0.125, py: 0.5, px: 0.75 }}>
                    <MuiBox
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        bgcolor: `${STATUS_COLOR[norm]}.main`,
                        flexShrink: 0,
                        mr: 0.75,
                      }}
                    />
                    <ListItemText
                      primary={r.designation ?? r.id}
                      primaryTypographyProps={{ variant: "caption", noWrap: true }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </MuiBox>
        </>
      )}

      {/* Pied de sidebar — statistiques */}
      <Divider />
      <MuiBox px={2} py={1.25}>
        <Typography variant="caption" color="text.disabled" display="block">
          {totalCount} archives
        </Typography>
        {statusCounts.PENDING > 0 && (
          <Typography variant="caption" color="warning.main" display="block">
            {statusCounts.PENDING} en attente de validation
          </Typography>
        )}
        {duaExpiredCount > 0 && (
          <Typography variant="caption" color="error.main" display="block">
            {duaExpiredCount} durées de conservation dépassées
          </Typography>
        )}
      </MuiBox>
    </MuiBox>
  );
});

export default ArchiveSidebar;
