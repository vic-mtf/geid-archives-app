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
          <Box display="flex" alignItems="center" gap={{ xs: 0.5, sm: 0.75 }} flexGrow={1}>
            <CardMedia
              component="img"
              src={geidLogo}
              draggable={false}
              sx={{ height: { xs: 18, sm: 20 }, width: "auto", opacity: 0.9 }}
            />
            <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.25)", my: 0.75 }} />
            <Typography
              noWrap
              component='div'
              sx={{ fontSize: { xs: "0.8rem", sm: "0.85rem" }, fontWeight: 600, letterSpacing: 0.3 }}>
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
