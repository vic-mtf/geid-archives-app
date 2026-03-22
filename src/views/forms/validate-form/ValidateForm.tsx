import { useEffect, useState, useCallback } from "react";
import { Button, DialogTitle, Dialog } from "@mui/material";
import { useSnackbar } from "notistack";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../../redux/store";
import { incrementVersion } from "../../../redux/data";
import useAxios from "../../../hooks/useAxios";
import FormContent from "./FormContent";
import { FieldValues } from "react-hook-form";

export default function ValidateForm() {
  const [doc, setDoc] = useState<string | null>(null);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const token = useSelector((store: RootState) => (store.user as Record<string, unknown>).token as string);
  const dispatch = useDispatch<AppDispatch>();
  const [, refresh, cancel] = useAxios(
    {
      url: "/api/stuff/validate",
      method: "post",
      headers: { Authorization: `Bearer ${token}` },
    },
    { manual: true }
  );

  const handleSendDoc = useCallback(
    (fields: FieldValues) => {
      const data = {
        ...fields,
        id: doc,
      };

      const pendingKey = enqueueSnackbar(
        "Le document est en cours de validation. Vous pouvez encore annuler si vous avez fait une erreur.",
        {
          title: "Validation en cours…",
          action: (id) => (
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                cancel();
                window.clearTimeout(timer);
                closeSnackbar(id);
              }}>
              Annuler
            </Button>
          ),
          autoHideDuration: null,
        }
      );
      setDoc(null);

      const timer = window.setTimeout(() => {
        refresh({ data })
          .then(() => {
            closeSnackbar(pendingKey);
            dispatch(incrementVersion());
            enqueueSnackbar("Le document a été validé avec succès. Il entre maintenant dans le cycle de vie actif et est accessible dans la liste des archives.", {
              variant: "success",
              title: "Document validé !",
            });
          })
          .catch((err) => {
            closeSnackbar(pendingKey);
            const msg =
              (err?.response?.data?.error as string) ??
              "Une erreur est survenue. Impossible de valider ce document.";
            enqueueSnackbar(msg, { variant: "error", title: "Validation échouée — vérifiez les informations" });
          });
      }, 1500);
    },
    [cancel, closeSnackbar, enqueueSnackbar, refresh, doc, dispatch]
  );

  useEffect(() => {
    const event = "__validate_archive_doc";
    const root = document.getElementById("root");
    const handleValidationArchive = (e: Event) => {
      const { doc, name } = (e as CustomEvent).detail;
      if (event === name) setDoc(doc);
    };
    root?.addEventListener(event, handleValidationArchive);
    return () => {
      root?.removeEventListener(event, handleValidationArchive);
    };
  }, []);

  return (
    <Dialog
      open={Boolean(doc)}
      PaperProps={{
        sx: { overflow: "hidden" },
        component: "div",
      }}>
      <DialogTitle component='div' fontWeight='bold' fontSize={18}>
        Validation du document
      </DialogTitle>
      <FormContent
        onClose={(event) => {
          event.preventDefault();
          setDoc(null);
        }}
        onSubmit={handleSendDoc}
      />
    </Dialog>
  );
}
