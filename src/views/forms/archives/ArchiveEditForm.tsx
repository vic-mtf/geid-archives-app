import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  InputAdornment,
  Tooltip,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import i18n from "@/i18n/i18n";
import { useSnackbar } from "notistack";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { incrementVersion } from "@/redux/data";
import useAxios from "@/hooks/useAxios";
import type { FieldValues } from "react-hook-form";
import type { ArchiveDocument } from "@/types";

const EVENT_NAME = "__edit_archive_doc";

const schema = yup.object({
  designation: yup.string().trim().required(i18n.t("forms.physicalEntity.validationErrors.designationRequired")),
  description: yup.string().trim().required(i18n.t("forms.physicalEntity.validationErrors.descriptionRequired")),
  tags: yup.string(),
});

export default function ArchiveEditForm() {
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [doc, setDoc] = useState<ArchiveDocument | null>(null);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const token = useSelector((store: RootState) => (store.user as Record<string, unknown>).token as string);
  const dispatch = useDispatch<AppDispatch>();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
    mode: "onTouched",
  });

  const [, execute] = useAxios(
    { method: "PUT", headers: { Authorization: `Bearer ${token}` } },
    { manual: true }
  );

  // Écoute l'événement dispatché par managementOptions
  useEffect(() => {
    const root = document.getElementById("root");
    const handleEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ doc: ArchiveDocument }>).detail;
      if (detail?.doc) {
        setDoc(detail.doc);
      }
    };
    root?.addEventListener(EVENT_NAME, handleEvent);
    return () => root?.removeEventListener(EVENT_NAME, handleEvent);
  }, []);

  // Pré-remplir le formulaire quand doc change
  useEffect(() => {
    if (doc) {
      reset({
        designation: (doc.designation as string) ?? "",
        description: (doc.description as string) ?? "",
        tags: Array.isArray(doc.tags) ? (doc.tags as string[]).join(", ") : "",
      });
    }
  }, [doc, reset]);

  const handleClose = () => {
    reset();
    setDoc(null);
  };

  const onSubmit = async (data: FieldValues) => {
    if (!doc) return;
    const body = {
      designation: data.designation,
      description: data.description,
      tags: data.tags
        ? (data.tags as string).split(",").map((tag: string) => tag.trim()).filter(Boolean)
        : [],
    };
    const snackKey = enqueueSnackbar(t("notifications.archiveUpdatePending"), {
      autoHideDuration: null,
    });
    try {
      await execute({ url: `/api/stuff/archives/${doc._id ?? doc.id}`, data: body });
      closeSnackbar(snackKey);
      enqueueSnackbar(t("notifications.archiveUpdated"), {
        variant: "success",
        title: t("notifications.archiveUpdatedTitle"),
      });
      dispatch(incrementVersion());
      handleClose();
    } catch (err: unknown) {
      closeSnackbar(snackKey);
      const msg =
        ((err as { response?: { data?: { error?: string } } })?.response?.data?.error) ??
        t("notifications.archiveUpdateFailed");
      enqueueSnackbar(msg, { variant: "error", title: t("notifications.archiveUpdateFailedTitle") });
    }
  };

  return (
    <Dialog open={Boolean(doc)} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle component="div" fontWeight="bold">
        {t("forms.archiveEdit.title")}
        {doc?.designation && (
          <Typography variant="caption" color="text.secondary" display="block" noWrap>
            {doc.designation as string}
          </Typography>
        )}
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={2} mt={0.5}>
            <TextField
              {...register("designation")}
              label={t("forms.archiveEdit.designationLabel")}
              fullWidth
              placeholder={t("forms.archiveEdit.designationPlaceholder")}
              error={!!errors.designation}
              helperText={
                (errors.designation?.message as string) ||
                t("forms.archiveEdit.designationHelper")
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={t("forms.archiveEdit.designationHelpTooltip")} placement="top">
                      <IconButton size="small" tabIndex={-1} sx={{ color: "text.disabled" }}>
                        <HelpOutlineIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              {...register("description")}
              label={t("forms.archiveEdit.descriptionLabel")}
              fullWidth
              multiline
              rows={3}
              placeholder={t("forms.archiveEdit.descriptionPlaceholder")}
              error={!!errors.description}
              helperText={
                (errors.description?.message as string) ||
                t("forms.archiveEdit.descriptionHelper")
              }
            />
            <TextField
              {...register("tags")}
              label={t("forms.archiveEdit.tagsLabel")}
              fullWidth
              placeholder={t("forms.archiveEdit.tagsPlaceholder")}
              helperText={t("forms.archiveEdit.tagsHelper")}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            {t("common.cancel")}
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {t("common.save")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
