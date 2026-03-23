import {
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import React, { useRef, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import AppsRoundedIcon from "@mui/icons-material/AppsRounded";
import AppsMenu from "./AppsMenu";
import ProfileMenu from "./ProfileMenu";

export default function MainOption() {
  return (
    <React.Fragment>
      <AppsMenuButton />
      <ProfileMenuButton />
    </React.Fragment>
  );
}

const AppsMenuButton = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);

  return (
    <React.Fragment>
      <Tooltip title='Applications' arrow>
        <IconButton
          size='small'
          // color="inherit"
          sx={{ mx: 1 }}
          ref={anchorRef}
          onClick={() => {
            setAnchorEl(anchorEl ? null : anchorRef.current);
          }}>
          <AppsRoundedIcon fontSize='small' />
        </IconButton>
      </Tooltip>
      <AppsMenu onClose={() => setAnchorEl(null)} anchorEl={anchorEl} />
    </React.Fragment>
  );
};

const ProfileMenuButton = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const user = useSelector((store: RootState) => store.user);
  const fullname = `${(user as Record<string, unknown>).lastname} ${(user as Record<string, unknown>).firstname}`;

  return (
    <React.Fragment>
      <ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
        <Tooltip title='Profil' arrow>
          <Chip
            label={fullname}
            ref={anchorRef}
            onClick={() => {
              setAnchorEl(anchorEl ? null : anchorRef.current);
            }}
            color='default'
            sx={{ ml: 1 }}
            avatar={<Avatar alt={fullname} src={(user as Record<string, unknown>).image as string} />}
          />
        </Tooltip>
      </ThemeProvider>
      <ProfileMenu onClose={() => setAnchorEl(null)} anchorEl={anchorEl} />
    </React.Fragment>
  );
};
