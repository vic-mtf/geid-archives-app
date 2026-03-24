/**
 * StatCard — Carte statistique réutilisable du tableau de bord.
 */

import React from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

export interface StatCardProps {
  label: string;
  value: number;
  loading: boolean;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  highlight?: boolean;
}

const StatCard = React.memo(function StatCard({
  label,
  value,
  loading,
  icon,
  color,
  onClick,
  highlight,
}: StatCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: highlight ? "warning.main" : undefined,
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: 3 },
      }}>
      <CardActionArea onClick={onClick}>
        <CardContent sx={{ pb: "12px !important" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.75}>
            <Typography variant="caption" color="text.secondary" noWrap>
              {label}
            </Typography>
            <Box sx={{ color }}>{icon}</Box>
          </Stack>
          <Typography variant="h5" fontWeight="bold" color={color} sx={{ minHeight: 32, display: "flex", alignItems: "center" }}>
            {loading ? <Skeleton width={48} height={32} /> : value}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
});

export default StatCard;

export function EmptyPlaceholder({ label }: { label: string }) {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" p={3}>
      <Typography color="text.secondary" variant="body2">{label}</Typography>
    </Box>
  );
}
