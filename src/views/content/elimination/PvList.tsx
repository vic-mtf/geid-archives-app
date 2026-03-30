/**
 * PvList — DataGrid des PV d'élimination avec recherche rapide.
 */

import { DataGrid, GridColDef, GridRowParams, GridToolbarQuickFilter } from "@mui/x-data-grid";
import { frFR } from "@mui/x-data-grid/locales";
import { Box, Stack, Typography } from "@mui/material";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import { useTranslation } from "react-i18next";
import scrollBarSx from "@/utils/scrollBarSx";

export interface PvRow {
  id: string;
  _id: string;
  pvNumber: string;
  status: string;
  motif: string;
  archives: unknown[];
  administrativeUnit?: string;
  createdAt?: string;
  [key: string]: unknown;
}

interface PvListProps {
  rows: PvRow[];
  columns: GridColDef[];
  loading: boolean;
  focusedId: string | null;
  onRowClick: (params: GridRowParams) => void;
}

function Toolbar() {
  return (
    <Box px={1.5} py={1} sx={{ borderBottom: 1, borderColor: "divider" }}>
      <GridToolbarQuickFilter
        placeholder="Rechercher…"
        variant="outlined"
        size="small"
        sx={{ width: "100%", maxWidth: 320 }}
      />
    </Box>
  );
}

function NoRows() {
  const { t } = useTranslation();
  return (
    <Stack alignItems="center" justifyContent="center" height="100%" spacing={1} p={4}>
      <GavelOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
      <Typography variant="body2" color="text.secondary" textAlign="center">
        {t("elimination.noPvs")}
      </Typography>
    </Stack>
  );
}

export default function PvList({ rows, columns, loading, focusedId, onRowClick }: PvListProps) {
  return (
    <Box flex={1} position="relative" overflow="hidden" minHeight={0}>
      <Box position="absolute" top={0} left={0} right={0} bottom={0}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          onRowClick={onRowClick}
          density="compact"
          disableRowSelectionOnClick
          disableColumnFilter
          pageSizeOptions={[25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          getRowClassName={(params) => params.id === focusedId ? "Mui-selected" : ""}
          slots={{ toolbar: Toolbar, noRowsOverlay: NoRows }}
          sx={{
            border: "none",
            "& .MuiDataGrid-cell": { outline: "none", border: "none" },
            "& .MuiDataGrid-cell:focus": { outline: "none" },
            "& .MuiDataGrid-row": { cursor: "pointer" },
            "& *": scrollBarSx as Record<string, unknown>,
          }}
          localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
        />
      </Box>
    </Box>
  );
}
