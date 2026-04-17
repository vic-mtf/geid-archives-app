/**
 * columns.tsx — Definition des colonnes du DataGrid des archives.
 *
 * `buildArchiveColumns(statusFilter)` retourne les colonnes adaptees
 * au filtre courant :
 *   - Sur PENDING (archives en attente), pas de colonne "Conservation"
 *     ni "Statut" (toutes ont le meme statut).
 *   - Sinon, toutes les colonnes.
 */

import { Tooltip, Typography } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import StatusChip from "./StatusChip";
import DuaCell from "./DuaCell";
import timeAgo from "@/utils/timeAgo";
import formatDate from "@/utils/formatTime";
import type { StatusFilter } from "./statusNav";

const designationCol: GridColDef = {
  field: "designation",
  headerName: "Désignation",
  flex: 2,
  minWidth: 160,
};

const typeCol: GridColDef = {
  field: "type",
  headerName: "Type",
  width: 150,
};

const classNumberCol: GridColDef = {
  field: "classNumber",
  headerName: "N° class.",
  width: 110,
};

const refNumberCol: GridColDef = {
  field: "refNumber",
  headerName: "N° réf.",
  width: 110,
};

const statusCol: GridColDef = {
  field: "status",
  headerName: "Statut",
  width: 140,
  renderCell: (p) => (
    <StatusChip
      status={p.row.status as string}
      validated={p.row.validated as boolean}
    />
  ),
};

const duaCol: GridColDef = {
  field: "dua",
  headerName: "Conservation",
  width: 100,
  sortable: false,
  renderCell: (p) => <DuaCell row={p.row} />,
};

const dateCol: GridColDef = {
  field: "createdAt",
  headerName: "Date",
  width: 140,
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
};

/** Retourne les colonnes a afficher selon le filtre statut courant. */
export function buildArchiveColumns(
  statusFilter: StatusFilter,
): GridColDef[] {
  // Archives en attente : pas de colonne Conservation (pas encore de DUA)
  //                        ni Statut (tout est PENDING)
  if (statusFilter === "PENDING") {
    return [designationCol, typeCol, classNumberCol, refNumberCol, dateCol];
  }

  // Archive eliminee : pas de Conservation (cycle termine)
  if (statusFilter === "DESTROYED") {
    return [designationCol, typeCol, classNumberCol, refNumberCol, statusCol, dateCol];
  }

  // ALL / ACTIVE / SEMI_ACTIVE / PERMANENT / PROPOSED_ELIMINATION : colonnes completes
  return [
    designationCol,
    typeCol,
    classNumberCol,
    refNumberCol,
    statusCol,
    duaCol,
    dateCol,
  ];
}

/** Colonnes par defaut (compat ancien import direct). */
const archiveColumns = buildArchiveColumns("ALL");
export default archiveColumns;
