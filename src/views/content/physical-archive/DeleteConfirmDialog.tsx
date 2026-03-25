/**
 * DeleteConfirmDialog — Dialogue de confirmation de suppression
 * pour les entites physiques (conteneur, etagere, niveau, etc.)
 */

import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

interface DeleteConfirmDialogProps {
  open: boolean;
  label: string | undefined;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmDialog = React.memo(function DeleteConfirmDialog({
  open,
  label,
  deleting,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={() => !deleting && onClose()} maxWidth="xs" fullWidth>
      <DialogTitle component="div" fontWeight="bold">
        {t("dialogs.confirmDeletion")}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" dangerouslySetInnerHTML={{ __html: t("dialogs.deleteMessage", { label }) }} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t("dialogs.deleteWarning")}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={deleting}>
          {t("common.cancel")}
        </Button>
        <Button onClick={onConfirm} variant="contained" color="error" disabled={deleting}>
          {deleting ? t("dialogs.deleting") : t("dialogs.deletePermanently")}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default DeleteConfirmDialog;
