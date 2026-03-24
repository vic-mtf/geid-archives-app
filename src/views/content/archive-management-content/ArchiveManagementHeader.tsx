/**
 * ArchiveManagementHeader — Barre d'outils du DataGrid archives.
 *
 * Contient les boutons colonnes, filtres, recherche rapide,
 * suppression groupée et ajout (mobile uniquement).
 */

import React from "react";
import {
  Box as MuiBox,
  Button,
  Toolbar,
} from "@mui/material";
import AddRoundedIcon            from "@mui/icons-material/AddRounded";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import {
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid";
import NavigationMenuButton from "@/views/navigation/NavigationMenuButton";

interface ArchiveManagementHeaderProps {
  canWrite: boolean;
  onAdd: () => void;
  selectedCount: number;
  onBulkDelete: () => void;
}

const ArchiveManagementHeader = React.memo(function ArchiveManagementHeader({
  canWrite,
  onAdd,
  selectedCount,
  onBulkDelete,
}: ArchiveManagementHeaderProps) {
  return (
    <Toolbar sx={{ gap: 1, flexWrap: "wrap", py: 0.5, minHeight: "unset" }}>
      <NavigationMenuButton hide IconProps={{ sx: { transform: "rotate(-180deg)" } }} />
      <GridToolbarColumnsButton slotProps={{ button: { variant: "outlined", color: "inherit", size: "small" } }} />
      <GridToolbarFilterButton  slotProps={{ button: { variant: "outlined", color: "inherit", size: "small" } }} />
      <MuiBox flex={1} />
      <GridToolbarQuickFilter size="small" sx={{ "& .MuiInputBase-root": { borderRadius: 1 } }} />
      {selectedCount > 1 && canWrite && (
        <Button
          variant="outlined"
          size="small"
          color="error"
          startIcon={<DeleteOutlineOutlinedIcon />}
          onClick={onBulkDelete}
        >
          Supprimer ({selectedCount})
        </Button>
      )}
      {/* Ajouter visible sur mobile seulement — sur desktop c'est dans la sidebar */}
      {canWrite && (
        <Button
          variant="contained"
          size="small"
          startIcon={<AddRoundedIcon />}
          onClick={onAdd}
          disableElevation
          sx={{ display: { xs: "flex", md: "none" } }}
        >
          Ajouter
        </Button>
      )}
    </Toolbar>
  );
});

export default ArchiveManagementHeader;
