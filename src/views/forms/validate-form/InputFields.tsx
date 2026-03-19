import InputControl from "../../../components/InputControl";
import { UseFormRegister, FormState, FieldValues, Path } from "react-hook-form";

interface InputField {
  name: string;
  label: string;
  helperText?: string;
  placeholder?: string;
}

export interface InputFieldsProps<T extends FieldValues = FieldValues> {
  register: UseFormRegister<T>;
  formState: FormState<T>;
}

export default function InputFields<T extends FieldValues = FieldValues>({ register, formState: { errors } }: InputFieldsProps<T>) {
  return (
    <>
      {fields.map(({ name, label, helperText, placeholder }) => (
        <InputControl
          {...register(name as Path<T>)}
          key={name}
          label={label}
          fullWidth
          placeholder={placeholder}
          helperText={!errors[name] ? helperText : undefined}
          message={(errors[name]?.message as string) || undefined}
          size='small'
          sx={{ my: 1 }}
        />
      ))}
    </>
  );
}

const fields: InputField[] = [
  {
    name: "classNumber",
    label: "Numéro de classification",
    helperText: "Code issu du plan de classement officiel (ex : 2024-ADM-001)",
    placeholder: "2024-ADM-001",
  },
  {
    name: "refNumber",
    label: "Numéro de référence",
    helperText: "Référence interne du document dans votre système (ex : REF-DRH-042)",
    placeholder: "REF-DRH-042",
  },
  {
    name: "profile",
    label: "Profil d'accès",
    helperText: "Service ou rôle autorisé à consulter ce document (laisser vide si aucune restriction)",
    placeholder: "Ex : Direction, Ressources humaines",
  },
];
