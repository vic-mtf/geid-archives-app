/**
 * Formulaire générique de création d'une entité physique.
 * Supporte : Container, Shelf, Floor, Binder, Record
 *
 * Usage :
 *   <PhysicalEntityForm
 *     open={open}
 *     level="shelf"
 *     parentId={containerId}
 *     onClose={() => setOpen(false)}
 *     onSuccess={() => { setOpen(false); dispatch(incrementVersion()); }}
 *   />
 */

import { useMemo } from "react";
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
import { useSelector } from "react-redux";
import type { RootState } from "../../../redux/store";
import useAxios from "../../../hooks/useAxios";
import type { FieldValues } from "react-hook-form";

// ── Types ──────────────────────────────────────────────────

export type PhysicalLevel = "container" | "shelf" | "floor" | "binder" | "record";

interface FieldDef {
  name: string;
  label: string;
  required?: boolean;
  type?: "text" | "number" | "date";
  multiline?: boolean;
  rows?: number;
  helperText?: string;
}

interface LevelConfig {
  title: string;
  url: string;
  fields: FieldDef[];
  schema: yup.AnyObjectSchema;
  buildBody: (data: FieldValues, parentId?: string) => Record<string, unknown>;
}

// ── Configuration par niveau ────────────────────────────────

const levels: Record<PhysicalLevel, LevelConfig> = {
  container: {
    title: "Nouveau conteneur",
    url: "/api/stuff/archives/physical/containers",
    fields: [
      { name: "name", label: "Nom *", required: true },
      { name: "location", label: "Localisation" },
      { name: "description", label: "Description", multiline: true, rows: 3 },
    ],
    schema: yup.object({
      name: yup.string().trim().required("Le nom est requis"),
      location: yup.string(),
      description: yup.string(),
    }),
    buildBody: (data) => data,
  },

  shelf: {
    title: "Nouvelle étagère",
    url: "/api/stuff/archives/physical/shelves",
    fields: [
      { name: "name", label: "Nom *", required: true },
      { name: "description", label: "Description", multiline: true, rows: 2 },
    ],
    schema: yup.object({
      name: yup.string().trim().required("Le nom est requis"),
      description: yup.string(),
    }),
    buildBody: (data, parentId) => ({ ...data, container: parentId }),
  },

  floor: {
    title: "Nouvel étage",
    url: "/api/stuff/archives/physical/floors",
    fields: [
      { name: "number", label: "Numéro *", required: true, type: "number" },
      { name: "label", label: "Libellé" },
      {
        name: "administrativeUnit",
        label: "Unité administrative (ID) *",
        required: true,
        helperText: "Identifiant (_id) du rôle / unité administrative responsable",
      },
    ],
    schema: yup.object({
      number: yup.number().typeError("Doit être un nombre").required("Le numéro est requis").min(1),
      label: yup.string(),
      administrativeUnit: yup.string().trim().required("L'unité administrative est requise"),
    }),
    buildBody: (data, parentId) => ({ ...data, shelf: parentId }),
  },

  binder: {
    title: "Nouveau classeur",
    url: "/api/stuff/archives/physical/binders",
    fields: [
      { name: "name", label: "Nom *", required: true },
      { name: "nature", label: "Nature *", required: true, helperText: "Ex : RH, FINANCE, JURIDIQUE (en majuscules)" },
      { name: "maxCapacity", label: "Capacité maximale *", required: true, type: "number", helperText: "Nombre max de dossiers autorisés" },
    ],
    schema: yup.object({
      name: yup.string().trim().required("Le nom est requis"),
      nature: yup.string().trim().required("La nature est requise"),
      maxCapacity: yup.number().typeError("Doit être un nombre").required("La capacité est requise").min(1, "Minimum 1"),
    }),
    buildBody: (data, parentId) => ({ ...data, floor: parentId }),
  },

  record: {
    title: "Nouveau dossier physique",
    url: "/api/stuff/archives/physical/records",
    fields: [
      { name: "internalNumber", label: "N° interne *", required: true, helperText: "Ex : DOS-2024-0042" },
      { name: "refNumber", label: "N° référence *", required: true },
      { name: "subject", label: "Objet *", required: true },
      { name: "category", label: "Catégorie *", required: true, helperText: "Ex : Contrats, Marchés, Correspondances" },
      { name: "nature", label: "Nature *", required: true, helperText: "Doit correspondre à la nature du classeur parent" },
      { name: "editionDate", label: "Date d'édition *", required: true, type: "date" },
      { name: "archivingDate", label: "Date d'archivage *", required: true, type: "date" },
    ],
    schema: yup.object({
      internalNumber: yup.string().trim().required("Le N° interne est requis"),
      refNumber: yup.string().trim().required("Le N° référence est requis"),
      subject: yup.string().trim().required("L'objet est requis"),
      category: yup.string().trim().required("La catégorie est requise"),
      nature: yup.string().trim().required("La nature est requise"),
      editionDate: yup.string().required("La date d'édition est requise"),
      archivingDate: yup.string().required("La date d'archivage est requise"),
    }),
    buildBody: (data, parentId) => ({ ...data, binder: parentId }),
  },
};

// ── Composant principal ────────────────────────────────────

export interface PhysicalEntityFormProps {
  open: boolean;
  level: PhysicalLevel;
  parentId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PhysicalEntityForm({
  open,
  level,
  parentId,
  onClose,
  onSuccess,
}: PhysicalEntityFormProps) {
  const config = levels[level];
  const token = useSelector((store: RootState) => (store.user as Record<string, unknown>).token as string);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(config.schema),
    mode: "onTouched",
  });

  const [, execute] = useAxios(
    { url: config.url, method: "POST", headers: { Authorization: `Bearer ${token}` } },
    { manual: true }
  );

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: FieldValues) => {
    const body = config.buildBody(data, parentId);
    const snackKey = enqueueSnackbar(
      <Typography>Enregistrement en cours...</Typography>,
      { autoHideDuration: null }
    );
    try {
      await execute({ data: body });
      closeSnackbar(snackKey);
      enqueueSnackbar(<Typography>Enregistré avec succès</Typography>, { variant: "success" });
      reset();
      onSuccess();
    } catch (err: unknown) {
      closeSnackbar(snackKey);
      const msg = ((err as { response?: { data?: { error?: string } } })?.response?.data?.error) ?? "Une erreur est survenue";
      enqueueSnackbar(<Typography>{msg}</Typography>, { variant: "error" });
    }
  };

  const labelCols = useMemo<Record<string, string>>(() => ({
    container: "le conteneur",
    shelf: "l'étagère",
    floor: "l'étage",
    binder: "le classeur",
    record: "le dossier",
  }), []);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle component="div" fontWeight="bold">
        {config.title}
        {parentId && (
          <Typography variant="caption" color="text.secondary" display="block">
            Rattaché à {labelCols[level]} parent (ID : {parentId})
          </Typography>
        )}
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={2} mt={0.5}>
            {config.fields.map((field) => (
              <TextField
                key={field.name}
                {...register(field.name)}
                label={field.label}
                type={field.type ?? "text"}
                multiline={field.multiline}
                rows={field.rows}
                fullWidth
                InputLabelProps={field.type === "date" ? { shrink: true } : undefined}
                error={!!errors[field.name]}
                helperText={(errors[field.name]?.message as string) ?? field.helperText}
              />
            ))}
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
