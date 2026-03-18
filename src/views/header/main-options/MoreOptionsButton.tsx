import {
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  IconButton,
} from "@mui/material";
import React, { useRef, useState } from "react";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";

interface MoreOption {
  icon?: React.ReactNode;
  label: string;
  key: string;
  action?: (event: React.MouseEvent) => void;
}

interface MoreOptionsButtonProps {
  options: MoreOption[];
}

export default function MoreOptionsButton({ options }: MoreOptionsButtonProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null | false>(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  return (
    <React.Fragment>
      <Tooltip title='Plus' arrow>
        <IconButton
          // color="inherit"
          sx={{ mx: 1 }}
          ref={anchorRef}
          onClick={() => {
            setAnchorEl(anchorEl ? null : anchorRef.current);
          }}>
          <MoreVertRoundedIcon fontSize='small' />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorRef.current}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        MenuListProps={{
          dense: true,
        }}
        PaperProps={{
          sx: {
            bgcolor: (theme) =>
              theme.palette.background.paper + theme.customOptions.opacity,
            backdropFilter: (theme) => `blur(${theme.customOptions.blur})`,
          },
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}>
        {options?.map(({ icon, label, key, action }) => (
          <MenuItem
            key={key}
            onClick={(event) => {
              if (typeof action === "function") action(event);
              setAnchorEl(null);
            }}>
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText primary={label} />
          </MenuItem>
        ))}
      </Menu>
    </React.Fragment>
  );
}
