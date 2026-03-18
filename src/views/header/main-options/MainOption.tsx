import React from "react";
// import MoreOptionsButton from "./MoreOptionsButton";
import options from "./headerOptions";
import {
  createTheme,
  ThemeProvider,
  Tooltip,
  Box,
  IconButton,
} from "@mui/material";
import { createElement } from "react";

export default function MainOption() {
  return (
    <React.Fragment>
      {options
        .filter(({ pin }) => pin)
        .map(({ element, key, label, action, icon, disabled }) => (
          <React.Fragment key={key}>
            {element ? (
              createElement(element)
            ) : (
              <ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
                <Tooltip title={label} arrow>
                  <Box>
                    <IconButton
                      onClick={action}
                      // color="inherit"
                      disabled={disabled}>
                      {React.createElement(icon, { fontSize: "small" })}
                    </IconButton>
                  </Box>
                </Tooltip>
              </ThemeProvider>
            )}
          </React.Fragment>
        ))}
      {/* <MoreOptionsButton
                options={options.filter(option => !option.pin)}
            /> */}
    </React.Fragment>
  );
}
