import { InputBase, useTheme, TableCell, FormControl } from "@mui/material";
import { useState } from "react";

interface TableCellInputProps {
  value: string;
  multiline?: boolean;
  [key: string]: unknown;
}

export default function TableCellInput({ value, multiline }: TableCellInputProps) {
  const theme = useTheme();
  const [focus, setFocus] = useState(false);
  const [readOnly, setReadOnly] = useState(true);

  return (
    <TableCell height={100} variant='body' padding='none'>
      <FormControl
        sx={{
          border: (theme) =>
            `1px solid ${focus ? theme.palette.primary.main : "transparent"}`,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
        <InputBase
          multiline={multiline}
          defaultValue={value}
          maxRows={3}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          sx={{
            ...theme.typography.caption,
            overflow: "hidden",
          }}
          onDoubleClick={() => setReadOnly(false)}
          readOnly={readOnly}
          inputProps={{
            style: {
              overflow: "hidden",
              textOverflow: "ellipsis",
            },
          }}></InputBase>
      </FormControl>
    </TableCell>
  );
}
