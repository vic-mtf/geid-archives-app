/**
 * ArchiveSourcePicker — Choix de la source pour ajouter une archive.
 *
 * Propose deux options :
 *   - Téléverser depuis l'appareil (ouvre ArchiveCreateDialog)
 *   - Récupérer depuis l'espace personnel (ouvre ArchivesForm avec sélecteur)
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import CloudSyncOutlinedIcon from "@mui/icons-material/CloudSyncOutlined";
import { useTranslation } from "react-i18next";

const EVENT_NAME = "__open_archive_source_picker";

const ArchiveSourcePicker = React.memo(function ArchiveSourcePicker() {
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
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
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth fullScreen={fullScreen}>
      <DialogTitle component="div" fontWeight="bold">
        {t("forms.archiveSource.title")}
      </DialogTitle>
      <DialogContent sx={{ pb: 2 }}>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {t("forms.archiveSource.chooseSource")}
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
              primary={t("forms.archiveSource.fromDevice")}
              secondary={t("forms.archiveSource.fromDeviceDesc")}
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
              primary={t("forms.archiveSource.fromWorkspace")}
              secondary={t("forms.archiveSource.fromWorkspaceDesc")}
            />
          </ListItemButton>
        </List>
      </DialogContent>
    </Dialog>
  );
});

export default ArchiveSourcePicker;
