import { useEffect, useState, useCallback } from "react";
import { Button, DialogTitle, Dialog, useMediaQuery, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { incrementVersion } from "@/redux/data";
import useAxios from "@/hooks/useAxios";
import FormContent from "./FormContent";
import { FieldValues } from "react-hook-form";

export default function ValidateForm() {
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
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
        t("notifications.validatePending"),
        {
          title: t("notifications.validatePendingTitle"),
          action: (id) => (
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                cancel();
                window.clearTimeout(timer);
                closeSnackbar(id);
              }}>
              {t("common.cancel")}
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
            enqueueSnackbar(t("notifications.validateSuccess"), {
              variant: "success",
              title: t("notifications.validateSuccessTitle"),
            });
          })
          .catch((err) => {
            closeSnackbar(pendingKey);
            const msg =
              (err?.response?.data?.error as string) ??
              t("notifications.validateFailed");
            enqueueSnackbar(msg, { variant: "error", title: t("notifications.validateFailedTitle") });
          });
      }, 1500);
    },
    [cancel, closeSnackbar, enqueueSnackbar, refresh, doc, dispatch, t]
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
      fullScreen={fullScreen}
      PaperProps={{
        sx: { overflow: "hidden" },
        component: "div",
      }}>
      <DialogTitle component='div' fontWeight='bold' fontSize={18}>
        {t("forms.validate.title")}
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
