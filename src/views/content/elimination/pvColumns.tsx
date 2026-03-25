/**
 * pvColumns.tsx — Colonnes DataGrid pour la liste des PV d'elimination.
 */

import { GridColDef } from "@mui/x-data-grid";
import { Chip } from "@mui/material";
import PvStatusChip from "./PvStatusChip";
import type { PvStatus } from "./pvStatusConfig";

const pvColumns: GridColDef[] = [
  {
    field: "pvNumber",
    headerName: "N° PV",
    flex: 1,
    minWidth: 160,
  },
  {
    field: "status",
    headerName: "Statut",
    width: 200,
    renderCell: (params) => <PvStatusChip status={params.value as PvStatus} />,
  },
  {
    field: "administrativeUnit",
    headerName: "Unité",
    width: 140,
    renderCell: (params) => params.value || "—",
  },
  {
    field: "motif",
    headerName: "Motif",
    flex: 2,
    minWidth: 180,
    renderCell: (params) => (
      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {params.value as string}
      </span>
    ),
  },
  {
    field: "archiveCount",
    headerName: "Archives",
    width: 90,
    align: "center",
    headerAlign: "center",
    renderCell: (params) => (
      <Chip
        label={(params.row.archives as unknown[])?.length ?? 0}
        size="small"
        sx={{ height: 20, fontSize: 11 }}
      />
    ),
    sortable: false,
  },
  {
    field: "createdAt",
    headerName: "Date",
    width: 110,
    renderCell: (params) =>
      params.value
        ? new Date(params.value as string).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "—",
  },
];

export default pvColumns;
