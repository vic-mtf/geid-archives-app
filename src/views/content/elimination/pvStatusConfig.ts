/**
 * pvStatusConfig.ts — Types, labels, couleurs et icones des statuts PV d'elimination.
 */

import React from "react";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import HourglassTopOutlinedIcon from "@mui/icons-material/HourglassTopOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";

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
  DRAFT: React.createElement(EditNoteOutlinedIcon, { fontSize: "small" }),
  PENDING_PRODUCER: React.createElement(HourglassTopOutlinedIcon, { fontSize: "small" }),
  PENDING_DANTIC: React.createElement(VerifiedUserOutlinedIcon, { fontSize: "small" }),
  APPROVED: React.createElement(CheckCircleOutlineIcon, { fontSize: "small" }),
  REJECTED: React.createElement(CancelOutlinedIcon, { fontSize: "small" }),
  EXECUTED: React.createElement(GavelOutlinedIcon, { fontSize: "small" }),
};
