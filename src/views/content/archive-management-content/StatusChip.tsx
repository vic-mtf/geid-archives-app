/**
 * StatusChip — Chip coloré affichant le statut d'une archive.
 *
 * Résout le statut brut (y compris les anciens noms legacy)
 * et affiche le label français avec la couleur MUI correspondante.
 */

import { Chip } from "@mui/material";
import { STATUS_LABEL, STATUS_COLOR } from "@/constants/lifecycle";

interface StatusChipProps {
  /** Le statut brut de l'archive (PENDING, validated, actif, etc.) */
  status?: string;
  /** Si l'archive est validée (fallback quand status est absent) */
  validated?: boolean;
  /** Taille du Chip MUI */
  size?: "small" | "medium";
}

export default function StatusChip({ status, validated, size = "small" }: StatusChipProps) {
  const resolved = status ?? (validated ? "ACTIVE" : "PENDING");
  return (
    <Chip
      label={STATUS_LABEL[resolved] ?? resolved}
      color={STATUS_COLOR[resolved] ?? "default"}
      size={size}
      variant="outlined"
    />
  );
}
