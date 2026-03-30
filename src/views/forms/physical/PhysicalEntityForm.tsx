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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import i18n from "@/i18n/i18n";
import { useSnackbar } from "notistack";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import useAxios from "@/hooks/useAxios";
import { useNavigate, useLocation } from "react-router-dom";
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
    title: i18n.t("forms.physicalEntity.container.title"),
    url: "/api/stuff/archives/physical/containers",
    fields: [
      {
        name: "name",
        label: i18n.t("forms.physicalEntity.container.nameLabel"),
        required: true,
        helperText: i18n.t("forms.physicalEntity.container.nameHelper"),
      },
      {
        name: "location",
        label: i18n.t("forms.physicalEntity.container.locationLabel"),
        helperText: i18n.t("forms.physicalEntity.container.locationHelper"),
      },
      {
        name: "description",
        label: i18n.t("forms.physicalEntity.container.descriptionLabel"),
        multiline: true,
        rows: 3,
        helperText: i18n.t("forms.physicalEntity.container.descriptionHelper"),
      },
    ],
    schema: yup.object({
      name: yup.string().trim().required(i18n.t("forms.physicalEntity.validationErrors.nameRequired")),
      location: yup.string(),
      description: yup.string(),
    }),
    buildBody: (data) => data,
  },

  shelf: {
    title: i18n.t("forms.physicalEntity.shelf.title"),
    url: "/api/stuff/archives/physical/shelves",
    fields: [
      {
        name: "name",
        label: i18n.t("forms.physicalEntity.shelf.nameLabel"),
        required: true,
        helperText: i18n.t("forms.physicalEntity.shelf.nameHelper"),
      },
      {
        name: "description",
        label: i18n.t("forms.physicalEntity.shelf.descriptionLabel"),
        multiline: true,
        rows: 2,
        helperText: i18n.t("forms.physicalEntity.shelf.descriptionHelper"),
      },
    ],
    schema: yup.object({
      name: yup.string().trim().required(i18n.t("forms.physicalEntity.validationErrors.nameRequired")),
      description: yup.string(),
    }),
    buildBody: (data, parentId) => ({ ...data, container: parentId }),
  },

  floor: {
    title: i18n.t("forms.physicalEntity.floor.title"),
    url: "/api/stuff/archives/physical/floors",
    fields: [
      {
        name: "number",
        label: i18n.t("forms.physicalEntity.floor.numberLabel"),
        required: true,
        type: "number",
        helperText: i18n.t("forms.physicalEntity.floor.numberHelper"),
      },
      {
        name: "label",
        label: i18n.t("forms.physicalEntity.floor.labelLabel"),
        helperText: i18n.t("forms.physicalEntity.floor.labelHelper"),
      },
    ],
    schema: yup.object({
      number: yup.number().typeError(i18n.t("forms.physicalEntity.validationErrors.mustBeNumber")).required(i18n.t("forms.physicalEntity.validationErrors.numberRequired")).min(1),
      label: yup.string(),
    }),
    buildBody: (data, parentId) => ({ ...data, shelf: parentId }),
  },

  binder: {
    title: i18n.t("forms.physicalEntity.binder.title"),
    url: "/api/stuff/archives/physical/binders",
    fields: [
      {
        name: "name",
        label: i18n.t("forms.physicalEntity.binder.nameLabel"),
        required: true,
        helperText: i18n.t("forms.physicalEntity.binder.nameHelper"),
      },
      {
        name: "nature",
        label: i18n.t("forms.physicalEntity.binder.natureLabel"),
        required: true,
        helperText: i18n.t("forms.physicalEntity.binder.natureHelper"),
      },
      {
        name: "maxCapacity",
        label: i18n.t("forms.physicalEntity.binder.maxCapacityLabel"),
        required: true,
        type: "number",
        helperText: i18n.t("forms.physicalEntity.binder.maxCapacityHelper"),
      },
    ],
    schema: yup.object({
      name: yup.string().trim().required(i18n.t("forms.physicalEntity.validationErrors.nameRequired")),
      nature: yup.string().trim().required(i18n.t("forms.physicalEntity.validationErrors.natureRequired")),
      maxCapacity: yup.number().typeError(i18n.t("forms.physicalEntity.validationErrors.mustBeNumber")).required(i18n.t("forms.physicalEntity.validationErrors.capacityRequired")).min(1, i18n.t("forms.physicalEntity.validationErrors.capacityMin")),
    }),
    buildBody: (data, parentId) => ({ ...data, floor: parentId }),
  },

  record: {
    title: i18n.t("forms.physicalEntity.record.title"),
    url: "/api/stuff/archives/physical/records",
    fields: [
      {
        name: "internalNumber",
        label: i18n.t("forms.physicalEntity.record.internalNumberLabel"),
        required: true,
        helperText: i18n.t("forms.physicalEntity.record.internalNumberHelper"),
      },
      {
        name: "refNumber",
        label: i18n.t("forms.physicalEntity.record.refNumberLabel"),
        required: true,
        helperText: i18n.t("forms.physicalEntity.record.refNumberHelper"),
      },
      {
        name: "subject",
        label: i18n.t("forms.physicalEntity.record.subjectLabel"),
        required: true,
        helperText: i18n.t("forms.physicalEntity.record.subjectHelper"),
      },
      {
        name: "category",
        label: i18n.t("forms.physicalEntity.record.categoryLabel"),
        required: true,
        helperText: i18n.t("forms.physicalEntity.record.categoryHelper"),
      },
      { name: "editionDate", label: i18n.t("forms.physicalEntity.record.editionDateLabel"), required: true, type: "date", helperText: i18n.t("forms.physicalEntity.record.editionDateHelper") },
      { name: "archivingDate", label: i18n.t("forms.physicalEntity.record.archivingDateLabel"), required: true, type: "date", helperText: i18n.t("forms.physicalEntity.record.archivingDateHelper") },
    ],
    schema: yup.object({
      internalNumber: yup.string().trim().required(i18n.t("forms.physicalEntity.validationErrors.internalNumberRequired")),
      refNumber: yup.string().trim().required(i18n.t("forms.physicalEntity.validationErrors.refNumberRequired")),
      subject: yup.string().trim().required(i18n.t("forms.physicalEntity.validationErrors.subjectRequired")),
      category: yup.string().trim().required(i18n.t("forms.physicalEntity.validationErrors.categoryRequired")),
      editionDate: yup.string().required(i18n.t("forms.physicalEntity.validationErrors.editionDateRequired")),
      archivingDate: yup.string().required(i18n.t("forms.physicalEntity.validationErrors.archivingDateRequired")),
    }),
    // nature injectée automatiquement depuis le classeur parent dans onSubmit
    buildBody: (data, parentId) => ({ ...data, binder: parentId }),
  },

  document: {
    title: i18n.t("forms.physicalEntity.document.title"),
    url: "/api/stuff/archives/physical/documents",
    fields: [
      {
        name: "title",
        label: i18n.t("forms.physicalEntity.document.titleLabel"),
        required: true,
        helperText: i18n.t("forms.physicalEntity.document.titleHelper"),
      },
      {
        name: "description",
        label: i18n.t("forms.physicalEntity.document.descriptionLabel"),
        multiline: true,
        rows: 2,
        helperText: i18n.t("forms.physicalEntity.document.descriptionHelper"),
      },
      {
        name: "nature",
        label: i18n.t("forms.physicalEntity.document.natureLabel"),
        helperText: i18n.t("forms.physicalEntity.document.natureHelper"),
      },
      {
        name: "documentDate",
        label: i18n.t("forms.physicalEntity.document.documentDateLabel"),
        type: "date",
        helperText: i18n.t("forms.physicalEntity.document.documentDateHelper"),
      },
    ],
    schema: yup.object({
      title: yup.string().trim().required(i18n.t("forms.physicalEntity.validationErrors.titleRequired")),
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
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const config = levels[level];
  const token = useSelector((store: RootState) => (store.user as Record<string, unknown>).token as string);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const location = useLocation();

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

  // Nature du classeur parent — injectée automatiquement dans le body pour les dossiers
  const binderNature = level === "record" ? (parentData?.nature as string | undefined) : undefined;

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: FieldValues) => {
    let body = config.buildBody(data, parentId);
    // Document dans un document : envoyer parent + record du document parent
    if (level === "document" && parentLevel === "document" && parentId) {
      const rawRecord = parentData?.record;
      const parentRecord = typeof rawRecord === "string"
        ? rawRecord
        : (rawRecord as { _id?: string })?._id ?? undefined;
      const { record: _unused, ...rest } = body as Record<string, unknown>;
      body = { ...rest, parent: parentId, record: parentRecord };
    }
    // Dossier : injecter la nature du classeur parent automatiquement
    if (level === "record" && binderNature) {
      body = { ...body, nature: binderNature };
    }
    const levelName = t(`physical.levelsLower.${level}`) ?? level;
    const snackKey = enqueueSnackbar(t("notifications.physicalCreatePending", { level: levelName }), {
      autoHideDuration: null,
    });
    try {
      await execute({ data: body });
      closeSnackbar(snackKey);
      enqueueSnackbar(t("notifications.physicalCreated", { level: levelName }), {
        variant: "success",
        title: t("notifications.physicalCreatedTitle", { level: levelName.charAt(0).toUpperCase() + levelName.slice(1) }),
      });
      reset();
      onSuccess();
    } catch (err: unknown) {
      closeSnackbar(snackKey);
      const msg =
        ((err as { response?: { data?: { error?: string } } })?.response?.data?.error) ??
        t("notifications.physicalCreateFailed", { level: levelName });
      enqueueSnackbar(msg, { variant: "error", title: t("notifications.physicalCreateFailedTitle", { level: levelName }) });
    }
  };

  // Label du niveau PARENT — avec article contracté correct
  const parentLevelLabels: Partial<Record<PhysicalLevel, string>> = {
    shelf:    t("forms.physicalEntity.parentLabel.shelf"),
    floor:    t("forms.physicalEntity.parentLabel.floor"),
    binder:   t("forms.physicalEntity.parentLabel.binder"),
    record:   t("forms.physicalEntity.parentLabel.record"),
    document: t("forms.physicalEntity.parentLabel.document"),
  };
  // Si on crée un document dans un document, le parent est un document, pas un dossier
  const resolvedParentLabel = (level === "document" && parentLevel === "document")
    ? t("forms.physicalEntity.parentLabel.documentInDocument")
    : parentLevelLabels[level];

  // Sections du guide par niveau — IDs correspondant aux sections de HelpContent
  const guideSection: Partial<Record<PhysicalLevel, string>> = {
    container: "hierarchie-physique",
    shelf: "hierarchie-physique",
    floor: "hierarchie-physique",
    binder: "hierarchie-physique",
    record: "rattachement",
    document: "rattachement",
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={fullScreen} BackdropProps={{ sx: { bgcolor: (theme: any) => theme.palette.background.paper + theme.customOptions.opacity, backdropFilter: (theme: any) => `blur(${theme.customOptions.blur})` } }} PaperProps={{ sx: { border: 1, borderColor: "divider" } }}>
      <DialogTitle component="div" fontWeight="bold">
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <span>{config.title}</span>
          <Tooltip title={t("forms.physicalEntity.guideTooltip")} placement="top">
            <IconButton
              size="small"
              tabIndex={-1}
              sx={{ color: "text.disabled", "&:hover": { color: "primary.main" } }}
              onClick={() => {
                // Naviguer vers l'onglet aide avec la section correspondante
                const sectionId = guideSection[level];
                const state = {
                  ...(location.state ?? {}),
                  navigation: {
                    ...((location.state as Record<string, unknown>)?.navigation ?? {}),
                    tabs: { option: "help" },
                  },
                  helpAnchor: sectionId ?? null,
                };
                navigate(location.pathname, { state });
              }}>
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
        {parentId && (
          <Typography variant="caption" color="text.secondary" display="block">
            {t("forms.physicalEntity.attachedTo", { parentLabel: resolvedParentLabel ?? "à l'élément parent" })}{parentName && <> : <strong>{parentName}</strong></>}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent dividers sx={{ maxHeight: "65vh", overflowY: "auto" }}>
        <form id="physical-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2}>
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
        </form>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          {t("common.cancel")}
        </Button>
        <Button type="submit" form="physical-form" variant="contained" disabled={isSubmitting}>
          {t("common.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
