/**
 * statusNav — Définition des filtres de navigation par statut.
 *
 * Utilisé par ArchiveManagementContent, ArchiveSidebar et MobileFilterChips.
 */

import React from "react";
import AllInboxOutlinedIcon           from "@mui/icons-material/AllInboxOutlined";
import PendingActionsOutlinedIcon     from "@mui/icons-material/PendingActionsOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ArchiveOutlinedIcon            from "@mui/icons-material/ArchiveOutlined";
import MenuBookOutlinedIcon           from "@mui/icons-material/MenuBookOutlined";
import DeleteSweepOutlinedIcon        from "@mui/icons-material/DeleteSweepOutlined";
import GavelOutlinedIcon              from "@mui/icons-material/GavelOutlined";
import i18n from "@/i18n/i18n";
import type { NormalizedStatus } from "@/constants/lifecycle";

export type StatusFilter = "ALL" | NormalizedStatus;

export interface StatusNavItem {
  key: StatusFilter;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const STATUS_NAV_CONFIG: { key: StatusFilter; labelKey: string; icon: React.ReactNode; color: string }[] = [
  { key: "ALL",         labelKey: "status.ALL",              icon: <AllInboxOutlinedIcon fontSize="small" />,           color: "text.primary"   },
  { key: "PENDING",     labelKey: "status.pendingPlural",    icon: <PendingActionsOutlinedIcon fontSize="small" />,     color: "warning.main"   },
  { key: "ACTIVE",      labelKey: "status.activePlural",     icon: <CheckCircleOutlineOutlinedIcon fontSize="small" />, color: "success.main"   },
  { key: "SEMI_ACTIVE", labelKey: "status.semiActivePlural", icon: <ArchiveOutlinedIcon fontSize="small" />,            color: "info.main"      },
  { key: "PERMANENT",   labelKey: "status.permanentSingular",icon: <MenuBookOutlinedIcon fontSize="small" />,           color: "secondary.main" },
  { key: "PROPOSED_ELIMINATION", labelKey: "status.proposedEliminationPlural", icon: <GavelOutlinedIcon fontSize="small" />, color: "#c62828" },
  { key: "DESTROYED",   labelKey: "status.destroyedPlural",  icon: <DeleteSweepOutlinedIcon fontSize="small" />,        color: "error.main"     },
];

/** Retourne les items avec les labels traduits dynamiquement */
export function getStatusNav(): StatusNavItem[] {
  return STATUS_NAV_CONFIG.map((item) => ({
    key: item.key,
    label: i18n.t(item.labelKey),
    icon: item.icon,
    color: item.color,
  }));
}

export default getStatusNav;
