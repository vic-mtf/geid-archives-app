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
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import VideoFileOutlinedIcon from "@mui/icons-material/VideoFileOutlined";
import AudioFileOutlinedIcon from "@mui/icons-material/AudioFileOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import SlideshowOutlinedIcon from "@mui/icons-material/SlideshowOutlined";
import { useSnackbar } from "notistack";
import getFileExtension from "@/utils/getFileExtention";
import fileExtensionBase from "@/utils/fileExtensionBase";

function getFileIcon(name: string) {
  const ext = getFileExtension(name)?.toLowerCase() ?? "";
  if (ext === "pdf")
    return { icon: <PictureAsPdfOutlinedIcon />, color: "#E53935", bg: "#FFEBEE" };
  const entry = fileExtensionBase.find(({ exts }) => exts.includes(ext));
  if (entry?.docType === "word")
    return { icon: <DescriptionOutlinedIcon />, color: "#1565C0", bg: "#E3F2FD" };
  if (entry?.docType === "excel")
    return { icon: <TableChartOutlinedIcon />, color: "#2E7D32", bg: "#E8F5E9" };
  if (entry?.docType === "power point")
    return { icon: <SlideshowOutlinedIcon />, color: "#E65100", bg: "#FFF3E0" };
  if (entry?.type === "image")
    return { icon: <ImageOutlinedIcon />, color: "#7B1FA2", bg: "#F3E5F5" };
  if (entry?.type === "video")
    return { icon: <VideoFileOutlinedIcon />, color: "#C62828", bg: "#FFEBEE" };
  if (entry?.type === "audio")
    return { icon: <AudioFileOutlinedIcon />, color: "#F57C00", bg: "#FFF3E0" };
  return { icon: <InsertDriveFileOutlinedIcon />, color: "#78909C", bg: "#ECEFF1" };
}
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import { incrementVersion } from "@/redux/data";
import Typology from "./Typology";

function FilePreview({ file }: { file: File }) {
  const fi = getFileIcon(file.name);
  const ext = getFileExtension(file.name)?.toUpperCase() ?? "";
  const size = file.size < 1024 * 1024
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
    if (!file)                      return setError("Veuillez sélectionner un fichier.");
    if (!designation.current?.trim()) return setError("La désignation est requise.");
    if (!description.current?.trim()) return setError("La description est requise.");
    if (!typeRef.current)             return setError("Le type de document est requis.");

    setLoading(true);
    const formData = new FormData();
    formData.append("file",        file);
    formData.append("designation", designation.current.trim());
    formData.append("description", description.current.trim());
    formData.append("type",        typeRef.current);
    if (subTypeRef.current) formData.append("subtype", subTypeRef.current);

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
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? `Erreur ${res.status}`);
      }
      dispatch(incrementVersion());
      enqueueSnackbar(
        `"${designation.current}" a bien été transmise au service d'archivage. Elle est maintenant en attente de validation par un archiviste.`,
        { variant: "success", title: "Archive déposée avec succès" }
      );
      handleClose();
    } catch (err: unknown) {
      setError((err as Error).message ?? "Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle component="div" fontWeight="bold">
        Ajouter une archive
        <Typography variant="caption" color="text.secondary" display="block">
          Téléversez un fichier et renseignez ses métadonnées
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
                <Typography variant="body2" color="text.secondary">
                  Glissez un fichier ici ou <strong>cliquez pour parcourir</strong>
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  PDF, Word, Excel, images… (max. 50 Mo)
                </Typography>
              </Stack>
            )}
          </Box>

          {/* Fields */}
          <TextField
            label="Désignation *"
            fullWidth
            size="small"
            placeholder="Ex : Rapport annuel RH 2024"
            onChange={(e) => { designation.current = e.target.value; }}
            helperText="Titre principal du document"
          />

          <Typology type={typeRef} subType={subTypeRef} />

          <TextField
            label="Description *"
            fullWidth
            size="small"
            multiline
            rows={3}
            placeholder="Décrivez brièvement le contenu et l'objet du document…"
            onChange={(e) => { description.current = e.target.value; }}
          />

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit" disabled={loading}>
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
          disableElevation
        >
          Envoyer au service d'archivage
        </Button>
      </DialogActions>
    </Dialog>
  );
}
