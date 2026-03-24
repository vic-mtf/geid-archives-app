/**
 * ArchiveContextMenu — Menu contextuel pour les archives numériques.
 *
 * Options :
 * - Ouvrir le fichier
 * - Télécharger
 * - Déplacer vers un autre document (si autorisé)
 * - Dissocier du document (si autorisé)
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
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import DriveFileMoveOutlinedIcon from "@mui/icons-material/DriveFileMoveOutlined";
import LinkOffRoundedIcon from "@mui/icons-material/LinkOffRounded";

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
  onMove: (archiveId: string, label: string) => void;
}

const ArchiveContextMenu = React.memo(function ArchiveContextMenu({
  state,
  onClose,
  canWrite,
  onOpen,
  onUnlink,
  onMove,
}: ArchiveContextMenuProps) {
  if (!state) return null;

  return (
    <Menu
      open
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={{ top: state.mouseY, left: state.mouseX }}
      slotProps={{
        paper: { sx: { minWidth: 220, borderRadius: 1.5 } },
      }}
    >
      {/* Ouvrir le fichier */}
      <MenuItem onClick={() => { onOpen(state.archiveId); onClose(); }}>
        <ListItemIcon><OpenInNewRoundedIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Ouvrir le fichier</ListItemText>
      </MenuItem>

      {/* Télécharger */}
      <MenuItem onClick={() => { onOpen(state.archiveId); onClose(); }}>
        <ListItemIcon><FileDownloadOutlinedIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Télécharger</ListItemText>
      </MenuItem>

      {/* Actions d'écriture */}
      {canWrite && <Divider />}

      {/* Déplacer vers un autre document */}
      {canWrite && (
        <MenuItem onClick={() => { onMove(state.archiveId, state.archiveLabel); onClose(); }}>
          <ListItemIcon><DriveFileMoveOutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Déplacer vers un autre document</ListItemText>
        </MenuItem>
      )}

      {/* Dissocier */}
      {canWrite && (
        <MenuItem
          onClick={() => { onUnlink(state.archiveId, state.archiveLabel); onClose(); }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon><LinkOffRoundedIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Dissocier du document</ListItemText>
        </MenuItem>
      )}
    </Menu>
  );
});

export default ArchiveContextMenu;
