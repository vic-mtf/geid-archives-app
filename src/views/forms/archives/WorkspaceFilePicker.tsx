/**
 * WorkspaceFilePicker — Selecteur de fichiers depuis l'espace personnel (MinIO).
 *
 * Navigation par dossiers, icones FileTypeIcon (comme workspaces),
 * dossiers FolderRounded avec couleur. Fetch via /api/stuff/workspace/.
 */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import scrollBarSx from "@/utils/scrollBarSx";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import NavigateNextOutlinedIcon from "@mui/icons-material/NavigateNextOutlined";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import FileTypeIcon from "@/components/FileTypeIcon";
import getFileExtension from "@/utils/getFileExtention";

const EVENT_NAME = "__open_workspace_file_picker";

interface WorkspaceItem {
  _id?: string;
  name: string;
  isDirectory?: boolean;
  size?: number;
  color?: string;
  [key: string]: unknown;
}

function formatSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

const WorkspaceFilePicker = React.memo(function WorkspaceFilePicker() {
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"archive" | "create">("archive");
  const [currentPath, setCurrentPath] = useState("");
  const [selectedFile, setSelectedFile] = useState<WorkspaceItem | null>(null);
  const [data, setData] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(false);

  const token = useSelector((store: RootState) => (store.user as Record<string, unknown>).token as string);

  // Fetch dossier
  const loadFolder = useCallback(async (path: string) => {
    setLoading(true);
    setSelectedFile(null);
    try {
      const query = JSON.stringify({ path });
      const res = await fetch(`/api/stuff/workspace/${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const items = await res.json();
      setData(Array.isArray(items) ? items : []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Events
  useEffect(() => {
    const root = document.getElementById("root");
    const openArchive = () => { setOpen(true); setMode("archive"); setCurrentPath(""); loadFolder(""); };
    const openCreate = () => { setOpen(true); setMode("create"); setCurrentPath(""); loadFolder(""); };
    root?.addEventListener(EVENT_NAME, openArchive);
    root?.addEventListener("__open_workspace_file_picker_for_create", openCreate);
    return () => { root?.removeEventListener(EVENT_NAME, openArchive); root?.removeEventListener("__open_workspace_file_picker_for_create", openCreate); };
  }, [loadFolder]);

  const handleClose = useCallback(() => { setOpen(false); setSelectedFile(null); }, []);

  const enterFolder = useCallback((folderName: string) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setCurrentPath(newPath);
    loadFolder(newPath);
  }, [currentPath, loadFolder]);

  const goBack = useCallback(() => {
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    const newPath = parts.join("/");
    setCurrentPath(newPath);
    loadFolder(newPath);
  }, [currentPath, loadFolder]);

  const goRoot = useCallback(() => {
    setCurrentPath("");
    loadFolder("");
  }, [loadFolder]);

  const handleConfirm = useCallback(() => {
    if (!selectedFile) return;
    setOpen(false);
    const eventName = mode === "create" ? "__workspace_file_selected" : "_open_archives_form";
    document.getElementById("root")?.dispatchEvent(
      new CustomEvent(eventName, { detail: { name: eventName, file: selectedFile } })
    );
    setSelectedFile(null);
  }, [selectedFile, mode]);

  const pathParts = useMemo(() => currentPath ? currentPath.split("/").filter(Boolean) : [], [currentPath]);

  const sorted = useMemo(() => {
    const dirs = data.filter((i) => i.isDirectory).sort((a, b) => a.name.localeCompare(b.name));
    const files = data.filter((i) => !i.isDirectory).sort((a, b) => a.name.localeCompare(b.name));
    return [...dirs, ...files];
  }, [data]);

  const fileCount = sorted.filter((i) => !i.isDirectory).length;
  const folderCount = sorted.filter((i) => i.isDirectory).length;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={fullScreen}
      BackdropProps={{ sx: { bgcolor: (th: any) => th.palette.background.paper + th.customOptions.opacity, backdropFilter: (th: any) => `blur(${th.customOptions.blur})` } }}
      PaperProps={{ sx: { height: fullScreen ? "100%" : 480, display: "flex", flexDirection: "column", border: 1, borderColor: "divider" } }}
    >
      <DialogTitle sx={{ pb: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
        <FolderRoundedIcon color="warning" sx={{ fontSize: 22 }} />
        <Typography variant="h6" fontSize={16} fontWeight="bold" flex={1}>
          {t("forms.workspace.title")}
        </Typography>
      </DialogTitle>

      {/* Barre de navigation */}
      <Box sx={{ display: "flex", alignItems: "center", px: 2, py: 0.5, gap: 0.5, borderBottom: 1, borderColor: "divider" }}>
        {pathParts.length > 0 && (
          <IconButton size="small" onClick={goBack} sx={{ mr: 0.5 }}>
            <ArrowBackOutlinedIcon fontSize="small" />
          </IconButton>
        )}
        <IconButton size="small" onClick={goRoot} disabled={pathParts.length === 0}>
          <HomeOutlinedIcon fontSize="small" />
        </IconButton>
        {pathParts.length > 0 && <NavigateNextOutlinedIcon sx={{ fontSize: 16, color: "text.disabled" }} />}
        {pathParts.map((part, i) => (
          <Box key={i} sx={{ display: "flex", alignItems: "center" }}>
            <Typography
              variant="body2"
              sx={{
                cursor: i < pathParts.length - 1 ? "pointer" : "default",
                fontWeight: i === pathParts.length - 1 ? 600 : 400,
                color: i === pathParts.length - 1 ? "text.primary" : "text.secondary",
                "&:hover": i < pathParts.length - 1 ? { textDecoration: "underline" } : {},
                fontSize: 13,
              }}
              onClick={() => {
                if (i < pathParts.length - 1) {
                  const newPath = pathParts.slice(0, i + 1).join("/");
                  setCurrentPath(newPath);
                  loadFolder(newPath);
                }
              }}
            >
              {part}
            </Typography>
            {i < pathParts.length - 1 && <NavigateNextOutlinedIcon sx={{ fontSize: 16, color: "text.disabled", mx: 0.25 }} />}
          </Box>
        ))}
        <Box flex={1} />
        {!loading && (folderCount > 0 || fileCount > 0) && (
          <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0 }}>
            {folderCount > 0 && `${folderCount} dossier${folderCount > 1 ? "s" : ""}`}
            {folderCount > 0 && fileCount > 0 && ", "}
            {fileCount > 0 && `${fileCount} fichier${fileCount > 1 ? "s" : ""}`}
          </Typography>
        )}
      </Box>

      <DialogContent sx={{ p: 0, flex: 1, overflow: "auto", ...scrollBarSx }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={6}>
            <CircularProgress size={28} />
          </Box>
        ) : sorted.length === 0 ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={6} gap={1}>
            <InboxOutlinedIcon sx={{ fontSize: 40, opacity: 0.3 }} />
            <Typography variant="body2" color="text.secondary">
              {t("forms.workspace.folderEmpty")}
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding>
            {sorted.map((item) => {
              const isDir = !!item.isDirectory;
              const isSelected = !isDir && selectedFile?.name === item.name;
              const ext = !isDir ? (getFileExtension(item.name) ?? "") : "";

              return (
                <ListItemButton
                  key={item.name}
                  selected={isSelected}
                  onClick={() => isDir ? enterFolder(item.name) : setSelectedFile(isSelected ? null : item)}
                  onDoubleClick={() => {
                    if (isDir) return enterFolder(item.name);
                    setSelectedFile(item);
                    setTimeout(() => handleConfirm(), 0);
                  }}
                  sx={{ px: 2, py: 0.75 }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {isDir ? (
                      <FolderRoundedIcon sx={{ color: (item.color as string) || "warning.main", fontSize: 24 }} />
                    ) : (
                      <FileTypeIcon extension={ext} size={22} />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.name}
                    secondary={isDir
                      ? ((item.count as number) != null ? `${item.count} element${(item.count as number) > 1 ? "s" : ""}` : undefined)
                      : formatSize(item.size as number | undefined)
                    }
                    primaryTypographyProps={{ variant: "body2", noWrap: true, fontWeight: isSelected ? 600 : 400 }}
                    secondaryTypographyProps={{ fontSize: 11 }}
                  />
                  {isDir && (
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); enterFolder(item.name); }} sx={{ ml: 0.5 }}>
                      <NavigateNextOutlinedIcon fontSize="small" />
                    </IconButton>
                  )}
                  {isSelected && <CheckOutlinedIcon color="primary" sx={{ fontSize: 18, ml: 0.5 }} />}
                </ListItemButton>
              );
            })}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1, borderTop: 1, borderColor: "divider" }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }} noWrap>
          {selectedFile ? selectedFile.name : (currentPath || t("forms.workspace.personalSpace"))}
        </Typography>
        <Button onClick={handleClose} color="inherit" size="small">
          {t("common.cancel")}
        </Button>
        <Button
          variant="contained"
          size="small"
          disabled={!selectedFile || !!selectedFile.isDirectory}
          onClick={handleConfirm}
          sx={{ textTransform: "none" }}
        >
          {t("common.select")}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default WorkspaceFilePicker;
