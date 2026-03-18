import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import { TableVirtuoso } from "react-virtuoso";

interface Column {
  label: string;
  dataKey: string;
  maxWidth?: number;
  width?: number;
  numeric?: boolean;
  type?: string;
}

interface DataRow {
  folder?: boolean;
  [key: string]: unknown;
}

const columns: Column[] = [
  {
    label: "Designation",
    dataKey: "designation",
    maxWidth: 400,
  },
  // {
  //   label: "Type",
  //   dataKey: "type",
  // },
  {
    label: "Date",
    dataKey: "createdAt",
    type: "date",
  },
  {
    label: "Numéro de classement",
    dataKey: "classNumber",
  },
  {
    label: "Numéro de Reference",
    dataKey: "refNumber",
  },
];

const Scroller = (props: React.HTMLAttributes<HTMLDivElement>, ref: React.Ref<HTMLDivElement>) => (
  <TableContainer component='div' {...props} ref={ref} />
);
const CustomTableRow = (props: React.HTMLAttributes<HTMLTableRowElement>) => <TableRow hover {...props} />;
const CustomTableBody = (props: React.HTMLAttributes<HTMLTableSectionElement>, ref: React.Ref<HTMLTableSectionElement>) => <TableBody {...props} ref={ref} />;

const VirtuosoTableComponents = {
  Scroller: React.forwardRef(Scroller),
  Table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <Table
      {...props}
      sx={{ borderCollapse: "separate", tableLayout: "fixed" }}
    />
  ),
  TableHead,
  TableRow: CustomTableRow,
  TableBody: React.forwardRef(CustomTableBody),
};

function fixedHeaderContent() {
  return (
    <TableRow>
      {columns.map((column) => (
        <TableCell
          key={column.dataKey}
          variant='head'
          align={column.numeric || false ? "right" : "left"}
          style={{ width: column.width }}
          sx={{
            backgroundColor: "background.paper",
          }}>
          {column.label}
        </TableCell>
      ))}
    </TableRow>
  );
}

function rowContent(_index: number, row: DataRow) {
  const icon = row.folder ? FolderRoundedIcon : InsertDriveFileOutlinedIcon;
  return (
    <React.Fragment>
      {columns.map((column) => (
        <TableCell
          key={column.dataKey}
          align={column.numeric || false ? "right" : "left"}>
          <Typography
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}>
            {column.dataKey === "designation" &&
              React.createElement(icon, {
                fontSize: "small",
              })}
            {row[column.dataKey] as React.ReactNode}
          </Typography>
        </TableCell>
      ))}
    </React.Fragment>
  );
}

interface TableDataProps {
  data?: DataRow[];
}

export default function TableData({ data = [] }: TableDataProps) {
  return (
    <TableVirtuoso
      data={data}
      components={VirtuosoTableComponents as any}
      fixedHeaderContent={fixedHeaderContent}
      itemContent={rowContent}
    />
  );
}
