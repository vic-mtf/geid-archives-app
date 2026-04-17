/**
 * DuaCell — Cellule DUA dans le DataGrid des archives.
 *
 * Modele par phase :
 *   - ACTIVE : barre de progression de la phase active (10 ans par defaut)
 *   - SEMI_ACTIVE : barre de progression de la phase intermediaire (10 ans par defaut)
 *   - Autres : rien
 *
 * Chaque barre reflete le compte a rebours jusqu'a la transition automatique.
 */

import { Box, Chip, LinearProgress, Tooltip, Typography } from "@mui/material";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import { useTranslation } from "react-i18next";
import { normalizeStatus } from "@/constants/lifecycle";
import {
  resolveDua,
  phaseExpiresAt,
  phaseProgress,
  currentPhase,
  humanizeDurationShort,
} from "./duaDefaults";

interface DuaCellProps {
  row: Record<string, unknown>;
}

export default function DuaCell({ row }: DuaCellProps) {
  const { t } = useTranslation();
  const status = row.status as string | undefined;
  const norm = normalizeStatus(status, row.validated as boolean | undefined);
  const phase = currentPhase(status, norm);
  if (!phase) return null;

  const dua = resolveDua(row.dua);
  const target = dua[phase];
  const unitLabel =
    target.unit === "years"
      ? target.value === 1
        ? t("dua.yearsSingular")
        : t("dua.yearsPlural")
      : t("dua.monthsUnit");
  const sortLabel =
    dua.sortFinal === "conservation" ? "→ Hist." : "→ Elim.";
  const phaseLabel = phase === "active" ? "Active" : "Intermédiaire";
  const nextStageLabel =
    phase === "active"
      ? "Passage intermédiaire"
      : dua.sortFinal === "conservation"
        ? "Passage historique"
        : "Proposition élimination";

  // Phase non demarree (startDate absent) — affichage simple
  if (!target.startDate) {
    const compact = `${target.value}${target.unit === "years" ? "a" : "m"}`;
    return (
      <Tooltip title={`DUA ${phaseLabel.toLowerCase()} : ${target.value} ${unitLabel} ${sortLabel} (non démarrée)`}>
        <Chip
          icon={<AccessTimeOutlinedIcon sx={{ fontSize: 13 }} />}
          label={`${compact} ${sortLabel}`}
          size="small"
          variant="outlined"
          color={target.isDefault ? "default" : "info"}
          sx={{
            fontSize: 10,
            height: 20,
            "& .MuiChip-label": { px: 0.75 },
            opacity: 0.75,
          }}
        />
      </Tooltip>
    );
  }

  const expiresAt = phaseExpiresAt(target)!;
  const pct = phaseProgress(target);
  const now = new Date();
  const expired = now >= expiresAt;
  const daysLeft = Math.floor(
    (expiresAt.getTime() - now.getTime()) / 86_400_000,
  );
  const label = expired ? "Expirée" : humanizeDurationShort(daysLeft);

  const tooltip =
    `Phase ${phaseLabel.toLowerCase()} : ${target.value} ${unitLabel} ${sortLabel}\n` +
    `${expired ? "Expirée le " : "Expire le "}${expiresAt.toLocaleDateString("fr-FR")}\n` +
    `Prochaine étape : ${nextStageLabel}`;

  return (
    <Tooltip title={<span style={{ whiteSpace: "pre-line" }}>{tooltip}</span>}>
      <Box sx={{ width: { xs: 80, sm: 100 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="baseline">
          <Typography
            variant="caption"
            color={expired ? "error" : "text.secondary"}
            sx={{ fontSize: 10, fontWeight: 600 }}
          >
            {label}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: 9 }}>
            {phase === "active" ? "act." : "int."}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={pct}
          color={pct > 90 || expired ? "error" : pct > 70 ? "warning" : "info"}
          sx={{ height: 4, borderRadius: 2 }}
        />
        <Typography variant="caption" color="text.disabled" sx={{ fontSize: 9, display: "block", textAlign: "right" }}>
          {sortLabel}
        </Typography>
      </Box>
    </Tooltip>
  );
}
