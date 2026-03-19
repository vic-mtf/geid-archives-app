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
            placeholder='Ex : Rapport annuel RH 2024'
            helperText={
              !findError("title") || designation?.current
                ? "Titre court et précis du document — ce nom sera affiché dans la liste des archives"
                : undefined
            }
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
            placeholder='Ex : Gestion des ressources humaines'
            helperText={
              !findError("folder") || folder?.current
                ? "Nom du projet, service ou mission dont le document est issu"
                : undefined
            }
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
        placeholder="Décrivez brièvement le contenu et l'objet du document…"
        helperText={
          !findError("description") || description?.current
            ? "Résumé du contenu — sera utilisé pour la recherche et l'identification du document"
            : undefined
        }
        message={findError("description") && !description?.current ? message : undefined}
        onChange={(e) => { if (description) description.current = e.target.value; }}
      />
    </React.Fragment>
  );
}
