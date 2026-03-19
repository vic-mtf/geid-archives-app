import { AppBar, Toolbar, Box, Typography } from "@mui/material";
import React from "react";
import DisconnectDialog from "./DisconnectDialog";
import MainOption from "./main-options/MainOption";
import appConfig from "../../configs/app-config.json";

export default function Header() {
  return (
    <React.Fragment>
      <AppBar
        position='fixed'
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: appConfig.colors.main,
        }}>
        <Toolbar variant='dense'>
          <Typography
            flexGrow={1}
            fontSize={18}
            fontWeight='bold'
            variant='h6'
            noWrap
            component='div'>
            Archives
          </Typography>
          <Box component='div' display='flex' justifyContent='right'>
            <MainOption />
          </Box>
        </Toolbar>
      </AppBar>
      <DisconnectDialog />
    </React.Fragment>
  );
}
