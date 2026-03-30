/**
 * ArchiveCreateDialog — Creer une archive depuis l'appareil ou l'espace personnel.
 *
 * Triggered by CustomEvent "__open_archive_create" with detail {}.
 * Deux sources : upload local OU fichier workspace (MinIO).
 */

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Alert,
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
import getFileExtension from "@/utils/getFileExtention";
import getFileIcon from "@/utils/getFileIcon";
import FileTypeIcon from "@/components/FileTypeIcon";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import { incrementVersion } from "@/redux/data";
import Typology from "./Typology";

function FilePreview({ name, size, isWorkspace }: { name: string; size?: number; isWorkspace?: boolean }) {
  const fi = getFileIcon(name);
  const ext = getFileExtension(name)?.toUpperCase() ?? "";
  const sizeStr = size
    ? size < 1024 ? `${size} octets`
    : size < 1024 * 1024 ? `${(size / 1024).toFixed(0)} Ko`
    : `${(size / (1024 * 1024)).toFixed(1)} Mo`
    : "";
  return (
    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5}>
      <Box sx={{
        width: 40, height: 40, borderRadius: 1.5, bgcolor: fi.bg,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <FileTypeIcon extension={ext.toLowerCase() || "txt"} size={24} />
      </Box>
      <Stack alignItems="flex-start" spacing={0}>
        <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 280 }}>
          {name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {isWorkspace && "Espace personnel · "}{ext && `${ext} · `}{sizeStr}
        </Typography>
      </Stack>
    </Stack>
  );
}

const EVENT_NAME = "__open_archive_create";

