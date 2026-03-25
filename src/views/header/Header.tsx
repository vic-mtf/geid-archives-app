import { AppBar, Toolbar, Box, CardMedia, Divider, Typography } from "@mui/material";
import React from "react";
import DisconnectDialog from "./DisconnectDialog";
import MainOption from "./main-options/MainOption";
import appConfig from "@/configs/app-config.json";
import geidLogo from "@/assets/geid_logo_white.png";

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
          <Box display="flex" alignItems="center" gap={{ xs: 0.75, sm: 1 }} flexGrow={1}>
            <CardMedia
              component="img"
              src={geidLogo}
              draggable={false}
              sx={{ height: { xs: 24, sm: 28 }, width: "auto" }}
            />
            <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.3)", my: 0.25 }} />
            <Typography
              noWrap
              component='div'
              sx={{ fontSize: { xs: "1rem", sm: "1.1rem" }, fontWeight: 700 }}>
              Archives
            </Typography>
          </Box>
          <Box component='div' display='flex' justifyContent='right'>
            <MainOption />
          </Box>
        </Toolbar>
      </AppBar>
      <DisconnectDialog />
    </React.Fragment>
  );
}
