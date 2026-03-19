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
} from "@mui/material";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useSnackbar } from "notistack";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../../redux/store";
import { incrementVersion } from "../../../redux/data";
import useAxios from "../../../hooks/useAxios";
import type { FieldValues } from "react-hook-form";
import type { ArchiveDocument } from "../../../types";

const EVENT_NAME = "__edit_archive_doc";

const schema = yup.object({
  designation: yup.string().trim().required("La désignation est requise"),
  description: yup.string().trim().required("La description est requise"),
  tags: yup.string(),
});

export default function ArchiveEditForm() {
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
        ? (data.tags as string).split(",").map((t: string) => t.trim()).filter(Boolean)
        : [],
    };
    const snackKey = enqueueSnackbar(
      <Typography>Modification en cours…</Typography>,
      { autoHideDuration: null }
    );
    try {
      await execute({ url: `/api/stuff/archives/${doc._id ?? doc.id}`, data: body });
      closeSnackbar(snackKey);
      enqueueSnackbar(<Typography>Archive modifiée avec succès</Typography>, { variant: "success" });
      dispatch(incrementVersion());
      handleClose();
    } catch (err: unknown) {
      closeSnackbar(snackKey);
      const msg =
        ((err as { response?: { data?: { error?: string } } })?.response?.data?.error) ??
        "Une erreur est survenue";
      enqueueSnackbar(<Typography>{msg}</Typography>, { variant: "error" });
    }
  };

  return (
    <Dialog open={Boolean(doc)} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle component="div" fontWeight="bold">
        Modifier l'archive
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
              label="Désignation *"
              fullWidth
              error={!!errors.designation}
              helperText={errors.designation?.message as string}
            />
            <TextField
              {...register("description")}
              label="Description *"
              fullWidth
              multiline
              rows={3}
              error={!!errors.description}
              helperText={errors.description?.message as string}
            />
            <TextField
              {...register("tags")}
              label="Mots-clés (séparés par des virgules)"
              fullWidth
              helperText="Ex : rapport, finance, 2024"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Annuler
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Enregistrer
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
