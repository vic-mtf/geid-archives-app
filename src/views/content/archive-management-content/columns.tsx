/**
 * columns.tsx — Définition des colonnes du DataGrid des archives.
 *
 * Chaque colonne est configurée avec sa largeur, son rendu
 * personnalisé (StatusChip, DuaCell) et ses options de tri/filtre.
 */

import { GridColDef } from "@mui/x-data-grid";
import StatusChip from "./StatusChip";
import DuaCell    from "./DuaCell";

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
      <StatusChip status={p.row.status as string} validated={p.row.validated as boolean} />
    ),
  },
  {
    field: "dua",
    headerName: "DUA",
    width: 100,
    sortable: false,
    renderCell: (p) => <DuaCell row={p.row} />,
  },
  {
    field: "createdAt",
    headerName: "Date",
    type: "dateTime",
    width: 150,
  },
];

export default archiveColumns;
