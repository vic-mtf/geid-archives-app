/**
 * MobileFilterChips — Chips de filtre horizontaux pour mobile (xs/sm).
 *
 * Affiche les statuts et filtres rapides sous forme de chips scrollables.
 */

import React from "react";
import { Box as MuiBox, Chip } from "@mui/material";
import scrollBarSx from "@/utils/scrollBarSx";
import type { NormalizedStatus } from "@/constants/lifecycle";

type StatusFilter = "ALL" | NormalizedStatus;

interface StatusNavItem {
  key: StatusFilter;
  label: string;
}

interface MobileFilterChipsProps {
  statusNav: StatusNavItem[];
  statusFilter: StatusFilter;
  quickFilter: "dua_expired" | "this_month" | null;
  totalCount: number;
  statusCounts: Record<NormalizedStatus, number>;
  duaExpiredCount: number;
  onStatusFilter: (key: StatusFilter) => void;
  onQuickFilter: (key: "dua_expired" | null) => void;
}

const MobileFilterChips = React.memo(function MobileFilterChips({
  statusNav,
  statusFilter,
  quickFilter,
  totalCount,
  statusCounts,
  duaExpiredCount,
  onStatusFilter,
  onQuickFilter,
}: MobileFilterChipsProps) {
  return (
    <MuiBox
      sx={{
        display: { xs: "flex", md: "none" },
        gap: 0.75,
        px: 1.5,
        py: 0.75,
        overflow: "auto",
        flexShrink: 0,
        borderBottom: 1,
        borderColor: "divider",
        ...scrollBarSx,
      }}
    >
      {statusNav.map(({ key, label }) => {
        const count  = key === "ALL" ? totalCount : statusCounts[key] ?? 0;
        const active = statusFilter === key && quickFilter === null;
        return (
          <Chip
            key={key}
            label={count > 0 ? `${label} (${count})` : label}
            size="small"
            variant={active ? "filled" : "outlined"}
            color={key === "PENDING" ? "warning" : active ? "primary" : "default"}
            onClick={() => onStatusFilter(key)}
            sx={{ flexShrink: 0, cursor: "pointer" }}
          />
        );
      })}
      {duaExpiredCount > 0 && (
        <Chip
          label={`Conservation exp. (${duaExpiredCount})`}
          size="small"
          variant={quickFilter === "dua_expired" ? "filled" : "outlined"}
          color="error"
          onClick={() => onQuickFilter(quickFilter === "dua_expired" ? null : "dua_expired")}
          sx={{ flexShrink: 0, cursor: "pointer" }}
        />
      )}
    </MuiBox>
  );
});

export default MobileFilterChips;
