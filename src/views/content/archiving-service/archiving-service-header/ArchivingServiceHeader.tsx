import React from "react";
import { Button, Toolbar } from "@mui/material";
import {
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
} from "@mui/x-data-grid";
import NavigationMenuButton from "@/views/navigation/NavigationMenuButton";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

const ArchivingServiceHeader = React.memo(() => {
  const handleAdd = () => {
    const event = new CustomEvent("_open_archives_form", { detail: { file: { name: "Nouvelle archive" } } });
    document.getElementById("root")?.dispatchEvent(event);
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
        startIcon={<AddRoundedIcon />}
        onClick={handleAdd}
        sx={{ ml: "auto" }}>
        Ajouter
      </Button>
    </Toolbar>
  );
});

ArchivingServiceHeader.displayName = "ArchivingServiceHeader";
export default ArchivingServiceHeader;
