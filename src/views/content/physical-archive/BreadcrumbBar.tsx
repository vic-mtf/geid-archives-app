import React from "react";
import { Box, Typography } from "@mui/material";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import type { PhysicalLevel } from "@/constants/physical";
import PhysicalSearch from "./PhysicalSearch";

export interface BreadcrumbItem {
  id: string;
  label: string;
  level: PhysicalLevel;
}

interface BreadcrumbBarProps {
  breadcrumb: BreadcrumbItem[];
  headers: Record<string, string>;
  onBreadcrumbClick: (index: number) => void;
  onNavigateFromSearch: (path: Array<{ id: string; label: string; level: string }>) => void;
}

const BreadcrumbBar = React.memo(function BreadcrumbBar({ breadcrumb, headers, onBreadcrumbClick, onNavigateFromSearch }: BreadcrumbBarProps) {
  return (
    <Box
      px={{ xs: 1, sm: 2 }}
      py={0.75}
      display="flex"
      alignItems="center"
      gap={0.5}
      flexWrap="wrap"
      borderBottom={1}
      borderColor="divider"
      bgcolor="background.paper"
      minHeight={{ xs: 36, sm: 44 }}>
      <Typography
        sx={{ cursor: "pointer", fontWeight: breadcrumb.length === 0 ? "bold" : "normal", "&:hover": { textDecoration: "underline" }, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
        color={breadcrumb.length === 0 ? "text.primary" : "text.secondary"}
        onClick={() => onBreadcrumbClick(0)}>
        Archivage physique
      </Typography>
      {breadcrumb.map((b, i) => (
        <React.Fragment key={b.id}>
          <NavigateNextRoundedIcon sx={{ fontSize: { xs: 14, sm: 18 }, color: "text.disabled" }} />
          <Typography
            sx={{ cursor: "pointer", fontWeight: i === breadcrumb.length - 1 ? "bold" : "normal", "&:hover": { textDecoration: "underline" }, fontSize: { xs: "0.75rem", sm: "0.875rem" }, maxWidth: { xs: 100, sm: 200 }, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            color={i === breadcrumb.length - 1 ? "text.primary" : "text.secondary"}
            onClick={() => onBreadcrumbClick(i + 1)}>
            {b.label}
          </Typography>
        </React.Fragment>
      ))}
      <Box flex={1} />
      <Box sx={{ width: { xs: 150, sm: 220, md: 280 } }}>
        <PhysicalSearch headers={headers} onNavigate={onNavigateFromSearch} />
      </Box>
    </Box>
  );
});

export default BreadcrumbBar;
