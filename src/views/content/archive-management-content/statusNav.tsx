/**
 * statusNav — Définition des filtres de navigation par statut.
 *
 * Utilisé par ArchiveManagementContent, ArchiveSidebar et MobileFilterChips.
 */

import React from "react";
import AllInboxRoundedIcon           from "@mui/icons-material/AllInboxRounded";
import PendingActionsRoundedIcon     from "@mui/icons-material/PendingActionsRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ArchiveRoundedIcon            from "@mui/icons-material/ArchiveRounded";
import MenuBookRoundedIcon           from "@mui/icons-material/MenuBookRounded";
import DeleteSweepRoundedIcon        from "@mui/icons-material/DeleteSweepRounded";
import GavelRoundedIcon              from "@mui/icons-material/GavelRounded";
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
  { key: "ALL",         labelKey: "status.ALL",              icon: <AllInboxRoundedIcon fontSize="small" />,           color: "text.primary"   },
  { key: "PENDING",     labelKey: "status.pendingPlural",    icon: <PendingActionsRoundedIcon fontSize="small" />,     color: "warning.main"   },
  { key: "ACTIVE",      labelKey: "status.activePlural",     icon: <CheckCircleOutlineRoundedIcon fontSize="small" />, color: "success.main"   },
  { key: "SEMI_ACTIVE", labelKey: "status.semiActivePlural", icon: <ArchiveRoundedIcon fontSize="small" />,            color: "info.main"      },
  { key: "PERMANENT",   labelKey: "status.permanentSingular",icon: <MenuBookRoundedIcon fontSize="small" />,           color: "secondary.main" },
  { key: "PROPOSED_ELIMINATION", labelKey: "status.proposedEliminationPlural", icon: <GavelRoundedIcon fontSize="small" />, color: "#c62828" },
  { key: "DESTROYED",   labelKey: "status.destroyedPlural",  icon: <DeleteSweepRoundedIcon fontSize="small" />,        color: "error.main"     },
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
