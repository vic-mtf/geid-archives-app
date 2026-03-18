import { AppBar, Toolbar, Box, Typography } from "@mui/material";
import React from "react";
// import SearchInput from '../../components/SearchInput';
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
          {/* <SearchInput
                        onChange={event => {
                            const customEvent = new CustomEvent('_search_data', {
                                detail: {
                                    value: event.target.value,
                                    name: '_search_data',
                                }
                            });
                            document.getElementById('root')?.dispatchEvent(customEvent);
                        }}
                    /> */}
          <Box
            component='div'
            display='flex'
            justifyContent='right'
            sx={{ flexGrow: 1 }}>
            <MainOption />
          </Box>
        </Toolbar>
      </AppBar>
      <DisconnectDialog />
    </React.Fragment>
  );
}
