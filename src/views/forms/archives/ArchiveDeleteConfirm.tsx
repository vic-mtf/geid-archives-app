import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
// Typography est utilisé dans le corps du Dialog
import { useSnackbar } from "notistack";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../../redux/store";
import { incrementVersion } from "../../../redux/data";
import useAxios from "../../../hooks/useAxios";

const EVENT_NAME = "__delete_archive_docs";

export default function ArchiveDeleteConfirm() {
  const [ids, setIds] = useState<(string | number)[]>([]);
  const { enqueueSnackbar } = useSnackbar();
  const token = useSelector((store: RootState) => (store.user as Record<string, unknown>).token as string);
  const dispatch = useDispatch<AppDispatch>();

  const [, execute] = useAxios(
    { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
    { manual: true }
  );

  useEffect(() => {
    const root = document.getElementById("root");
    const handleEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ ids: (string | number)[] }>).detail;
      if (detail?.ids?.length) setIds(detail.ids);
    };
    root?.addEventListener(EVENT_NAME, handleEvent);
    return () => root?.removeEventListener(EVENT_NAME, handleEvent);
  }, []);

  const handleClose = () => setIds([]);

  const handleConfirm = async () => {
    const count = ids.length;
    const key = enqueueSnackbar("Suppression en cours, veuillez patienter…", {
      autoHideDuration: null,
    });
    try {
      await Promise.all(
        ids.map((id) => execute({ url: `/api/stuff/archives/${id}` }))
      );
      enqueueSnackbar(
        count > 1
          ? `Les ${count} archives sélectionnées ont été supprimées.`
          : "L'archive a été supprimée définitivement.",
        { variant: "success", title: count > 1 ? "Suppression réussie" : "Supprimé" }
      );
      dispatch(incrementVersion());
      handleClose();
    } catch {
      enqueueSnackbar(
        "La suppression a échoué. Vérifiez votre connexion et réessayez.",
        { variant: "error", title: "Erreur" }
      );
    } finally {
      enqueueSnackbar("", { key, persist: false });
    }
  };

  return (
    <Dialog open={ids.length > 0} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle component="div" fontWeight="bold">
        Confirmer la suppression
      </DialogTitle>
      <DialogContent>
        <Typography>
          {ids.length > 1
            ? `Supprimer les ${ids.length} archives sélectionnées ?`
            : "Supprimer cette archive ? Cette action est irréversible."}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Annuler
        </Button>
        <Button onClick={handleConfirm} variant="contained" color="error">
          Supprimer
        </Button>
      </DialogActions>
    </Dialog>
  );
}
