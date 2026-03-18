import { Paper, Table, TableContainer, TablePagination } from "@mui/material";
import React, { useCallback, useMemo, useState } from "react";
import DataGridHeader from "./header/DataGridHeader";
import DataGridBody from "./body/DataGridBody";
import { sortFuncDate, sortFuncString } from "../../utils/sortDate";
import type { Column } from "./columns/columns";

export interface Row {
  id?: string | number;
  [key: string]: unknown;
}

interface DataGridProps {
  // pinClomns?: Column[];
  // onChangeCell?: ((cell: unknown) => void) | null;
  checkbox?: boolean;
  columns?: Column[];
  rows?: Row[];
}

export default function DataGrid({
  // pinClomns = [],
  // onChangeCell = null,
  checkbox = false,
  columns: _columns = [],
  rows = [],
}: DataGridProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(100);
  const [selectedRows, setSelectedRows] = useState<Row[]>([]);
  const [sortByField, setSortByField] = useState("designation");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const columns = useMemo(
    () => _columns?.filter((col) => !col?.pin),
    [_columns]
  );
  const pinningColumns = useMemo(
    () => _columns?.filter((col) => col?.pin),
    [_columns]
  );

  const isSelectedRow = useCallback(
    (rowId: string | number | undefined) => !!selectedRows.find(({ id }) => id === rowId),
    [selectedRows]
  );

  const handleToggleSelectedRow = useCallback(
    (row?: Row) => {
      if (row) {
        const find = !!selectedRows.find(({ id }) => id === row?.id);
        setSelectedRows((rows) =>
          find ? rows.filter(({ id }) => id !== row?.id) : [...rows, row]
        );
      } else setSelectedRows((_rows) => (_rows?.length ? [] : rows));
    },
    [selectedRows, rows, setSelectedRows]
  );
  const handleSort = (field: string) => () => {
    setSortOrder(field === sortByField && sortOrder === "asc" ? "desc" : "asc");
    setSortByField(field);
  };
  const showPinnigTable = useMemo(
    () => pinningColumns?.length > 0 || checkbox,
    [pinningColumns, checkbox]
  );
  const count = useMemo(() => rows?.length, [rows]);
  const handleChangePage = (_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => setPage(newPage);

  const sortArray = useCallback(
    (array: Row[]) => {
      const field = sortByField;
      const { type } = columns.find((col) => field === col?.field) || {};
      const _array = array.map((data, index) => [index, data] as [number, Row]);
      if (type === "date")
        _array.sort((a, b) =>
          sortFuncDate(new Date(a[1][field] as string), new Date(b[1][field] as string))
        );
      else if (type === "number")
        _array.sort((a, b) => parseFloat(a[1][field] as string) - parseFloat(b[1][field] as string));
      else
        _array.sort((a, b) =>
          sortFuncString(a[1][field]?.toString() || "", b[1][field]?.toString() || "")
        );
      if (sortOrder === "desc") _array.reverse();
      return _array.map((field) => field[1]);
    },
    [columns, sortByField, sortOrder]
  );

  return (
    <Paper elevation={0}>
      <TablePagination
        rowsPerPageOptions={[]}
        component='div'
        variant='head'
        labelRowsPerPage='nome de page '
        labelDisplayedRows={({ from, to, count }) =>
          `${from} à ${to} sur ${count !== -1 ? count : `plus que ${to}`}`
        }
        backIconButtonProps={{ size: "small" }}
        nextIconButtonProps={{ size: "small" }}
        count={count}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
      />
      <TableContainer
        sx={{
          display: "flex",
          flex: 1,
          height: 500,
        }}>
        {showPinnigTable && (
          <React.Fragment>
            <Table
              stickyHeader
              sx={{
                left: 0,
                position: "sticky",
                zIndex: (theme) => theme.zIndex.appBar,
                borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                bgcolor: (theme) => theme.palette.background.paper,
              }}>
              <DataGridHeader
                columns={pinningColumns}
                checkbox={checkbox}
                handleToggleSelectedRow={handleToggleSelectedRow}
                total={rows?.length}
                rowsSelected={selectedRows?.length}
                handleSort={handleSort}
                sortOrder={sortOrder}
                sortByField={sortByField}
              />
              <DataGridBody
                rows={rows}
                checkbox={checkbox}
                isSelectedRow={isSelectedRow}
                handleToggleSelectedRow={handleToggleSelectedRow}
                columns={pinningColumns}
              />
            </Table>
          </React.Fragment>
        )}
        <Table stickyHeader>
          <DataGridHeader
            columns={columns}
            handleSort={handleSort}
            sortOrder={sortOrder}
            sortByField={sortByField}
          />
          <DataGridBody
            rows={sortArray(rows)}
            columns={columns}
            isSelectedRow={isSelectedRow}
            handleToggleSelectedRow={handleToggleSelectedRow}
          />
        </Table>
      </TableContainer>
    </Paper>
  );
}
