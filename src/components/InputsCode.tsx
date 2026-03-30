import { FormControl, OutlinedInput, Stack, IconButton } from "@mui/material";
import { useMemo, useState } from "react";
import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";

interface CodeRef {
  value: string;
  values: string[];
}

interface InputsCodeProps {
  len?: number;
  size?: "small" | "medium";
  sizes?: number;
  value?: string | number;
  values?: (string | number)[];
  readOnly?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>, info: { id: number; value: string }) => void;
  onChangeEnd?: (values: string[]) => void;
  codeRef?: React.MutableRefObject<CodeRef | null>;
}

interface InputState {
  inputs: string[];
  read: number;
}

export default function InputsCode({
  len = 6,
  size = "small",
  sizes = 45,
  value = "",
  values = [],
  readOnly = false,
  onChange,
  onChangeEnd,
  codeRef: ref,
}: InputsCodeProps) {
  const [_values, _setValues] = useState<InputState>({
    inputs: [],
    read: 0,
  });

  const inputs = useMemo(() => {
    const inputsProps = [];
    for (let i = 0; i < len; i++)
      inputsProps.push({
        id: i,
        size,
        autoComplete: "off",
        defaultValue: value || values[i],
      });
    return inputsProps;
  }, [len, size, value, values]);

  const handleChange = (id: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value.trim().toString();
    if (!~"0123456789".indexOf(val)) return;
    const newInputs = [..._values.inputs];
    newInputs[id] = val;
    const read = id + 1;
    _setValues({ inputs: newInputs, read });
    document.getElementById(`input_code_${read}`)?.focus();
    if (ref)
      ref.current = { value: val, values: newInputs };
    if (typeof onChange === "function")
      onChange(event, { id, value: val });
    if (typeof onChangeEnd === "function" && id === len - 1)
      onChangeEnd([...newInputs]);
  };

  const handleDelete = (event: React.MouseEvent) => {
    event.preventDefault();
    const read = Math.min(len, Math.max(0, _values.inputs.length - 1));
    document.getElementById(`input_code_${read}`)?.focus();
    const newInputs = _values.inputs.filter((_, index) => index !== read);
    _setValues({ ..._values, inputs: newInputs, read });
    if (typeof onChange === "function")
      onChange(event as unknown as React.ChangeEvent<HTMLInputElement>, { id: read, value: newInputs[read] });
  };

  return (
    <Stack
      direction="row"
      spacing={1}
      display="flex"
      justifyContent="center"
      alignItems="center">
      {inputs.map(({ id, ...inputProps }) => (
        <FormControl variant="outlined" key={id}>
          <OutlinedInput
            onChange={handleChange(id)}
            id={`input_code_${id}`}
            onKeyDown={(event) => {
              if (event.keyCode === 8) handleDelete(event as unknown as React.MouseEvent);
            }}
            inputProps={{
              style: {
                height: sizes,
                width: sizes,
                textAlign: "center",
                fontSize: 30,
              },
              value: _values.inputs[id] || "",
            }}
            sx={{ height: sizes, width: sizes }}
            readOnly={readOnly || _values.read !== id}
            autoFocus={_values.read === id}
            {...inputProps}
          />
        </FormControl>
      ))}
      <IconButton aria-label="Backspace" onClick={handleDelete}>
        <BackspaceOutlinedIcon />
      </IconButton>
    </Stack>
  );
}
