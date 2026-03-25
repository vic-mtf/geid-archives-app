/**
 * PvStatusChip — Chip colore affichant le statut d'un PV d'elimination.
 */

import { Chip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { PV_STATUS_COLOR, PV_STATUS_ICON, type PvStatus } from "./pvStatusConfig";

interface PvStatusChipProps {
  status: PvStatus;
  size?: "small" | "medium";
}

export default function PvStatusChip({ status, size = "small" }: PvStatusChipProps) {
  const { t } = useTranslation();
  return (
    <Chip
      icon={<>{PV_STATUS_ICON[status]}</>}
      label={t(`elimination.status.${status}`)}
      color={PV_STATUS_COLOR[status]}
      size={size}
      variant="outlined"
    />
  );
}
