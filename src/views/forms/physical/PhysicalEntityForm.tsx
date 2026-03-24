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


import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  Tooltip,
  IconButton,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useSnackbar } from "notistack";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import useAxios from "@/hooks/useAxios";
import type { FieldValues } from "react-hook-form";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

// ── Types ──────────────────────────────────────────────────

export type PhysicalLevel = "container" | "shelf" | "floor" | "binder" | "record" | "document";

// URL de l'entité parente par niveau (pour afficher son nom lisible)
const parentEndpoint: Partial<Record<PhysicalLevel, string>> = {
  shelf:    "/api/stuff/archives/physical/containers",
  floor:    "/api/stuff/archives/physical/shelves",
  binder:   "/api/stuff/archives/physical/floors",
  record:   "/api/stuff/archives/physical/binders",
  document: "/api/stuff/archives/physical/records",  // par défaut, document est enfant d'un record
};

// Endpoint du parent quand le parent est un document (sous-document)
const parentEndpointOverride: Partial<Record<PhysicalLevel, string>> = {
  document: "/api/stuff/archives/physical/documents",
};

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
      {
        name: "name",
        label: "Nom *",
        required: true,
        helperText: "Identifiant lisible du conteneur pour le localiser physiquement (ex : Armoire A — Bâtiment Principal)",
      },
      {
        name: "location",
        label: "Localisation",
        helperText: "Adresse précise dans les locaux (ex : Salle archives, Niveau 0, Couloir B)",
      },
      {
        name: "description",
        label: "Description",
        multiline: true,
        rows: 3,
        helperText: "Contenu prévu, restrictions d'accès ou conditions de conservation",
      },
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
      {
        name: "name",
        label: "Nom *",
        required: true,
        helperText: "Désignation de la rangée avec sa position (ex : Étagère 1 — Haut)",
      },
      {
        name: "description",
        label: "Description",
        multiline: true,
        rows: 2,
        helperText: "Description optionnelle du contenu prévu de cette rangée",
      },
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
      {
        name: "number",
        label: "Numéro *",
        required: true,
        type: "number",
        helperText: "Position sur l'étagère, commence à 1",
      },
      {
        name: "label",
        label: "Libellé",
        helperText: "Description libre de ce compartiment (ex : Dossiers actifs 2023-2024)",
      },
    ],
    schema: yup.object({
      number: yup.number().typeError("Doit être un nombre").required("Le numéro est requis").min(1),
      label: yup.string(),
    }),
    buildBody: (data, parentId) => ({ ...data, shelf: parentId }),
  },

  binder: {
    title: "Nouveau classeur",
    url: "/api/stuff/archives/physical/binders",
    fields: [
      {
        name: "name",
        label: "Nom *",
        required: true,
        helperText: "Titre du classeur permettant d'identifier rapidement son contenu",
      },
      {
        name: "nature",
        label: "Nature *",
        required: true,
        helperText: "Catégorie thématique en MAJUSCULES — détermine les dossiers autorisés (ex : RH, FINANCE, JURIDIQUE)",
      },
      {
        name: "maxCapacity",
        label: "Capacité maximale *",
        required: true,
        type: "number",
        helperText: "Nombre maximum de dossiers pouvant être rangés dans ce classeur",
      },
    ],
    schema: yup.object({
      name: yup.string().trim().required("Le nom est requis"),
      nature: yup.string().trim().required("La nature est requise"),
      maxCapacity: yup.number().typeError("Doit être un nombre").required("La capacité est requise").min(1, "Minimum 1"),
    }),
    buildBody: (data, parentId) => ({ ...data, floor: parentId }),
  },

  record: {
    title: "Nouveau dossier",
    url: "/api/stuff/archives/physical/records",
    fields: [
      {
        name: "internalNumber",
        label: "N° interne *",
        required: true,
        helperText: "Code unique attribué par le service d'archives (ex : DOS-2024-0042)",
      },
      {
        name: "refNumber",
        label: "N° référence *",
        required: true,
        helperText: "Référence croisée avec votre GED ou ERP (ex : REF-DRH-042)",
      },
      {
        name: "subject",
        label: "Objet *",
        required: true,
        helperText: "Intitulé précis décrivant le contenu principal du dossier",
      },
      {
        name: "category",
        label: "Catégorie *",
        required: true,
        helperText: "Famille documentaire pour le filtrage et les statistiques (ex : Contrats, Marchés)",
      },
      {
        name: "nature",
        label: "Nature *",
        required: true,
        helperText: "Doit correspondre exactement à la nature du classeur parent (en MAJUSCULES)",
      },
      { name: "editionDate", label: "Date d'édition *", required: true, type: "date", helperText: "Date à laquelle le document original a été produit ou signé" },
      { name: "archivingDate", label: "Date d'archivage *", required: true, type: "date", helperText: "Date d'intégration physique aux archives (généralement aujourd'hui)" },
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

  document: {
    title: "Nouveau document",
    url: "/api/stuff/archives/physical/documents",
    fields: [
      {
        name: "title",
        label: "Titre *",
        required: true,
        helperText: "Intitulé du document (ex : Contrat de travail, PV de réunion)",
      },
      {
        name: "description",
        label: "Description",
        multiline: true,
        rows: 2,
        helperText: "Description du contenu du document",
      },
      {
        name: "nature",
        label: "Nature",
        helperText: "Type de document en MAJUSCULES (ex : CONTRAT, PV, FACTURE)",
      },
      {
        name: "documentDate",
        label: "Date du document",
        type: "date",
        helperText: "Date figurant sur le document original",
      },
    ],
    schema: yup.object({
      title: yup.string().trim().required("Le titre est requis"),
      description: yup.string(),
      nature: yup.string(),
      documentDate: yup.string(),
    }),
    buildBody: (data, parentId) => ({ ...data, record: parentId }),
  },
};

// ── Composant principal ────────────────────────────────────

export interface PhysicalEntityFormProps {
  open: boolean;
  level: PhysicalLevel;
  parentId?: string;
  /** Niveau du parent (pour les sous-documents : parentLevel="document") */
  parentLevel?: PhysicalLevel;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PhysicalEntityForm({
  open,
  level,
  parentId,
  parentLevel,
  onClose,
  onSuccess,
}: PhysicalEntityFormProps) {
  const config = levels[level];
  const token = useSelector((store: RootState) => (store.user as Record<string, unknown>).token as string);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(config.schema),
    mode: "onTouched",
  });

  const [, execute] = useAxios(
    { url: config.url, method: "POST", headers: { Authorization: `Bearer ${token}` } },
    { manual: true }
  );

  // Résolution du nom lisible du parent
  const resolvedParentEndpoint = (level === "document" && parentLevel === "document")
    ? parentEndpointOverride.document
    : parentEndpoint[level];
  const parentUrl = parentId && resolvedParentEndpoint
    ? `${resolvedParentEndpoint}/${parentId}`
    : null;
  const [{ data: parentData }] = useAxios<Record<string, unknown>>(
    { url: parentUrl!, headers: { Authorization: `Bearer ${token}` } },
    { manual: !parentUrl }
  );
  const parentName = parentData?.name as string | undefined
    ?? parentData?.title as string | undefined
    ?? parentData?.internalNumber as string | undefined
    ?? (parentData?.number !== undefined ? `Niveau ${parentData.number}` : undefined)
    ?? "";

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: FieldValues) => {
    let body = config.buildBody(data, parentId);
    // Sous-document : remplacer record par parent quand le parent est un document
    if (level === "document" && parentLevel === "document" && parentId) {
      const { record: _unused, ...rest } = body as Record<string, unknown>;
      body = { ...rest, parent: parentId };
    }
    const levelNames: Record<PhysicalLevel, string> = {
      container: "conteneur",
      shelf:     "étagère",
      floor:     "niveau",
      binder:    "classeur",
      record:    "dossier",
      document:  "document",
    };
    const levelName = levelNames[level] ?? "élément";
    const snackKey = enqueueSnackbar(`Création du ${levelName} en cours, veuillez patienter…`, {
      autoHideDuration: null,
    });
    try {
      await execute({ data: body });
      closeSnackbar(snackKey);
      enqueueSnackbar(`Le ${levelName} a été créé et ajouté à l'inventaire physique. Vous pouvez maintenant y rattacher des archives ou y ajouter des sous-éléments.`, {
        variant: "success",
        title: `${levelName.charAt(0).toUpperCase() + levelName.slice(1)} créé avec succès`,
      });
      reset();
      onSuccess();
    } catch (err: unknown) {
      closeSnackbar(snackKey);
      const msg =
        ((err as { response?: { data?: { error?: string } } })?.response?.data?.error) ??
        `La création du ${levelName} a échoué. Vérifiez les informations saisies et réessayez.`;
      enqueueSnackbar(msg, { variant: "error", title: `Impossible de créer le ${levelName}` });
    }
  };

  // Label du niveau PARENT — avec article contracté correct
  const parentLevelLabel: Partial<Record<PhysicalLevel, string>> = {
    shelf:    "au conteneur",
    floor:    "à l'étagère",
    binder:   "au niveau",
    record:   "au classeur",
    document: "au dossier",
  };

  // Sections du guide par niveau
  const guideSection: Partial<Record<PhysicalLevel, string>> = {
    container: "conteneur",
    shelf: "etagere",
    floor: "etage",
    binder: "classeur",
    record: "dossier-physique",
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle component="div" fontWeight="bold">
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <span>{config.title}</span>
          <Tooltip title="Voir le guide utilisateur pour ce type d'élément" placement="top">
            <IconButton
              size="small"
              tabIndex={-1}
              sx={{ color: "text.disabled", "&:hover": { color: "primary.main" } }}
              onClick={() => {
                // Naviguer vers l'onglet aide avec la section correspondante
                const event = new CustomEvent("__navigate_help", {
                  detail: { section: guideSection[level] },
                });
                document.getElementById("root")?.dispatchEvent(event);
              }}>
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
        {parentId && (
          <Typography variant="caption" color="text.secondary" display="block">
            Rattaché {parentLevelLabel[level] ?? "à l'élément parent"}{parentName ? <> : <strong>{parentName}</strong></> : null}
          </Typography>
        )}
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={2} mt={0.5}>
            {config.fields.map((field) =>
              field.type === "date" ? (
                <Controller
                  key={field.name}
                  name={field.name}
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <DatePicker
                      label={field.label}
                      value={value ? dayjs(value as string) : null}
                      onChange={(v) => onChange(v ? v.format("YYYY-MM-DD") : "")}
                      format="DD/MM/YYYY"
                      slotProps={{
                        textField: {
                          size: "medium",
                          fullWidth: true,
                          error: !!errors[field.name],
                          helperText: (errors[field.name]?.message as string) ?? field.helperText,
                        },
                      }}
                    />
                  )}
                />
              ) : (
                <TextField
                  key={field.name}
                  {...register(field.name)}
                  label={field.label}
                  type={field.type ?? "text"}
                  size="medium"
                  multiline={field.multiline}
                  rows={field.rows}
                  fullWidth
                  error={!!errors[field.name]}
                  helperText={(errors[field.name]?.message as string) ?? field.helperText}
                />
              )
            )}
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
