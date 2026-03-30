/**
 * ArchiveCreateDialog — Creer une archive depuis l'appareil ou l'espace personnel.
 *
 * - Validation useForm + yup (erreurs sous chaque champ)
 * - Pre-remplissage depuis les metadonnees du fichier workspace
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import FileTypeIcon from "@/components/FileTypeIcon";
import getFileExtension from "@/utils/getFileExtention";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import { incrementVersion } from "@/redux/data";
import Typology from "./Typology";

function formatSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} octets`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

const EVENT_NAME = "__open_archive_create";

const schema = yup.object({
  designation: yup.string().trim().required("Veuillez renseigner la designation."),
  description: yup.string().trim().required("Veuillez renseigner la description."),
  refNumber: yup.string().trim().required("Veuillez renseigner le numero de reference."),
});

type FormData = yup.InferType<typeof schema>;

export default function ArchiveCreateDialog() {
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [wsFile, setWsFile] = useState<any>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [typeError, setTypeError] = useState("");

  const token = useSelector((store: RootState) => (store.user as Record<string, unknown>).token as string);
  const dispatch = useDispatch<AppDispatch>();
  const { enqueueSnackbar } = useSnackbar();

  const typeRef = useRef<string | null | undefined>(null);
  const subTypeRef = useRef<string | null | undefined>(null);
  const [defaultType, setDefaultType] = useState<string | null>(null);
  const [defaultSubType, setDefaultSubType] = useState<string | null>(null);
  // Key pour forcer le re-mount de Typology quand les defaults changent
  const [typologyKey, setTypologyKey] = useState(0);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
    mode: "onTouched",
  });

  const watchDesignation = watch("designation");
  const watchDescription = watch("description");
  const watchRefNumber = watch("refNumber");

  const resetAll = useCallback(() => {
    setFile(null); setWsFile(null); setDragging(false);
    setFileError(""); setTypeError("");
    typeRef.current = null; subTypeRef.current = null;
    setDefaultType(null); setDefaultSubType(null);
    setTypologyKey((k) => k + 1);
    reset({ designation: "", description: "", refNumber: "" });
  }, [reset]);

  useEffect(() => {
    const root = document.getElementById("root");
    const handler = () => { setOpen(true); resetAll(); };
    root?.addEventListener(EVENT_NAME, handler);
    return () => root?.removeEventListener(EVENT_NAME, handler);
  }, [resetAll]);

  // Retour du WorkspaceFilePicker — pre-remplir
  useEffect(() => {
    const root = document.getElementById("root");
    const handler = (e: any) => {
      const f = e.detail?.file;
      if (!f) return;
      setWsFile(f); setFile(null); setFileError("");
      // Pre-remplir : designation depuis metadata ou nom du fichier (sans extension)
      const nameWithoutExt = (f.name || "").replace(/\.[^.]+$/, "").replace(/_/g, " ");
      setValue("designation", f.designation || nameWithoutExt, { shouldDirty: true, shouldTouch: true });
      setValue("description", f.description || "", { shouldDirty: true, shouldTouch: true });
      if (f.docType) { setDefaultType(f.docType); typeRef.current = f.docType; }
      if (f.docSubType) { setDefaultSubType(f.docSubType); subTypeRef.current = f.docSubType; }
      setTypologyKey((k) => k + 1);
    };
    root?.addEventListener("__workspace_file_selected", handler);
    return () => root?.removeEventListener("__workspace_file_selected", handler);
  }, [setValue]);

  const handleClose = () => { if (!loading) { setOpen(false); resetAll(); } };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) { setFile(dropped); setWsFile(null); setFileError(""); }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) { setFile(picked); setWsFile(null); setFileError(""); }
  }, []);

  const openWorkspacePicker = useCallback(() => {
    document.getElementById("root")?.dispatchEvent(new CustomEvent("__open_workspace_file_picker_for_create"));
  }, []);

  const selectedName = file?.name || wsFile?.name || null;

  const onSubmit = async (data: FormData) => {
    if (!file && !wsFile) { setFileError(t("forms.archiveCreate.errorNoFile")); return; }
    if (!typeRef.current) { setTypeError(t("forms.archiveCreate.errorNoType")); return; }

    setLoading(true); setFileError(""); setTypeError("");

    try {
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("designation", data.designation);
        formData.append("description", data.description);
        formData.append("type", typeRef.current);
        if (subTypeRef.current) formData.append("subtype", subTypeRef.current);
        if (data.refNumber?.trim()) formData.append("refNumber", data.refNumber.trim());

        const res = await fetch(`${import.meta.env.VITE_SERVER_BASE_URL ?? ""}/api/stuff/archives/upload`, {
          method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData,
        });
        if (!res.ok) {
          if (res.status === 413) throw new Error(t("notifications.errorFileTooLarge"));
          throw new Error(t("notifications.archiveCreateFailed"));
        }
      } else if (wsFile) {
        const res = await fetch(`${import.meta.env.VITE_SERVER_BASE_URL ?? ""}/api/stuff/archives`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            doc: wsFile._id,
            designation: data.designation, description: data.description,
            type: { type: typeRef.current, subType: subTypeRef.current || undefined },
            refNumber: data.refNumber?.trim() || undefined,
          }),
        });
        if (!res.ok) throw new Error(t("notifications.archiveCreateFailed"));
      }

      dispatch(incrementVersion());
      enqueueSnackbar(t("notifications.archiveCreated", { name: data.designation }), { variant: "success" });
      handleClose();
    } catch (err: unknown) {
      const msg = (err as Error).message;
      enqueueSnackbar(!navigator.onLine ? t("notifications.errorNoConnection") : msg, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={fullScreen}
      BackdropProps={{ sx: { bgcolor: (th: any) => th.palette.background.paper + th.customOptions.opacity, backdropFilter: (th: any) => `blur(${th.customOptions.blur})` } }}
      PaperProps={{ sx: { border: 1, borderColor: "divider" } }}
    >
      <DialogTitle component="div" fontWeight="bold">
        {t("forms.archiveCreate.title")}
        <Typography variant="caption" color="text.secondary" display="block">
          {t("forms.archiveCreate.subtitle")}
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={2}>
            {selectedName ? (
              <Box sx={{ border: 2, borderColor: "success.main", borderRadius: 2, p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <FileTypeIcon extension={getFileExtension(selectedName) || "txt"} size={28} />
                  <Stack spacing={0}>
                    <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 250 }}>{selectedName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {wsFile ? "Espace personnel · " : ""}{formatSize(file?.size || wsFile?.size)}
                    </Typography>
                  </Stack>
                </Stack>
                <Button size="small" color="inherit" onClick={() => { setFile(null); setWsFile(null); }}>{t("common.change")}</Button>
              </Box>
            ) : (
              <Stack spacing={1}>
                <Box
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => document.getElementById("archive-file-input")?.click()}
                  sx={{
                    border: 2, borderStyle: "dashed",
                    borderColor: fileError ? "error.main" : dragging ? "primary.main" : "divider",
                    borderRadius: 2, p: 2.5, textAlign: "center", cursor: "pointer",
                    bgcolor: dragging ? "action.hover" : "background.default", transition: "all .2s",
                    "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
                  }}
                >
                  <input id="archive-file-input" type="file" hidden onChange={handleFileInput} />
                  <UploadFileOutlinedIcon sx={{ color: "text.disabled", fontSize: 32 }} />
                  <Typography variant="body2" color="text.secondary" mt={0.5}>{t("forms.archiveCreate.dropZone")}</Typography>
                </Box>
                {fileError && <Typography variant="caption" color="error.main" sx={{ ml: 1.5 }}>{fileError}</Typography>}

                <Divider><Typography variant="caption" color="text.disabled">{t("common.or")}</Typography></Divider>

                <Button variant="outlined" color="inherit" startIcon={<FolderRoundedIcon sx={{ color: "warning.main" }} />}
                  onClick={openWorkspacePicker} sx={{ textTransform: "none", py: 1.5, borderStyle: "dashed" }}
                >
                  {t("forms.archiveSource.fromWorkspace")}
                </Button>
              </Stack>
            )}

            <TextField
              {...register("designation")}
              value={watchDesignation || ""}
              label={t("forms.archiveCreate.designationLabel")}
              fullWidth size="small" required
              InputLabelProps={{ shrink: !!watchDesignation }}
              placeholder={t("forms.archiveCreate.designationPlaceholder")}
              error={!!errors.designation}
              helperText={errors.designation?.message || t("forms.archiveCreate.designationHelper")}
            />

            <TextField
              {...register("refNumber")}
              value={watchRefNumber || ""}
              label={t("forms.archiveCreate.refNumberLabel")}
              fullWidth size="small" required
              InputLabelProps={{ shrink: !!watchRefNumber }}
              placeholder={t("forms.archiveCreate.refNumberPlaceholder")}
              error={!!errors.refNumber}
              helperText={errors.refNumber?.message}
            />

            <Typology key={typologyKey} type={typeRef} subType={subTypeRef} defaultType={defaultType} defaultSubType={defaultSubType} />
            {typeError && <Typography variant="caption" color="error.main" sx={{ mt: -1, ml: 1.5 }}>{typeError}</Typography>}

            <TextField
              {...register("description")}
              value={watchDescription || ""}
              label={t("forms.archiveCreate.descriptionLabel")}
              fullWidth size="small" multiline rows={3} required
              InputLabelProps={{ shrink: !!watchDescription }}
              placeholder={t("forms.archiveCreate.descriptionPlaceholder")}
              error={!!errors.description}
              helperText={errors.description?.message}
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="inherit" disabled={loading}>{t("common.cancel")}</Button>
          <Button type="submit" variant="contained" disabled={loading} disableElevation
            startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            {t("forms.archiveCreate.submitLabel")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
