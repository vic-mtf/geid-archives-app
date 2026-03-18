import { Stack } from "@mui/material";
import DataGrid from "./data-grid/DataGrid";
import columns from "./data-grid/columns/columns";
import { useRef } from "react";

interface RowData {
  id: number;
  createdAt: string;
  [key: string]: unknown;
}

export default function AppTest() {
  const rows = useRef<RowData[]>([{"id":0,"createdAt":"Sun Jan 09 1972 21:24:53 GMT+0100 (heure normale d'Afrique de l'Ouest)"},{"id":1,"createdAt":"Tue Mar 30 1971 16:06:15 GMT+0100 (heure normale d'Afrique de l'Ouest)"},{"id":2,"createdAt":"Mon Jun 21 1971 10:47:15 GMT+0100 (heure normale d'Afrique de l'Ouest)"},{"id":3,"createdAt":"Sun Jul 26 1970 19:40:48 GMT+0100 (heure normale d'Afrique de l'Ouest)"},{"id":4,"createdAt":"Mon Jan 26 1970 12:17:59 GMT+0100 (heure normale d'Afrique de l'Ouest)"},{"id":5,"createdAt":"Wed Oct 21 1970 00:46:47 GMT+0100 (heure normale d'Afrique de l'Ouest)"},{"id":6,"createdAt":"Tue Feb 22 1972 18:03:56 GMT+0100 (heure normale d'Afrique de l'Ouest)"},{"id":7,"createdAt":"Thu Feb 24 1972 04:26:32 GMT+0100 (heure normale d'Afrique de l'Ouest)"},{"id":8,"createdAt":"Wed Mar 11 1970 22:41:07 GMT+0100 (heure normale d'Afrique de l'Ouest)"},{"id":9,"createdAt":"Sat May 09 1970 12:37:08 GMT+0100 (heure normale d'Afrique de l'Ouest)"}]);

  return (
    <Stack
      display="flex"
      sx={{ width: 500 }}
    >
      <DataGrid
        columns={columns}
        checkbox
        rows={rows.current}
      />
    </Stack>
  );
}
