import { styled, ToggleButton } from "@mui/material";

const IconButton = styled(ToggleButton)(() => ({
  border: "none",
  "&:disabled": {
    border: "none",
  },
}));

export default IconButton;
