import React from "react";
import { Toolbar } from "@mui/material";
// import {
//   GridToolbarColumnsButton,
//   GridToolbarFilterButton,
// } from "@mui/x-data-grid-pro";
import {
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
} from "@mui/x-data-grid";
import NavigationMenuButton from "../../../navigation/NavigationMenuButton";

const ArchivingServiceHeader = React.memo(() => {
  return (
    <Toolbar sx={{ gap: 2 }}>
      <NavigationMenuButton
        hide
        IconProps={{ sx: { transform: "rotate(-180deg)" } }}
      />

      <GridToolbarColumnsButton
        slotProps={{
          button: { variant: "outlined", color: "inherit", size: "medium" },
        }}
      />
      <GridToolbarFilterButton
        slotProps={{
          button: { variant: "outlined", color: "inherit", size: "medium" },
        }}
      />
    </Toolbar>
  );
});

ArchivingServiceHeader.displayName = "ArchivingServiceHeader";
export default ArchivingServiceHeader;
