import InputControl from "../../../components/InputControl";
import { UseFormRegister, FormState, FieldValues, Path } from "react-hook-form";

interface InputField {
  name: string;
  label: string;
}

export interface InputFieldsProps<T extends FieldValues = FieldValues> {
  register: UseFormRegister<T>;
  formState: FormState<T>;
}

export default function InputFields<T extends FieldValues = FieldValues>({ register, formState: { errors } }: InputFieldsProps<T>) {
  return (
    <>
      {fields.map(({ name, label }) => (
        <InputControl
          {...register(name as Path<T>)}
          key={name}
          label={label}
          fullWidth
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
  },
  {
    name: "refNumber",
    label: "Numéro de référence",
  },
  {
    name: "profile",
    label: "Profil",
  },
];
