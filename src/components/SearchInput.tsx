import { InputAdornment, TextField, TextFieldProps } from "@mui/material";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";

type SearchInputProps = Omit<TextFieldProps, "variant" | "size">;

export default function SearchInput(props: SearchInputProps) {
  return (
    <TextField
      fullWidth
      size="small"
      variant="outlined"
      placeholder="Rechercher…"
      inputProps={{ "aria-label": "search" }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchOutlinedIcon fontSize="small" color="action" />
          </InputAdornment>
        ),
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: 2,
          fontSize: 14,
        },
      }}
      {...props}
    />
  );
}
