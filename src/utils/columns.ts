import type { ColumnDef } from "../types";

const columns: ColumnDef[] = [
  { field: "id", width: 50, type: "actions" },
  { field: "createdAt", headerName: "Date de création", type: "date", width: 175 },
  { field: "designation", headerName: "Designation", width: 175 },
  { field: "origin", headerName: "Provenance", width: 175 },
  { field: "destination", headerName: "Destination", width: 175 },
  { field: "secrete", headerName: "Confidentialite", width: 175, hide: true },
  { field: "urgence", headerName: "Urgence", width: 175, hide: true },
  { headerName: "Numero de classement", field: "classNum", width: 175, hide: true },
  { headerName: "Numero de référence", field: "refNum", width: 175, hide: true },
  { headerName: "Numero d'entree dans le service Disposition", field: "numServiceDis", width: 175, hide: true },
  { field: "code", headerName: "Code", width: 175, hide: true },
  { field: "type", headerName: "Type", width: 175, hide: true },
  { field: "subType", headerName: "Sous type", width: 175, hide: true },
  { field: "object", headerName: "Objet", width: 175, hide: true },
  { field: "description", headerName: "Description", width: 175, hide: true },
  { field: "status", headerName: "Statut", width: 175, hide: true },
  { field: "actions", type: "actions", width: 50, hide: true },
];

export default columns;