export default function ArchiveCreateDialog() {
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [wsFile, setWsFile] = useState<any>(null); // fichier workspace
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = useSelector((store: RootState) => (store.user as Record<string, unknown>).token as string);
  const dispatch = useDispatch<AppDispatch>();
  const { enqueueSnackbar } = useSnackbar();

  const designation  = useRef<string>("");
  const refNumber    = useRef<string>("");
  const description  = useRef<string>("");
  const typeRef      = useRef<string | null | undefined>(undefined);
  const subTypeRef   = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const root = document.getElementById("root");
    const handler = () => {
      setOpen(true);
      setFile(null);
      setWsFile(null);
      setError(null);
      designation.current = "";
      refNumber.current = "";
      description.current = "";
      typeRef.current = undefined;
      subTypeRef.current = undefined;
    };
    root?.addEventListener(EVENT_NAME, handler);
    return () => root?.removeEventListener(EVENT_NAME, handler);
  }, []);

  // Ecouter le retour du WorkspaceFilePicker
  useEffect(() => {
    const root = document.getElementById("root");
    const handler = (e: any) => {
      const f = e.detail?.file;
      if (f && open) {
        setWsFile(f);
        setFile(null);
      }
    };
    root?.addEventListener("__workspace_file_selected", handler);
    return () => root?.removeEventListener("__workspace_file_selected", handler);
  }, [open]);

  const handleClose = () => {
    if (loading) return;
    setOpen(false);
    setFile(null);
    setWsFile(null);
    setError(null);
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) { setFile(dropped); setWsFile(null); }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) { setFile(picked); setWsFile(null); }
  }, []);

  const openWorkspacePicker = useCallback(() => {
    document.getElementById("root")?.dispatchEvent(
      new CustomEvent("__open_workspace_file_picker_for_create")
    );
  }, []);

  const selectedName = file?.name || wsFile?.name || null;

  const handleSubmit = async () => {
    setError(null);
    if (!file && !wsFile)             return setError(t("forms.archiveCreate.errorNoFile"));
    if (!designation.current?.trim()) return setError(t("forms.archiveCreate.errorNoDesignation"));
    if (!description.current?.trim()) return setError(t("forms.archiveCreate.errorNoDescription"));
    if (!typeRef.current)             return setError(t("forms.archiveCreate.errorNoType"));

    setLoading(true);

    try {
      if (file) {
        // Upload depuis l'appareil
        const formData = new FormData();
        formData.append("file", file);
        formData.append("designation", designation.current.trim());
        formData.append("description", description.current.trim());
        formData.append("type", typeRef.current);
        if (subTypeRef.current) formData.append("subtype", subTypeRef.current);
        if (refNumber.current?.trim()) formData.append("refNumber", refNumber.current.trim());

        const res = await fetch(
          `${import.meta.env.VITE_SERVER_BASE_URL ?? ""}/api/stuff/archives/upload`,
          { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData }
        );
        if (!res.ok) {
          if (res.status === 401) throw new Error(t("notifications.errorSessionExpired"));
          if (res.status === 403) throw new Error(t("notifications.errorNoPermission"));
          if (res.status === 413) throw new Error(t("notifications.errorFileTooLarge"));
          throw new Error(t("notifications.archiveCreateFailed"));
        }
      } else if (wsFile) {
        // Archiver depuis l'espace personnel (MinIO)
        const res = await fetch(
          `${import.meta.env.VITE_SERVER_BASE_URL ?? ""}/api/stuff/archives`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              fileId: wsFile._id,
              fileName: wsFile.name,
              designation: designation.current.trim(),
              description: description.current.trim(),
              type: typeRef.current,
              subtype: subTypeRef.current || undefined,
              refNumber: refNumber.current?.trim() || undefined,
            }),
          }
        );
        if (!res.ok) {
          if (res.status === 401) throw new Error(t("notifications.errorSessionExpired"));
          if (res.status === 403) throw new Error(t("notifications.errorNoPermission"));
          throw new Error(t("notifications.archiveCreateFailed"));
        }
      }

      dispatch(incrementVersion());
      enqueueSnackbar(
        t("notifications.archiveCreated", { name: designation.current }),
        { variant: "success" }
      );
      handleClose();
    } catch (err: unknown) {
      const msg = (err as Error).message;
      setError(!navigator.onLine ? t("notifications.errorNoConnection") : msg || t("notifications.archiveCreateFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={fullScreen}
      BackdropProps={{ sx: { bgcolor: (theme: any) => theme.palette.background.paper + theme.customOptions.opacity, backdropFilter: (theme: any) => `blur(${theme.customOptions.blur})` } }}
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
              bgcolor: "success.50", display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <FilePreview name={selectedName} size={file?.size || wsFile?.size} isWorkspace={!!wsFile} />
              <Button size="small" color="inherit" onClick={() => { setFile(null); setWsFile(null); }}>
                {t("common.change") || "Changer"}
              </Button>
            </Box>
          ) : (
            <Stack spacing={1}>
              {/* Option 1: Depuis l'appareil (drag & drop) */}
              <Box
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => document.getElementById("archive-file-input")?.click()}
                sx={{
                  border: 2, borderStyle: "dashed",
                  borderColor: dragging ? "primary.main" : "divider",
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

              <Divider><Typography variant="caption" color="text.disabled">{t("common.or") || "ou"}</Typography></Divider>

              {/* Option 2: Depuis l'espace personnel */}
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<FolderRoundedIcon sx={{ color: "warning.main" }} />}
                onClick={openWorkspacePicker}
                sx={{ textTransform: "none", py: 1.5, borderStyle: "dashed" }}
              >
                {t("forms.archiveSource.fromWorkspace")}
              </Button>
            </Stack>
          )}

          {/* Fields */}
          <TextField
            label={t("forms.archiveCreate.designationLabel")}
            fullWidth size="small"
            placeholder={t("forms.archiveCreate.designationPlaceholder")}
            onChange={(e) => { designation.current = e.target.value; }}
            helperText={t("forms.archiveCreate.designationHelper")}
          />
          <TextField
            label={t("forms.archiveCreate.refNumberLabel", "Numero de reference")}
            fullWidth size="small"
            placeholder={t("forms.archiveCreate.refNumberPlaceholder", "Reference interne du document")}
            onChange={(e) => { refNumber.current = e.target.value; }}
          />
          <Typology type={typeRef} subType={subTypeRef} />
          <TextField
            label={t("forms.archiveCreate.descriptionLabel")}
            fullWidth size="small" multiline rows={3}
            placeholder={t("forms.archiveCreate.descriptionPlaceholder")}
            onChange={(e) => { description.current = e.target.value; }}
          />

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit" disabled={loading}>
          {t("common.cancel")}
        </Button>
        <Button
          variant="contained" onClick={handleSubmit} disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
          disableElevation
        >
          {t("forms.archiveCreate.submitLabel")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
