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
import type { NormalizedStatus } from "@/constants/lifecycle";

export type StatusFilter = "ALL" | NormalizedStatus;

export interface StatusNavItem {
  key: StatusFilter;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const STATUS_NAV: StatusNavItem[] = [
  { key: "ALL",         label: "Toutes",         icon: <AllInboxRoundedIcon fontSize="small" />,          color: "text.primary"    },
  { key: "PENDING",     label: "En attente",     icon: <PendingActionsRoundedIcon fontSize="small" />,    color: "warning.main"    },
  { key: "ACTIVE",      label: "Actifs",         icon: <CheckCircleOutlineRoundedIcon fontSize="small" />,color: "success.main"    },
  { key: "SEMI_ACTIVE", label: "Intermédiaires", icon: <ArchiveRoundedIcon fontSize="small" />,           color: "info.main"       },
  { key: "PERMANENT",   label: "Historique",     icon: <MenuBookRoundedIcon fontSize="small" />,          color: "secondary.main"  },
  { key: "DESTROYED",   label: "Détruits",       icon: <DeleteSweepRoundedIcon fontSize="small" />,       color: "error.main"      },
];

export default STATUS_NAV;
