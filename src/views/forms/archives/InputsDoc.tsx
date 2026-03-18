import { Box, Stack } from "@mui/material";
import React from "react";
import InputControl from "../../../components/InputControl";
import Typology from "./Typology";

interface InputsDocProps {
  type?: React.MutableRefObject<string | null | undefined>;
  designation?: React.MutableRefObject<string | null | undefined>;
  subType?: React.MutableRefObject<string | null | undefined>;
  description?: React.MutableRefObject<string | null | undefined>;
  folder?: React.MutableRefObject<string | null | undefined>;
  findError: (field: string) => boolean;
}

export default function InputsDoc({
  type,
  designation,
  subType,
  description,
  folder,
  findError,
}: InputsDocProps) {
  const message = "Intitulé non valide ou trop court.";

  return (
    <React.Fragment>
      <Stack direction='row' spacing={1}>
        <Box display='flex' width='100%'>
          <InputControl
            fullWidth
            margin='dense'
            label='Désignation'
            message={findError("title") && !designation?.current ? message : undefined}
            onChange={(e) => { if (designation) designation.current = e.target.value; }}
          />
        </Box>
      </Stack>
      <Typology
        type={type}
        subType={subType}
        externalTypeError={findError("type")}
      />
      <Stack direction='row' spacing={1}>
        <Box display='flex' flex={1}>
          <InputControl
            fullWidth
            margin='dense'
            label='Activité / Mission / Dossier'
            message={findError("folder") && !folder?.current ? message : undefined}
            onChange={(e) => { if (folder) folder.current = e.target.value; }}
          />
        </Box>
      </Stack>
      <InputControl
        fullWidth
        multiline
        margin='dense'
        rows={3}
        label='Description'
        message={findError("description") && !description?.current ? message : undefined}
        onChange={(e) => { if (description) description.current = e.target.value; }}
      />
    </React.Fragment>
  );
}
