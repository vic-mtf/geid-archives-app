/**
 * DuaCell — Cellule DUA dans le DataGrid des archives.
 *
 * Affiche une barre de progression miniature avec le temps restant
 * avant l'expiration de la DUA. Visible uniquement pour les archives
 * en statut SEMI_ACTIVE.
 */

import { Box, Chip, LinearProgress, Tooltip, Typography } from "@mui/material";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import { normalizeStatus } from "@/constants/lifecycle";
import { computeExpiresAt } from "./helpers";

interface DuaCellProps {
  /** La ligne du DataGrid (typé Record<string, unknown>) */
  row: Record<string, unknown>;
}

export default function DuaCell({ row }: DuaCellProps) {
  const status = row.status as string | undefined;
  const dua    = row.dua as { value?: number; unit?: string; sortFinal?: string; startDate?: string } | undefined;
  const norm   = normalizeStatus(status, row.validated as boolean | undefined);

  // La DUA ne s'affiche que pour les archives intermédiaires
  if (norm !== "SEMI_ACTIVE") return null;

  // Durée de conservation non définie — afficher un avertissement
  if (!dua?.value || !dua?.unit || !dua?.startDate) {
    return (
      <Tooltip title="Durée de conservation non définie">
        <Chip
          icon={<AccessTimeOutlinedIcon />}
          label="Non définie"
          size="small"
          color="warning"
          variant="outlined"
          sx={{ fontSize: 11 }}
        />
      </Tooltip>
    );
  }

  // Calcul de la progression
  const start     = new Date(dua.startDate);
  const expiresAt = computeExpiresAt(start, dua.value, dua.unit);
  const now       = new Date();
  const pct       = Math.min(100, Math.max(0, ((now.getTime() - start.getTime()) / (expiresAt.getTime() - start.getTime())) * 100));
  const expired   = now >= expiresAt;
  const daysLeft  = Math.floor((expiresAt.getTime() - now.getTime()) / 86_400_000);

  // Label compact : "Expirée", "12j", "3m", "2a"
  const label = expired ? "Expirée"
    : daysLeft < 30  ? `${daysLeft}j`
    : daysLeft < 365 ? `${Math.floor(daysLeft / 30)}m`
    : `${Math.floor(daysLeft / 365)}a`;

  const sortLabel = dua.sortFinal === "conservation" ? "→ Hist." : "→ Elim.";

  return (
    <Tooltip title={`DUA : ${dua.value} ${dua.unit === "years" ? "an(s)" : "mois"} ${sortLabel} — Expire le ${expiresAt.toLocaleDateString("fr-FR")}`}>
      <Box sx={{ width: { xs: 70, sm: 90 } }}>
        <Box display="flex" justifyContent="space-between">
          <Typography variant="caption" color={expired ? "error" : "text.secondary"} sx={{ fontSize: 10 }}>
            {label}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>{sortLabel}</Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={pct}
          color={pct > 90 || expired ? "error" : pct > 70 ? "warning" : "info"}
          sx={{ height: 4, borderRadius: 2 }}
        />
      </Box>
    </Tooltip>
  );
}
