/**
 * EliminationSidebar — Panneau latéral gauche de la gestion des PV d'élimination.
 *
 * Même pattern que ArchiveSidebar :
 *   - Bouton d'action en haut
 *   - Filtres par statut avec compteurs
 *   - Statistiques en pied
 */

import React from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import { useTranslation } from "react-i18next";
import scrollBarSx from "@/utils/scrollBarSx";
import { PV_STATUS_COLOR, PV_STATUS_ICON, PV_STATUSES, type PvStatus } from "./pvStatusConfig";

export interface EliminationSidebarProps {
  statusFilter: PvStatus | "ALL";
  statusCounts: Record<PvStatus, number>;
  totalCount: number;
  canWrite: boolean;
  onStatusFilter: (status: PvStatus | "ALL") => void;
  onOpenCreate: () => void;
}

const EliminationSidebar = React.memo(function EliminationSidebar({
  statusFilter,
  statusCounts,
  totalCount,
  canWrite,
  onStatusFilter,
  onOpenCreate,
}: EliminationSidebarProps) {
  const { t } = useTranslation();

  const pendingCount = (statusCounts.PENDING_PRODUCER ?? 0) + (statusCounts.PENDING_DANTIC ?? 0);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Bouton Nouveau PV */}
      {canWrite && (
        <Box px={1.5} pt={1.5} pb={0.75}>
          <Button variant="contained" size="small" fullWidth startIcon={<AddOutlinedIcon />}
            onClick={onOpenCreate} disableElevation>
            {t("elimination.newPv")}
          </Button>
        </Box>
      )}

      {/* Filtres par statut */}
      <Box flex={1} overflow="auto" sx={{ ...scrollBarSx, pt: canWrite ? 0.5 : 1.5 }}>
        <List dense disablePadding>
          {/* Tous */}
          <ListItemButton selected={statusFilter === "ALL"}
            onClick={() => onStatusFilter("ALL")}
            sx={{ borderRadius: 1, mx: 0.5, my: 0.125, py: 0.75 }}>
            <ListItemIcon sx={{ minWidth: 28 }}>
              <InboxOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t("elimination.filter.all")}
              primaryTypographyProps={{ variant: "body2", noWrap: true }} />
            {totalCount > 0 && (
              <Chip label={totalCount} size="small"
                sx={{ height: 18, fontSize: 11, ".MuiChip-label": { px: 0.75 } }} />
            )}
          </ListItemButton>

          {/* Par statut */}
          {PV_STATUSES.map((status) => {
            const count = statusCounts[status] ?? 0;
            const isActive = statusFilter === status;
            const isPending = status === "PENDING_PRODUCER" || status === "PENDING_DANTIC";
            return (
              <ListItemButton key={status} selected={isActive}
                onClick={() => onStatusFilter(status)}
                sx={{ borderRadius: 1, mx: 0.5, my: 0.125, py: 0.75 }}>
                <ListItemIcon sx={{ minWidth: 28, color: isActive ? undefined : `${PV_STATUS_COLOR[status]}.main` }}>
                  {PV_STATUS_ICON[status]}
                </ListItemIcon>
                <ListItemText primary={t(`elimination.filter.${status}`)}
                  primaryTypographyProps={{ variant: "body2", noWrap: true }} />
                {count > 0 && (
                  <Chip label={count} size="small" color={isPending ? "warning" : "default"}
                    sx={{ height: 18, fontSize: 11, ".MuiChip-label": { px: 0.75 } }} />
                )}
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      {/* Statistiques */}
      <Divider />
      <Box px={2} py={1.25}>
        <Typography variant="caption" color="text.disabled" display="block">
          {t("elimination.stats.total", { count: totalCount })}
        </Typography>
        {pendingCount > 0 && (
          <Typography variant="caption" color="warning.main" display="block">
            {t("elimination.stats.pending", { count: pendingCount })}
          </Typography>
        )}
      </Box>
    </Box>
  );
});

export default EliminationSidebar;
