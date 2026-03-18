import React, { useCallback, useMemo, useState } from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import {
  FormControl,
  FormHelperText,
  MenuItem,
  Paper,
  Popper,
  Stack,
  Theme,
  Typography,
} from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";

interface DocType {
  name: string;
  subtypes?: string[];
}

interface OptionItem {
  label: string;
  id: number;
}

interface DocTypeFrameProps {
  typeRef?: React.MutableRefObject<string | null>;
  subTypeRef?: React.MutableRefObject<string | null>;
  externalTypeError?: boolean;
  externalErrorSubTypeError?: boolean;
}

export default function DocTypeFrame({
  typeRef,
  subTypeRef,
  externalTypeError,
  externalErrorSubTypeError,
}: DocTypeFrameProps) {
  const docTypes = useSelector(
    (store: RootState) => (store.user as { docTypes?: DocType[] }).docTypes ?? []
  );
  const [type, setType] = useState<OptionItem | null>(null);
  const [subType, setSubType] = useState<OptionItem | null>(null);

  const types = useMemo(
    () => docTypes.map(({ name: label }, id) => ({ label, id })),
    [docTypes]
  );

  const subTypes = useMemo(
    () =>
      docTypes
        ?.find(({ name }) => name === type?.label)
        ?.subtypes?.map((label, id) => ({ label, id })) ?? [],
    [docTypes, type]
  );

  const typeEmptyError = useMemo(
    () => Boolean(externalTypeError && !type),
    [externalTypeError, type]
  );

  const subTypeEmptyError = useMemo(
    () =>
      Boolean(externalErrorSubTypeError && !subType && subTypes?.length > 1),
    [externalErrorSubTypeError, subType, subTypes.length]
  );

  const onChangeType = useCallback(
    (_event: React.SyntheticEvent, selectedType: OptionItem | null) => {
      if (typeRef) typeRef.current = selectedType?.label ?? null;
      if (subTypeRef) subTypeRef.current = null;
      setType(selectedType ?? null);
      setSubType(null);
    },
    [typeRef, subTypeRef]
  );

  const onChangeSubType = useCallback(
    (_event: React.SyntheticEvent, selectedType: OptionItem | null) => {
      if (subTypeRef) subTypeRef.current = selectedType?.label ?? null;
      setSubType(selectedType ?? null);
    },
    [subTypeRef]
  );

  return (
    <Stack width="100%">
      <FormControl>
        <Autocomplete<OptionItem>
          size="small"
          fullWidth
          options={types}
          onChange={onChangeType}
          value={type}
          noOptionsText="Aucun élement"
          renderOption={(params, _option) => (
            <MenuItem {...params} sx={{ fontSize: 14 }}>
              {params.key}
            </MenuItem>
          )}
          PaperComponent={(params) => (
            <Paper
              sx={{
                bgcolor: (theme: Theme) =>
                  theme.palette.background.paper + theme.customOptions.opacity,
                border: (theme: Theme) => `1px solid ${theme.palette.divider}`,
                backdropFilter: (theme: Theme) => `blur(${theme.customOptions.blur})`,
              }}
              {...params}
            />
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Type"
              size="small"
              margin="normal"
              error={typeEmptyError}
              InputProps={{
                ...params.InputProps,
                sx: { fontSize: 14 },
                endAdornment: (
                  <React.Fragment>
                    {params.InputProps.endAdornment}
                  </React.Fragment>
                ),
              }}
            />
          )}
        />
        {typeEmptyError && (
          <FormHelperText sx={{ color: (theme: Theme) => theme.palette.error.main }}>
            S'il vous plaît sélectionner un élément.
          </FormHelperText>
        )}
      </FormControl>
      <FormControl>
        <Autocomplete<OptionItem>
          size="small"
          fullWidth
          disabled={!subTypes.length}
          value={subType}
          noOptionsText="Aucun élement"
          onChange={onChangeSubType}
          options={subTypes}
          renderOption={(params, _option, { index }) => (
            <MenuItem {...params}>
              <Typography
                variant="caption"
                key={index}
                sx={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                {params.key}
              </Typography>
            </MenuItem>
          )}
          PopperComponent={(params) => <Popper {...params} />}
          PaperComponent={(params) => (
            <Paper
              {...params}
              sx={{
                bgcolor: (theme: Theme) =>
                  theme.palette.background.paper + theme.customOptions.opacity,
                border: (theme: Theme) => `1px solid ${theme.palette.divider}`,
                backdropFilter: (theme: Theme) => `blur(${theme.customOptions.blur})`,
              }}
            />
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Sous type"
              size="small"
              margin="normal"
              error={subTypeEmptyError}
              InputProps={{
                ...params.InputProps,
                sx: { fontSize: 14 },
                endAdornment: (
                  <React.Fragment>
                    {params.InputProps.endAdornment}
                  </React.Fragment>
                ),
              }}
            />
          )}
        />
        {subTypeEmptyError && (
          <FormHelperText sx={{ color: (theme: Theme) => theme.palette.error.main }}>
            S'il vous plaît sélectionner un élément.
          </FormHelperText>
        )}
      </FormControl>
    </Stack>
  );
}
