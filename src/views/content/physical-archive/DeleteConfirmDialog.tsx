/**
 * DeleteConfirmDialog — Dialogue de confirmation de suppression
 * pour les entites physiques (conteneur, etagere, niveau, etc.)
 */

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

export default function DeleteConfirmDialog({
  open,
  label,
  deleting,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={() => !deleting && onClose()} maxWidth="xs" fullWidth>
      <DialogTitle component="div" fontWeight="bold">
        Confirmer la suppression
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          Êtes-vous sûr de vouloir supprimer <strong>« {label} »</strong> ?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Cette action est définitive et ne peut pas être annulée. Si cet élément contient des sous-éléments, vous devrez les supprimer d&apos;abord.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={deleting}>
          Annuler
        </Button>
        <Button onClick={onConfirm} variant="contained" color="error" disabled={deleting}>
          {deleting ? "Suppression en cours\u2026" : "Supprimer définitivement"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
