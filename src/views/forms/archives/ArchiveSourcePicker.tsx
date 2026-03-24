/**
 * ArchiveSourcePicker — Choix de la source pour ajouter une archive.
 *
 * Propose deux options :
 *   - Téléverser depuis l'appareil (ouvre ArchiveCreateDialog)
 *   - Récupérer depuis l'espace de travail (ouvre ArchivesForm avec sélecteur)
 */

import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import CloudSyncOutlinedIcon from "@mui/icons-material/CloudSyncOutlined";

const EVENT_NAME = "__open_archive_source_picker";

export default function ArchiveSourcePicker() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const root = document.getElementById("root");
    const handler = () => setOpen(true);
    root?.addEventListener(EVENT_NAME, handler);
    return () => root?.removeEventListener(EVENT_NAME, handler);
  }, []);

  const handleClose = useCallback(() => setOpen(false), []);

  const openUpload = useCallback(() => {
    setOpen(false);
    document.getElementById("root")?.dispatchEvent(
      new CustomEvent("__open_archive_create", { detail: {} })
    );
  }, []);

  const openWorkspace = useCallback(() => {
    setOpen(false);
    document.getElementById("root")?.dispatchEvent(
      new CustomEvent("__open_workspace_file_picker", { detail: {} })
    );
  }, []);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle component="div" fontWeight="bold">
        Ajouter une archive
      </DialogTitle>
      <DialogContent sx={{ pb: 2 }}>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Choisissez la source du document à archiver.
        </Typography>
        <List disablePadding>
          <ListItemButton
            onClick={openUpload}
            sx={{ borderRadius: 1.5, mb: 1, border: "1px solid", borderColor: "divider" }}
          >
            <ListItemIcon>
              <UploadFileRoundedIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Depuis mon appareil"
              secondary="Téléverser un fichier depuis votre ordinateur ou téléphone"
            />
          </ListItemButton>

          <ListItemButton
            onClick={openWorkspace}
            sx={{ borderRadius: 1.5, border: "1px solid", borderColor: "divider" }}
          >
            <ListItemIcon>
              <CloudSyncOutlinedIcon color="info" />
            </ListItemIcon>
            <ListItemText
              primary="Depuis mon espace de travail"
              secondary="Récupérer un document déjà présent dans votre espace de travail"
            />
          </ListItemButton>
        </List>
      </DialogContent>
    </Dialog>
  );
}
