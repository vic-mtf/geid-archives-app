/**
 * WorkspaceFilePicker — Sélecteur de fichiers depuis l'espace personnel.
 *
 * Affiche les fichiers avec une icône adaptée au type (PDF, Word, image, vidéo…)
 * et la taille du fichier. Navigation par dossiers avec retour arrière.
 */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import VideoFileOutlinedIcon from "@mui/icons-material/VideoFileOutlined";
import AudioFileOutlinedIcon from "@mui/icons-material/AudioFileOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import SlideshowOutlinedIcon from "@mui/icons-material/SlideshowOutlined";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import useAxios from "@/hooks/useAxios";
import getFileExtension from "@/utils/getFileExtention";
import fileExtensionBase from "@/utils/fileExtensionBase";

const EVENT_NAME = "__open_workspace_file_picker";

interface WorkspaceItem {
  name: string;
  isDirectory?: boolean;
  size?: number;
  doc?: { _id: string };
  [key: string]: unknown;
}

// ── Icône et couleur selon l'extension ──────────────────────

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

function formatSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

// ── Composant ───────────────────────────────────────────────

// Catégories racines de l'espace personnel
const ROOT_CATEGORIES: WorkspaceItem[] = [
  { name: "documents", isDirectory: true },
  { name: "images", isDirectory: true },
  { name: "videos", isDirectory: true },
];

