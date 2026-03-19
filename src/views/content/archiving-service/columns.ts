import { GridColDef } from "@mui/x-data-grid";
import { createElement } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";

const openValidateForm = (id: string) => {
  const event = new CustomEvent("__validate_archive_doc", {
    detail: { doc: id, name: "__validate_archive_doc" },
  });
  document.getElementById("root")?.dispatchEvent(event);
};

const columns: GridColDef[] = [
  {
    field: "designation",
    headerName: "Désignation",
    flex: 1,
    minWidth: 220,
  },
  {
    field: "type",
    headerName: "Type de document",
    width: 180,
  },
  {
    field: "classNumber",
    headerName: "N° classement",
    width: 150,
  },
  {
    field: "refNumber",
    headerName: "N° référence",
    width: 150,
  },
  {
    field: "description",
    headerName: "Description",
    width: 280,
  },
  {
    field: "validated",
    headerName: "Statut",
    width: 130,
    renderCell: (params) =>
      createElement(Chip, {
        label: params.value ? "Validé" : "En attente",
        color: (params.value ? "success" : "warning") as "success" | "warning",
        size: "small",
        variant: "outlined",
      }),
  },
  {
    field: "createdAt",
    headerName: "Date",
    type: "dateTime",
    width: 160,
  },
  {
    field: "__validate__",
    headerName: "",
    width: 100,
    sortable: false,
    filterable: false,
    renderCell: (params) =>
      createElement(Button, {
        size: "small",
        variant: "outlined",
        color: "primary",
        onClick: (e: ReactMouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          openValidateForm(params.row._id as string);
        },
        children: "Valider",
      }),
  },
];

export default columns;
