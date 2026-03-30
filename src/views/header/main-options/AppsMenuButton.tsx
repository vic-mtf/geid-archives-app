import { Box, Tooltip, IconButton } from "@mui/material";
import React, { useRef, useState } from "react";
import AppsOutlinedIcon from "@mui/icons-material/AppsOutlined";
import AppsMenu from "../AppsMenu";

export default function AppsMenuButton() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);

  return (
    <React.Fragment>
      <Tooltip title='Applications' arrow>
        <Box>
          <IconButton
            // color="inherit"
            sx={{ mx: 1 }}
            ref={anchorRef}
            onClick={() => {
              setAnchorEl(anchorEl ? null : anchorRef.current);
            }}>
            <AppsOutlinedIcon fontSize='small' />
          </IconButton>
        </Box>
      </Tooltip>
      <AppsMenu onClose={() => setAnchorEl(null)} anchorEl={anchorEl} />
    </React.Fragment>
  );
}