const WorkspaceFilePicker = React.memo(function WorkspaceFilePicker() {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(false);
  const [folder, setFolder] = useState<string | null>(null); // null = racine
  const [folderHistory, setFolderHistory] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<WorkspaceItem | null>(null);

  const token = useSelector((store: RootState) => (store.user as Record<string, unknown>).token as string);
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const isRoot = folder === null;
  const dataParam = folder ? JSON.stringify({ path: folder }) : "";
  const [{ data, loading }] = useAxios<WorkspaceItem[]>(
    { url: `/api/stuff/workspace/${encodeURIComponent(dataParam)}`, headers },
    { manual: !open || isRoot }
  );

  const items = useMemo(() => {
    if (isRoot) return ROOT_CATEGORIES;
    if (!Array.isArray(data)) return [];
    return [...data].sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [data, isRoot]);

  useEffect(() => {
    const root = document.getElementById("root");
    const handler = () => {
      setOpen(true);
      setFolder(null);
      setFolderHistory([]);
      setSelectedFile(null);
    };
    root?.addEventListener(EVENT_NAME, handler);
    return () => root?.removeEventListener(EVENT_NAME, handler);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSelectedFile(null);
  }, []);

  const openFolder = useCallback((name: string) => {
    setFolderHistory((prev) => [...prev, folder ?? ""]);
    setFolder((prev) => prev ? `${prev}/${name}` : name);
    setSelectedFile(null);
  }, [folder]);

  const goBack = useCallback(() => {
    setFolderHistory((prev) => {
      const copy = [...prev];
      const parent = copy.pop();
      setFolder(parent === "" ? null : parent ?? null);
      return copy;
    });
    setSelectedFile(null);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!selectedFile) return;
    setOpen(false);
    document.getElementById("root")?.dispatchEvent(
      new CustomEvent("_open_archives_form", {
        detail: { name: "_open_archives_form", file: selectedFile },
      })
    );
    setSelectedFile(null);
  }, [selectedFile]);

  // Breadcrumb
  const breadcrumbParts = isRoot ? ["Espace personnel"] : ["Espace personnel", ...folder!.split("/")];
  const fileCount = items.filter((i) => !i.isDirectory).length;
  const folderCount = items.filter((i) => i.isDirectory).length;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle component="div" fontWeight="bold" sx={{ pb: 0 }}>
        Choisir un fichier de votre espace personnel
      </DialogTitle>

      <DialogContent dividers sx={{ maxHeight: "60vh", overflowY: "auto", p: 0 }}>
        {/* Barre de navigation */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          sx={{ px: 2, py: 1, bgcolor: "action.hover", borderBottom: "1px solid", borderColor: "divider" }}
        >
          {folderHistory.length > 0 && (
            <Button
              size="small"
              onClick={goBack}
              startIcon={<ArrowBackRoundedIcon />}
              sx={{ minWidth: 0, mr: 1 }}
            >
              Retour
            </Button>
          )}
          {breadcrumbParts.map((part, i) => (
            <Stack key={i} direction="row" alignItems="center" spacing={0.5}>
              {i > 0 && <NavigateNextRoundedIcon sx={{ fontSize: 16, color: "text.disabled" }} />}
              <Typography
                variant="caption"
                fontWeight={i === breadcrumbParts.length - 1 ? 600 : 400}
                color={i === breadcrumbParts.length - 1 ? "text.primary" : "text.secondary"}
              >
                {part.charAt(0).toUpperCase() + part.slice(1)}
              </Typography>
            </Stack>
          ))}
          <Box flex={1} />
          {!loading && (
            <Typography variant="caption" color="text.disabled">
              {folderCount > 0 && `${folderCount} dossiers`}
              {folderCount > 0 && fileCount > 0 && ", "}
              {fileCount > 0 && `${fileCount} fichiers`}
            </Typography>
          )}
        </Stack>

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress size={28} />
          </Box>
        ) : items.length === 0 ? (
          <Box textAlign="center" py={6}>
            <Typography variant="body2" color="text.secondary">
              Ce dossier est vide.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {items.map((item) => {
              const isDir = item.isDirectory;
              const isSelected = !isDir && selectedFile?.name === item.name;
              const fileInfo = !isDir ? getFileIcon(item.name) : null;
              const size = !isDir ? formatSize(item.size as number | undefined) : null;
              const ext = !isDir ? (getFileExtension(item.name)?.toUpperCase() ?? "") : "";

              return (
                <ListItemButton
                  key={item.name}
                  selected={isSelected}
                  onClick={() => isDir ? openFolder(item.name) : setSelectedFile(item)}
                  onDoubleClick={() => {
                    if (isDir) { openFolder(item.name); return; }
                    setSelectedFile(item);
                    setTimeout(() => handleConfirm(), 0);
                  }}
                  sx={{
                    px: 2,
                    py: 0.75,
                    "&.Mui-selected": { bgcolor: "primary.50" },
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 44 }}>
                    {isDir ? (
                      <Avatar variant="rounded" sx={{ width: 36, height: 36, bgcolor: "#FFF3E0" }}>
                        <FolderRoundedIcon sx={{ color: "#FFA726" }} />
                      </Avatar>
                    ) : (
                      <Avatar variant="rounded" sx={{ width: 36, height: 36, bgcolor: fileInfo!.bg }}>
                        {(() => {
                          const { icon, color } = fileInfo!;
                          return <Box sx={{ color, display: "flex" }}>{icon}</Box>;
                        })()}
                      </Avatar>
                    )}
                  </ListItemAvatar>
                  <ListItemText
                    primary={item.name}
                    secondary={isDir ? null : size || ext}
                    primaryTypographyProps={{ variant: "body2", noWrap: true, fontWeight: isSelected ? 600 : 400 }}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                  {isDir && <NavigateNextRoundedIcon sx={{ color: "text.disabled", fontSize: 20 }} />}
                  {!isDir && ext && (
                    <Chip
                      label={ext}
                      size="small"
                      sx={{ fontSize: "0.65rem", height: 20, bgcolor: fileInfo!.bg, color: fileInfo!.color, fontWeight: 600 }}
                    />
                  )}
                </ListItemButton>
              );
            })}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Annuler
        </Button>
        <Button
          variant="contained"
          disabled={!selectedFile || selectedFile.isDirectory}
          onClick={handleConfirm}
        >
          Sélectionner
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default WorkspaceFilePicker;
