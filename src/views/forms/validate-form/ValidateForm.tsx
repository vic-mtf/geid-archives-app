import { useEffect, useState, useCallback } from "react";
import { Button, DialogTitle, Dialog } from "@mui/material";
import { useSnackbar } from "notistack";
import { useSelector } from "react-redux";
import type { RootState } from "../../../redux/store";
import useAxios from "../../../hooks/useAxios";
import FormContent from "./FormContent";
import { FieldValues } from "react-hook-form";

export default function ValidateForm() {
  const [doc, setDoc] = useState<string | null>(null);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const token = useSelector((store: RootState) => (store.user as Record<string, unknown>).token as string);
  const [, refresh, cancel] = useAxios(
    {
      url: "api/stuff/validate",
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

      const timer = window.setTimeout(() => {
        refresh({ data })
          .then(() => {
            closeSnackbar();
            enqueueSnackbar({
              variant: "success",
            } as unknown as Parameters<typeof enqueueSnackbar>[0]);
          })
          .catch(() => {
            closeSnackbar();
            enqueueSnackbar({
              variant: "error",
            } as unknown as Parameters<typeof enqueueSnackbar>[0]);
          });
      }, 3000);
      enqueueSnackbar({
        message: "Validation du document en cours...",
        action: ({ id }: { id: string | number }) => (
          <Button
            color='inherit'
            onClick={() => {
              cancel();
              window.clearTimeout(timer);
              closeSnackbar(id);
            }}>
            Annuler
          </Button>
        ),
        autoHideDuration: null,
      } as unknown as Parameters<typeof enqueueSnackbar>[0]);
      setDoc(null);
    },
    [cancel, closeSnackbar, enqueueSnackbar, refresh, doc]
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
