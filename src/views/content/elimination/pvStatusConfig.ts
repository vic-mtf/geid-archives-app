/**
 * pvStatusConfig.ts — Types, labels, couleurs et icones des statuts PV d'elimination.
 */

import React from "react";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";

export type PvStatus =
  | "DRAFT"
  | "PENDING_PRODUCER"
  | "PENDING_DANTIC"
  | "APPROVED"
  | "REJECTED"
  | "EXECUTED";

export const PV_STATUSES: PvStatus[] = [
  "DRAFT",
  "PENDING_PRODUCER",
  "PENDING_DANTIC",
  "APPROVED",
  "REJECTED",
  "EXECUTED",
];

export const PV_STATUS_COLOR: Record<PvStatus, "default" | "warning" | "info" | "success" | "error" | "secondary"> = {
  DRAFT: "default",
  PENDING_PRODUCER: "warning",
  PENDING_DANTIC: "info",
  APPROVED: "success",
  REJECTED: "error",
  EXECUTED: "secondary",
};

export const PV_STATUS_ICON: Record<PvStatus, React.ReactNode> = {
  DRAFT: React.createElement(EditNoteRoundedIcon, { fontSize: "small" }),
  PENDING_PRODUCER: React.createElement(HourglassTopRoundedIcon, { fontSize: "small" }),
  PENDING_DANTIC: React.createElement(VerifiedUserRoundedIcon, { fontSize: "small" }),
  APPROVED: React.createElement(CheckCircleOutlineIcon, { fontSize: "small" }),
  REJECTED: React.createElement(CancelOutlinedIcon, { fontSize: "small" }),
  EXECUTED: React.createElement(GavelRoundedIcon, { fontSize: "small" }),
};
