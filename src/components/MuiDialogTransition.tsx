import React from "react";
import { useTheme, useMediaQuery, Slide, Zoom } from "@mui/material";
import { SlideProps } from "@mui/material/Slide";

const MuiDialogTransition = React.forwardRef<unknown, SlideProps>((props, ref) => {
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.down("md"));
  return matches ? (
    <Slide direction="up" ref={ref} {...props} unmountOnExit />
  ) : (
    <Zoom ref={ref} {...props} unmountOnExit />
  );
});

MuiDialogTransition.displayName = "MuiDialogTransition";
export default MuiDialogTransition;
