/**
 * ArchiveContextMenu — Menu contextuel pour les archives numériques dans le tree.
 *
 * Options :
 * - Ouvrir le fichier (toujours)
 * - Dissocier de l'archive physique (si autorisé)
 */

import React from "react";
import {
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import LinkOffRoundedIcon from "@mui/icons-material/LinkOffRounded";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";

export interface ArchiveMenuState {
  mouseX: number;
  mouseY: number;
  archiveId: string;
  archiveLabel: string;
}

export interface ArchiveContextMenuProps {
  state: ArchiveMenuState | null;
  onClose: () => void;
  canWrite: boolean;
  onOpen: (archiveId: string) => void;
  onUnlink: (archiveId: string, label: string) => void;
}

const ArchiveContextMenu = React.memo(function ArchiveContextMenu({
  state,
  onClose,
  canWrite,
  onOpen,
  onUnlink,
}: ArchiveContextMenuProps) {
  if (!state) return null;

  return (
    <Menu
      open
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={{ top: state.mouseY, left: state.mouseX }}
      slotProps={{
        paper: { sx: { minWidth: 200, borderRadius: 1.5 } },
      }}
    >
      {/* Ouvrir le fichier */}
      <MenuItem onClick={() => { onOpen(state.archiveId); onClose(); }}>
        <ListItemIcon><OpenInNewRoundedIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Ouvrir le fichier</ListItemText>
      </MenuItem>

      {/* Copier l'identifiant */}
      <MenuItem onClick={() => { navigator.clipboard.writeText(state.archiveId); onClose(); }}>
        <ListItemIcon><ContentCopyOutlinedIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Copier l&apos;identifiant</ListItemText>
      </MenuItem>

      {/* Télécharger */}
      <MenuItem onClick={() => { onOpen(state.archiveId); onClose(); }}>
        <ListItemIcon><FileDownloadOutlinedIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Télécharger</ListItemText>
      </MenuItem>

      {/* Dissocier — réservé aux utilisateurs avec droits d'écriture */}
      {canWrite && <Divider />}
      {canWrite && (
        <MenuItem
          onClick={() => { onUnlink(state.archiveId, state.archiveLabel); onClose(); }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon><LinkOffRoundedIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Dissocier du dossier physique</ListItemText>
        </MenuItem>
      )}
    </Menu>
  );
});

export default ArchiveContextMenu;
