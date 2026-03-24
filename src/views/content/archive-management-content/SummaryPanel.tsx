/**
 * SummaryPanel — Panneau résumé affiché dans la colonne droite
 * quand aucune archive n'est sélectionnée.
 *
 * Contient :
 *   - Statistiques rapides par statut
 *   - Suppression groupée (admin)
 *   - Actions rapides (ajouter, rechercher, exporter)
 *   - 5 dernières archives
 */

import React from "react";
import {
  Box as MuiBox,
  Button,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import scrollBarSx from "@/utils/scrollBarSx";
import { STATUS_COLOR, normalizeStatus, type NormalizedStatus } from "@/constants/lifecycle";

interface RecentArchive {
  id: string;
  status?: string;
  validated?: boolean;
  designation?: string;
  [key: string]: unknown;
}

export interface SummaryPanelProps {
  totalCount: number;
  statusCounts: Record<NormalizedStatus, number>;
  duaExpiredCount: number;
  canWrite: boolean;
  isAdmin: boolean;
  selectedCount: number;
  rowCount: number;
  recentArchives: RecentArchive[];
  onBulkDelete: () => void;
  onOpenAdd: () => void;
  onExportCSV: () => void;
  onSelectArchive: (id: string) => void;
}

const SummaryPanel = React.memo(function SummaryPanel({
  totalCount,
  statusCounts,
  duaExpiredCount,
  canWrite,
  isAdmin,
  selectedCount,
  rowCount,
  recentArchives,
  onBulkDelete,
  onOpenAdd,
  onExportCSV,
  onSelectArchive,
}: SummaryPanelProps) {
  return (
    <MuiBox flex={1} overflow="auto" sx={{ ...scrollBarSx }}>
      {/* En-tête */}
      <MuiBox px={2} py={1.5} borderBottom={1} borderColor="divider">
        <Typography variant="subtitle2" fontWeight={700}>Résumé</Typography>
      </MuiBox>

      {/* Stats rapides */}
      <MuiBox px={2} py={1.5}>
        {[
          { label: "Total", value: totalCount, color: "primary.main" },
          { label: "En attente", value: statusCounts.PENDING, color: "warning.main" },
          { label: "Actives", value: statusCounts.ACTIVE, color: "success.main" },
          { label: "Intermédiaires", value: statusCounts.SEMI_ACTIVE, color: "info.main" },
          { label: "Durée de conservation dépassées", value: duaExpiredCount, color: "error.main" },
        ].map(({ label, value, color }) => (
          <MuiBox key={label} display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
            <MuiBox display="flex" alignItems="center" gap={1}>
              <MuiBox sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color }} />
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </MuiBox>
            <Typography variant="caption" fontWeight="bold">{value}</Typography>
          </MuiBox>
        ))}
      </MuiBox>

      <Divider />

      {/* Suppression multiple — admin uniquement */}
      {isAdmin && selectedCount > 1 && (
        <MuiBox px={2} py={1.5}>
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            {selectedCount} archives sélectionnées
          </Typography>
          <Button
            variant="contained"
            size="small"
            color="error"
            fullWidth
            onClick={onBulkDelete}
            startIcon={<DeleteOutlineOutlinedIcon />}>
            Supprimer définitivement ({selectedCount})
          </Button>
        </MuiBox>
      )}

      {isAdmin && selectedCount > 1 && <Divider />}

      {/* Accès rapide */}
      <MuiBox px={2} py={1.5}>
        <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={0.5} fontWeight="bold" display="block" mb={1}>
          Actions rapides
        </Typography>
        <Stack spacing={0.75}>
          {canWrite && (
            <Button size="small" variant="outlined" fullWidth onClick={onOpenAdd} sx={{ justifyContent: "flex-start" }}>
              + Nouvelle archive
            </Button>
          )}
          <Button size="small" variant="outlined" fullWidth color="inherit" onClick={() => {
            document.getElementById("root")?.dispatchEvent(new CustomEvent("__global_search_open"));
          }} sx={{ justifyContent: "flex-start" }}>
            Rechercher (Ctrl+K)
          </Button>
          <Button size="small" variant="outlined" fullWidth color="inherit" onClick={onExportCSV} disabled={rowCount === 0} sx={{ justifyContent: "flex-start" }}>
            Exporter CSV ({rowCount})
          </Button>
        </Stack>
      </MuiBox>

      <Divider />

      {/* 5 dernières archives */}
      {recentArchives.length > 0 && (
        <MuiBox px={2} py={1.5}>
          <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={0.5} fontWeight="bold" display="block" mb={1}>
            Dernières archives
          </Typography>
          <List dense disablePadding>
            {recentArchives.slice(0, 5).map((r) => {
              const norm = normalizeStatus(r.status, r.validated);
              return (
                <ListItemButton
                  key={r.id}
                  onClick={() => onSelectArchive(r.id)}
                  sx={{ borderRadius: 1, py: 0.5, px: 0.5 }}>
                  <MuiBox sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: `${STATUS_COLOR[norm]}.main`, flexShrink: 0, mr: 0.75 }} />
                  <ListItemText
                    primary={r.designation ?? r.id}
                    primaryTypographyProps={{ variant: "caption", noWrap: true }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </MuiBox>
      )}
    </MuiBox>
  );
});

export default SummaryPanel;
