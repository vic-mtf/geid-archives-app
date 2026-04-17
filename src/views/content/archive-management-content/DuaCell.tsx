/**
 * DuaCell — Cellule DUA dans le DataGrid des archives.
 *
 * - ACTIVE : affiche la duree prevue (valeur + sort final), pas de compte a rebours.
 * - SEMI_ACTIVE : affiche la barre de progression avec le temps restant.
 * - Autres statuts : rien.
 *
 * Utilise resolveDua() pour retomber sur les defauts 10 ans / conservation
 * si la DB ne contient pas encore les champs (synchro avec le backend).
 */

import { Box, Chip, LinearProgress, Tooltip, Typography } from "@mui/material";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import { useTranslation } from "react-i18next";
import { normalizeStatus } from "@/constants/lifecycle";
import { computeExpiresAt } from "./helpers";
import { resolveDua } from "./duaDefaults";

interface DuaCellProps {
  row: Record<string, unknown>;
}

export default function DuaCell({ row }: DuaCellProps) {
  const { t } = useTranslation();
  const status = row.status as string | undefined;
  const norm = normalizeStatus(status, row.validated as boolean | undefined);

  if (norm !== "ACTIVE" && norm !== "SEMI_ACTIVE") return null;

  const dua = resolveDua(row.dua);
  const unitLabel =
    dua.unit === "years"
      ? dua.value === 1
        ? t("dua.yearsSingular")
        : t("dua.yearsPlural")
      : t("dua.monthsUnit");
  const sortLabel =
    dua.sortFinal === "conservation" ? "→ Hist." : "→ Elim.";

  // ── ACTIVE : valeur prevue, pas de barre ─────────────────
  if (norm === "ACTIVE") {
    const compact = `${dua.value}${dua.unit === "years" ? "a" : "m"}`;
    const tooltip = dua.isDefault
      ? `DUA par défaut : ${dua.value} ${unitLabel} ${sortLabel} (modifiable — commence au passage en intermédiaire)`
      : `DUA prévue : ${dua.value} ${unitLabel} ${sortLabel} (commence au passage en intermédiaire)`;
    return (
      <Tooltip title={tooltip}>
        <Chip
          icon={<AccessTimeOutlinedIcon sx={{ fontSize: 13 }} />}
          label={`${compact} ${sortLabel}`}
          size="small"
          variant="outlined"
          color={dua.isDefault ? "default" : "info"}
          sx={{
            fontSize: 10,
            height: 20,
            "& .MuiChip-label": { px: 0.75 },
            opacity: dua.isDefault ? 0.8 : 1,
          }}
        />
      </Tooltip>
    );
  }

  // ── SEMI_ACTIVE : barre de progression ───────────────────
  if (!dua.startDate) {
    return (
      <Tooltip title="Durée de conservation non démarrée">
        <Chip
          icon={<AccessTimeOutlinedIcon />}
          label="Non démarrée"
          size="small"
          color="warning"
          variant="outlined"
          sx={{ fontSize: 11 }}
        />
      </Tooltip>
    );
  }

  const start = new Date(dua.startDate);
  const expiresAt = computeExpiresAt(start, dua.value, dua.unit);
  const now = new Date();
  const pct = Math.min(
    100,
    Math.max(
      0,
      ((now.getTime() - start.getTime()) /
        (expiresAt.getTime() - start.getTime())) *
        100,
    ),
  );
  const expired = now >= expiresAt;
  const daysLeft = Math.floor(
    (expiresAt.getTime() - now.getTime()) / 86_400_000,
  );

  const label = expired
    ? "Expirée"
    : daysLeft < 30
      ? `${daysLeft}j`
      : daysLeft < 365
        ? `${Math.floor(daysLeft / 30)}m`
        : `${Math.floor(daysLeft / 365)}a`;

  return (
    <Tooltip
      title={`DUA : ${dua.value} ${unitLabel} ${sortLabel} — Expire le ${expiresAt.toLocaleDateString("fr-FR")}`}
    >
      <Box sx={{ width: { xs: 70, sm: 90 } }}>
        <Box display="flex" justifyContent="space-between">
          <Typography
            variant="caption"
            color={expired ? "error" : "text.secondary"}
            sx={{ fontSize: 10 }}
          >
            {label}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
            {sortLabel}
          </Typography>
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
