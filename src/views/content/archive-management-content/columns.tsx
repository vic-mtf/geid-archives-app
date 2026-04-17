/**
 * columns.tsx — Définition des colonnes du DataGrid des archives.
 *
 * Chaque colonne est configurée avec sa largeur, son rendu
 * personnalisé (StatusChip, DuaCell) et ses options de tri/filtre.
 */

import { Tooltip, Typography } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import StatusChip from "./StatusChip";
import DuaCell from "./DuaCell";
import timeAgo from "@/utils/timeAgo";
import formatDate from "@/utils/formatTime";

/** Colonnes affichées dans le tableau des archives numériques */
const archiveColumns: GridColDef[] = [
  {
    field: "designation",
    headerName: "Désignation",
    flex: 2,
    minWidth: 160,
  },
  {
    field: "type",
    headerName: "Type",
    width: 150,
  },
  {
    field: "classNumber",
    headerName: "N° class.",
    width: 110,
  },
  {
    field: "refNumber",
    headerName: "N° réf.",
    width: 110,
  },
  {
    field: "status",
    headerName: "Statut",
    width: 140,
    renderCell: (p) => (
      <StatusChip
        status={p.row.status as string}
        validated={p.row.validated as boolean}
      />
    ),
  },
  {
    field: "dua",
    headerName: "Conservation",
    width: 100,
    sortable: false,
    renderCell: (p) => <DuaCell row={p.row} />,
  },
  {
    field: "createdAt",
    headerName: "Date",
    width: 140,
    // tri par Date reel (pas par le texte affiche)
    valueGetter: (value: string | undefined) =>
      value ? new Date(value) : null,
    renderCell: (p) => {
      const raw = p.row.createdAt as string | undefined;
      if (!raw) return "—";
      return (
        <Tooltip title={formatDate(raw)}>
          <Typography variant="body2" color="text.secondary">
            {timeAgo(raw)}
          </Typography>
        </Tooltip>
      );
    },
  },
];

export default archiveColumns;
