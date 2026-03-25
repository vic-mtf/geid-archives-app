import React from "react";
import InputControl from "@/components/InputControl";
import Typology from "./Typology";

interface InputsDocProps {
  type?: React.MutableRefObject<string | null | undefined>;
  designation?: React.MutableRefObject<string | null | undefined>;
  refNumber?: React.MutableRefObject<string | null | undefined>;
  subType?: React.MutableRefObject<string | null | undefined>;
  description?: React.MutableRefObject<string | null | undefined>;
  findError: (field: string) => boolean;
}

export default function InputsDoc({
  type,
  designation,
  refNumber,
  subType,
  description,
  findError,
}: InputsDocProps) {
  const message = "Intitulé non valide ou trop court.";

  return (
    <React.Fragment>
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

      <InputControl
        fullWidth
        margin='dense'
        label='N° de référence'
        placeholder='Référence interne du document'
        helperText="Facultatif — numéro ou code de référence interne"
        onChange={(e) => { if (refNumber) refNumber.current = e.target.value; }}
      />

      <Typology
        type={type}
        subType={subType}
        externalTypeError={findError("type")}
      />

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
