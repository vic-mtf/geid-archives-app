import { useLayoutEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  FormControl,
  FormHelperText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Theme,
  Typography,
} from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "../../../redux/store";
import React from "react";

interface DocType {
  name: string;
  subtypes?: Array<{ name: string }>;
}

// L'API peut renvoyer soit string[], soit DocType[]
type DocTypeEntry = string | DocType;
const toName = (d: DocTypeEntry): string => (typeof d === "string" ? d : d.name);

interface TypologyValues {
  type: string | null;
  subType: string | null;
  types: string[];
  subTypes: string[];
}

interface TypologyProps {
  type?: React.MutableRefObject<string | null | undefined>;
  subType?: React.MutableRefObject<string | null | undefined>;
  externalTypeError?: boolean;
  externalSubTypeError?: boolean;
}

export default function Typology({
  type,
  subType,
  externalTypeError,
  externalSubTypeError,
}: TypologyProps) {
  const docTypes = useSelector(
    (store: RootState) => (store.user as Record<string, unknown>).docTypes as DocTypeEntry[] | undefined
  ) ?? [];

  const [values, setValues] = useState<TypologyValues>({
    type: null,
    subType: null,
    types: docTypes.map(toName).filter(Boolean),
    subTypes: typeof docTypes[0] !== "string" ? (docTypes[0] as DocType)?.subtypes?.map(({ name }) => name) ?? [] : [],
  });

  const typeEmptyError = useMemo(
    () => !!(externalTypeError && !values.type),
    [externalTypeError, values.type]
  );

  const subTypeEmptyError = useMemo(
    () =>
      !!(externalSubTypeError && !values.subType && values.subTypes.length > 1),
    [externalSubTypeError, values.subType, values.subTypes.length]
  );

  const handleType = (_event: React.SyntheticEvent, selectedType: string | null) => {
    const found = docTypes.find((d) => toName(d) === selectedType);
    const subTypes = typeof found !== "string" ? (found as DocType)?.subtypes?.map(({ name }) => name) ?? [] : [];
    setValues({ ...values, type: selectedType, subType: null, subTypes });
  };

  useLayoutEffect(() => {
    if (type && subType && values.type) {
      type.current = values.type;
      if (values.subType) subType.current = values.subType;
      if (values.subTypes.length <= 1) subType.current = values.subTypes[0];
    }
    if (type && subType && !values.type) {
      type.current = null;
      subType.current = null;
    }
  }, [type, subType, values.type, values.subType, values.subTypes]);

  const paperSx = {
    bgcolor: (theme: Theme) =>
      theme.palette.background.paper + theme.customOptions.opacity,
    border: (theme: Theme) => `1px solid ${theme.palette.divider}`,
    backdropFilter: (theme: Theme) => `blur(${theme.customOptions.blur})`,
  };

  return (
    <Stack direction="row" spacing={1}>
      <FormControl fullWidth>
        <Autocomplete<string>
          size="small"
          fullWidth
          options={values.types}
          onChange={handleType}
          value={values.type}
          noOptionsText={<Typography color="error">Aucun élement</Typography>}
          renderOption={(params, option) => (
            <MenuItem {...params} key={option} sx={{ fontSize: 14 }}>
              {option}
            </MenuItem>
          )}
          PaperComponent={(params) => (
            <Paper sx={paperSx} {...params} />
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Type"
              size="small"
              margin="normal"
              error={typeEmptyError}
              InputProps={{ ...params.InputProps, sx: { fontSize: 14 } }}
            />
          )}
        />
        {typeEmptyError && (
          <FormHelperText sx={{ color: (theme: Theme) => theme.palette.error.main }}>
            {errorMessage}
          </FormHelperText>
        )}
      </FormControl>
      <FormControl fullWidth>
        <Autocomplete<string>
          key={values.type}
          size="small"
          fullWidth
          disabled={values.subTypes.length < 2 || !values.type}
          value={values.subType}
          title={values.subType ?? undefined}
          onChange={(_event, val) => setValues({ ...values, subType: val })}
          options={values.subTypes}
          noOptionsText={<Typography color="error">Aucun élement</Typography>}
          renderOption={(params, option) => (
            <MenuItem {...params} key={option} sx={{ fontSize: 14 }}>
              {option}
            </MenuItem>
          )}
          PaperComponent={(params) => <Paper sx={paperSx} {...params} />}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Sous type"
              size="small"
              margin="normal"
              error={subTypeEmptyError}
              InputProps={{ ...params.InputProps, sx: { fontSize: 14 } }}
            />
          )}
        />
        {subTypeEmptyError && (
          <FormHelperText sx={{ color: (theme: Theme) => theme.palette.error.main }}>
            {errorMessage}
          </FormHelperText>
        )}
      </FormControl>
    </Stack>
  );
}

const errorMessage = "S'il vous plaît sélectionner un élément.";
