import React from "react";
import { Button, Toolbar } from "@mui/material";
import {
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
} from "@mui/x-data-grid";
import NavigationMenuButton from "@/views/navigation/NavigationMenuButton";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";

const ArchivingServiceHeader = React.memo(() => {
  const handleAdd = () => {
    document.getElementById("root")?.dispatchEvent(
      new CustomEvent("__open_archive_source_picker", { detail: {} })
    );
  };

  return (
    <Toolbar sx={{ gap: 1, flexWrap: "wrap", py: 1 }}>
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

      <Button
        variant="contained"
        size="small"
        startIcon={<AddOutlinedIcon />}
        onClick={handleAdd}
        sx={{ ml: "auto" }}>
        Ajouter
      </Button>
    </Toolbar>
  );
});

ArchivingServiceHeader.displayName = "ArchivingServiceHeader";
export default ArchivingServiceHeader;
