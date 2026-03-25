/**
 * ArchiveCreateDialog — Create an archive by uploading a file directly.
 *
 * Triggered by CustomEvent "__open_archive_create" with detail {}.
 * Calls POST /api/stuff/archives/upload (multipart/form-data).
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
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import getFileExtension from "@/utils/getFileExtention";
import getFileIcon from "@/utils/getFileIcon";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import { incrementVersion } from "@/redux/data";
import Typology from "./Typology";

function FilePreview({ file }: { file: File }) {
  const fi = getFileIcon(file.name);
  const ext = getFileExtension(file.name)?.toUpperCase() ?? "";
  const size = file.size < 1024
    ? `${file.size} octets`
    : file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(0)} Ko`
      : `${(file.size / (1024 * 1024)).toFixed(1)} Mo`;
  return (
    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5}>
      <Box sx={{
        width: 40, height: 40, borderRadius: 1.5, bgcolor: fi.bg,
        display: "flex", alignItems: "center", justifyContent: "center", color: fi.color, flexShrink: 0,
      }}>
        {fi.icon}
      </Box>
      <Stack alignItems="flex-start" spacing={0}>
        <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 280 }}>
          {file.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {ext && `${ext} · `}{size}
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
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = useSelector((store: RootState) => (store.user as Record<string, unknown>).token as string);
  const dispatch = useDispatch<AppDispatch>();
  const { enqueueSnackbar } = useSnackbar();

  // Form fields
  const designation  = useRef<string>("");
  const refNumber    = useRef<string>("");
  const description  = useRef<string>("");
  const typeRef      = useRef<string | null | undefined>(undefined);
  const subTypeRef   = useRef<string | null | undefined>(undefined);

  // Listen for open event
  useEffect(() => {
    const root = document.getElementById("root");
    const handler = () => {
      setOpen(true);
      setFile(null);
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

  const handleClose = () => {
    if (loading) return;
    setOpen(false);
    setFile(null);
    setError(null);
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) setFile(picked);
  }, []);

  const handleSubmit = async () => {
    setError(null);
    if (!file)                      return setError(t("forms.archiveCreate.errorNoFile"));
    if (!designation.current?.trim()) return setError(t("forms.archiveCreate.errorNoDesignation"));
    if (!description.current?.trim()) return setError(t("forms.archiveCreate.errorNoDescription"));
    if (!typeRef.current)             return setError(t("forms.archiveCreate.errorNoType"));

    setLoading(true);
    const formData = new FormData();
    formData.append("file",        file);
    formData.append("designation", designation.current.trim());
    formData.append("description", description.current.trim());
    formData.append("type",        typeRef.current);
    if (subTypeRef.current) formData.append("subtype", subTypeRef.current);
    if (refNumber.current?.trim()) formData.append("refNumber", refNumber.current.trim());

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_BASE_URL ?? ""}/api/stuff/archives/upload`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
      if (!res.ok) {
        if (res.status === 401) throw new Error(t("notifications.errorSessionExpired"));
        if (res.status === 403) throw new Error(t("notifications.errorNoPermission"));
        if (res.status === 413) throw new Error(t("notifications.errorFileTooLarge"));
        throw new Error(t("notifications.archiveCreateFailed"));
      }
      dispatch(incrementVersion());
      enqueueSnackbar(
        t("notifications.archiveCreated", { name: designation.current }),
        { variant: "success", title: t("notifications.archiveCreatedTitle") }
      );
      handleClose();
    } catch (err: unknown) {
      const msg = (err as Error).message;
      if (!navigator.onLine) {
        setError(t("notifications.errorNoConnection"));
      } else {
        setError(msg || t("notifications.archiveCreateFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle component="div" fontWeight="bold">
        {t("forms.archiveCreate.title")}
        <Typography variant="caption" color="text.secondary" display="block">
          {t("forms.archiveCreate.subtitle")}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2}>
          {/* Drop zone */}
          <Box
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => document.getElementById("archive-file-input")?.click()}
            sx={{
              border: 2,
              borderStyle: "dashed",
              borderColor: dragging ? "primary.main" : file ? "success.main" : "divider",
              borderRadius: 2,
              p: 3,
              textAlign: "center",
              cursor: "pointer",
              bgcolor: dragging ? "action.hover" : file ? "success.50" : "background.default",
              transition: "all .2s",
              "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
            }}
          >
            <input
              id="archive-file-input"
              type="file"
              hidden
              onChange={handleFileInput}
            />
            {file ? (
              <FilePreview file={file} />
            ) : (
              <Stack alignItems="center" spacing={0.5}>
                <UploadFileRoundedIcon sx={{ color: "text.disabled", fontSize: 36 }} />
                <Typography variant="body2" color="text.secondary" dangerouslySetInnerHTML={{ __html: t("forms.archiveCreate.dropZone") }} />
                <Typography variant="caption" color="text.disabled">
                  {t("forms.archiveCreate.dropZoneHint")}
                </Typography>
              </Stack>
            )}
          </Box>

          {/* Fields */}
          <TextField
            label={t("forms.archiveCreate.designationLabel")}
            fullWidth
            size="small"
            placeholder={t("forms.archiveCreate.designationPlaceholder")}
            onChange={(e) => { designation.current = e.target.value; }}
            helperText={t("forms.archiveCreate.designationHelper")}
          />

          <TextField
            label={t("forms.archiveCreate.refNumberLabel", "N° de référence")}
            fullWidth
            size="small"
            placeholder={t("forms.archiveCreate.refNumberPlaceholder", "Référence interne du document")}
            onChange={(e) => { refNumber.current = e.target.value; }}
          />

          <Typology type={typeRef} subType={subTypeRef} />

          <TextField
            label={t("forms.archiveCreate.descriptionLabel")}
            fullWidth
            size="small"
            multiline
            rows={3}
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
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
          disableElevation
        >
          {t("forms.archiveCreate.submitLabel")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
