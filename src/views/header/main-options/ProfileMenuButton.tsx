import { ThemeProvider } from "@emotion/react";
import { Chip, createTheme, Tooltip, useMediaQuery, useTheme } from "@mui/material";
import React, { useRef, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import ProfileMenu from "../ProfileMenu";
import getFullName from "@/utils/getFullName";
import Avatar from "@/components/Avatar";

export default function ProfileMenuButton() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const user = useSelector((store: RootState) => store.user);
  const theme = useTheme();
  const fullName = getFullName(user as unknown as Parameters<typeof getFullName>[0]);
  const shotName = `${(user as Record<string, unknown>).lastname?.toString().charAt(0)}${(user as Record<string, unknown>).firstname?.toString().charAt(0)}`;
  const matches = useMediaQuery(theme.breakpoints.only("xs"));

  return (
    <React.Fragment>
      <ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
        <Tooltip title='Profil' arrow>
          <Chip
            label={matches ? shotName : fullName}
            ref={anchorRef}
            onClick={() => {
              setAnchorEl(anchorEl ? null : anchorRef.current);
            }}
            sx={{ ml: 1, borderRadius: 1 }}
            avatar={
              <Avatar
                alt={fullName}
                src={(user as Record<string, unknown>).image as string}
              />
            }
          />
        </Tooltip>
      </ThemeProvider>
      <ProfileMenu
        onClose={() => setAnchorEl(null)}
        anchorEl={anchorEl}
      />
    </React.Fragment>
  );
}
