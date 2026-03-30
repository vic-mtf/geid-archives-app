/**
 * ArchiveCreateDialog — Creer une archive depuis l'appareil ou l'espace personnel.
 *
 * - Erreurs de validation sous chaque champ (pas d'Alert globale)
 * - Pre-remplissage depuis les metadonnees du fichier workspace
 */

import { useEffect, useState, useCallback } from "react";
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

export default function ArchiveCreateDialog() {
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [wsFile, setWsFile] = useState<any>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  // Champs controlés
  const [designation, setDesignation] = useState("");
  const [refNumber, setRefNumber] = useState("");
  const [description, setDescription] = useState("");
  const [typeVal, setTypeVal] = useState<string | null>(null);
  const [subTypeVal, setSubTypeVal] = useState<string | null>(null);

  // Erreurs par champ
  const [errors, setErrors] = useState<Record<string, string>>({});

  const token = useSelector((store: RootState) => (store.user as Record<string, unknown>).token as string);
  const dispatch = useDispatch<AppDispatch>();
  const { enqueueSnackbar } = useSnackbar();

  // Refs pour Typology (composant non controlé)
  const typeRef = { current: typeVal } as { current: string | null | undefined };
  const subTypeRef = { current: subTypeVal } as { current: string | null | undefined };

  const reset = useCallback(() => {
    setFile(null); setWsFile(null); setDragging(false);
    setDesignation(""); setRefNumber(""); setDescription("");
    setTypeVal(null); setSubTypeVal(null); setErrors({});
  }, []);

  useEffect(() => {
    const root = document.getElementById("root");
    const handler = () => { setOpen(true); reset(); };
    root?.addEventListener(EVENT_NAME, handler);
    return () => root?.removeEventListener(EVENT_NAME, handler);
  }, [reset]);

  // Ecouter le retour du WorkspaceFilePicker
  useEffect(() => {
    const root = document.getElementById("root");
    const handler = (e: any) => {
      const f = e.detail?.file;
      if (f && open) {
        setWsFile(f);
        setFile(null);
        // Pre-remplir depuis les metadonnees workspace
        if (f.designation && !designation) setDesignation(f.designation);
        if (f.description && !description) setDescription(f.description);
        if (f.docType && !typeVal) setTypeVal(f.docType);
        if (f.docSubType && !subTypeVal) setSubTypeVal(f.docSubType);
      }
    };
    root?.addEventListener("__workspace_file_selected", handler);
    return () => root?.removeEventListener("__workspace_file_selected", handler);
  }, [open, designation, description, typeVal, subTypeVal]);

  const handleClose = () => { if (!loading) { setOpen(false); reset(); } };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) { setFile(dropped); setWsFile(null); setErrors((p) => ({ ...p, file: "" })); }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) { setFile(picked); setWsFile(null); setErrors((p) => ({ ...p, file: "" })); }
  }, []);

  const openWorkspacePicker = useCallback(() => {
    document.getElementById("root")?.dispatchEvent(new CustomEvent("__open_workspace_file_picker_for_create"));
  }, []);

  const selectedName = file?.name || wsFile?.name || null;

  const handleSubmit = async () => {
    // Validation par champ
    const errs: Record<string, string> = {};
    if (!file && !wsFile) errs.file = t("forms.archiveCreate.errorNoFile");
    if (!designation.trim()) errs.designation = t("forms.archiveCreate.errorNoDesignation");
    if (!description.trim()) errs.description = t("forms.archiveCreate.errorNoDescription");
    if (!typeVal) errs.type = t("forms.archiveCreate.errorNoType");
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setErrors({});

    try {
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("designation", designation.trim());
        formData.append("description", description.trim());
        formData.append("type", typeVal!);
        if (subTypeVal) formData.append("subtype", subTypeVal);
        if (refNumber.trim()) formData.append("refNumber", refNumber.trim());

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
            fileId: wsFile._id, fileName: wsFile.name,
            designation: designation.trim(), description: description.trim(),
            type: typeVal, subtype: subTypeVal || undefined,
            refNumber: refNumber.trim() || undefined,
          }),
        });
        if (!res.ok) throw new Error(t("notifications.archiveCreateFailed"));
      }

      dispatch(incrementVersion());
      enqueueSnackbar(t("notifications.archiveCreated", { name: designation }), { variant: "success" });
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

      <DialogContent>
        <Stack spacing={2}>
          {/* Fichier selectionne */}
          {selectedName ? (
            <Box sx={{
              border: 2, borderColor: "success.main", borderRadius: 2, p: 2,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <FileTypeIcon extension={getFileExtension(selectedName) || "txt"} size={28} />
                <Stack spacing={0}>
                  <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 250 }}>{selectedName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {wsFile ? "Espace personnel" : ""}{file ? formatSize(file.size) : wsFile?.size ? formatSize(wsFile.size) : ""}
                  </Typography>
                </Stack>
              </Stack>
              <Button size="small" color="inherit" onClick={() => { setFile(null); setWsFile(null); }}>
                {t("common.change")}
              </Button>
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
                  borderColor: errors.file ? "error.main" : dragging ? "primary.main" : "divider",
                  borderRadius: 2, p: 2.5, textAlign: "center", cursor: "pointer",
                  bgcolor: dragging ? "action.hover" : "background.default",
                  transition: "all .2s",
                  "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
                }}
              >
                <input id="archive-file-input" type="file" hidden onChange={handleFileInput} />
                <UploadFileOutlinedIcon sx={{ color: "text.disabled", fontSize: 32 }} />
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  {t("forms.archiveCreate.dropZone")}
                </Typography>
              </Box>
              {errors.file && <Typography variant="caption" color="error.main" sx={{ mt: -0.5, ml: 1.5 }}>{errors.file}</Typography>}

              <Divider><Typography variant="caption" color="text.disabled">{t("common.or")}</Typography></Divider>

              <Button variant="outlined" color="inherit" startIcon={<FolderRoundedIcon sx={{ color: "warning.main" }} />}
                onClick={openWorkspacePicker} sx={{ textTransform: "none", py: 1.5, borderStyle: "dashed" }}
              >
                {t("forms.archiveSource.fromWorkspace")}
              </Button>
            </Stack>
          )}

          <TextField label={t("forms.archiveCreate.designationLabel")} fullWidth size="small"
            value={designation} onChange={(e) => { setDesignation(e.target.value); setErrors((p) => ({ ...p, designation: "" })); }}
            error={!!errors.designation} helperText={errors.designation || t("forms.archiveCreate.designationHelper")}
            required
          />

          <TextField label={t("forms.archiveCreate.refNumberLabel")} fullWidth size="small"
            value={refNumber} onChange={(e) => setRefNumber(e.target.value)}
          />

          <Typology type={typeRef} subType={subTypeRef} />
          {errors.type && <Typography variant="caption" color="error.main" sx={{ mt: -1, ml: 1.5 }}>{errors.type}</Typography>}

          <TextField label={t("forms.archiveCreate.descriptionLabel")} fullWidth size="small"
            multiline rows={3} value={description}
            onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: "" })); }}
            error={!!errors.description} helperText={errors.description || undefined}
            required
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit" disabled={loading}>{t("common.cancel")}</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading} disableElevation
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          {t("forms.archiveCreate.submitLabel")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
