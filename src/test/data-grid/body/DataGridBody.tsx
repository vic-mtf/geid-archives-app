import React, { useMemo } from "react";
import { Checkbox, TableBody, TableCell, TableRow } from "@mui/material";
import TableCellInput from "./TableCellInput";
import type { Row } from "../DataGrid";
import type { Column } from "../columns/columns";

interface DataGridBodyProps {
  rows?: Row[];
  checkbox?: boolean;
  columns: Column[];
  isSelectedRow: (rowId: string | number | undefined) => boolean;
  handleToggleSelectedRow: (row?: Row) => void;
}

export default function DataGridBody({
  rows: _rows = [],
  checkbox,
  columns,
  isSelectedRow,
  handleToggleSelectedRow,
}: DataGridBodyProps) {
  const rows = useMemo(
    () =>
      _rows?.map((row) => {
        const row_: {
          selected: boolean;
          cells: React.ReactNode[];
          [key: string]: unknown;
        } = {
          selected: isSelectedRow(row?.id),
          cells: [],
        };
        if (checkbox)
          row_.cells.push(
            <Checkbox
              size='small'
              checked={isSelectedRow(row?.id)}
              onChange={() => handleToggleSelectedRow(row)}
            />
          );
        columns.forEach(({ field, ...otherProps }) => {
          row_.cells.push(
            row[field] !== undefined ? String(row[field]) : ""
          );
          Object.keys(otherProps).forEach((key) => {
            if (row_[key] === undefined) row_[key] = otherProps[key];
          });
        });
        return row_;
      }),
    [_rows, columns, checkbox, isSelectedRow, handleToggleSelectedRow]
  );

  return (
    <React.Fragment>
      <TableBody>
        {rows?.map((row, _key) => (
          <TableRow key={_key} selected={row?.selected as boolean}>
            {row?.cells.map((value, key) => (
              <React.Fragment key={key + _key}>
                {typeof value === "string" ? (
                  <TableCellInput value={value} {...row} />
                ) : (
                  <TableCell
                    height={100}
                    variant='body'
                    padding='none'
                    align='center'>
                    {value}
                  </TableCell>
                )}
              </React.Fragment>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </React.Fragment>
  );
}
