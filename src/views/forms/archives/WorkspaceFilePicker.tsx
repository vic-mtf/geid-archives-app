/**
 * WorkspaceFilePicker — Sélecteur de fichiers depuis l'espace de travail.
 *
 * Charge la liste des fichiers workspace de l'utilisateur et permet
 * d'en choisir un pour l'envoyer au service d'archivage.
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import useAxios from "@/hooks/useAxios";

const EVENT_NAME = "__open_workspace_file_picker";

interface WorkspaceItem {
  name: string;
  isDirectory?: boolean;
  doc?: { _id: string };
  [key: string]: unknown;
}

export default function WorkspaceFilePicker() {
  const [open, setOpen] = useState(false);
  const [folder, setFolder] = useState("documents");
  const [folderHistory, setFolderHistory] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<WorkspaceItem | null>(null);

  const token = useSelector((store: RootState) => (store.user as Record<string, unknown>).token as string);
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const dataParam = JSON.stringify({ path: folder });
  const [{ data, loading }] = useAxios<WorkspaceItem[]>(
    { url: `/api/stuff/workspace/${encodeURIComponent(dataParam)}`, headers },
    { manual: !open }
  );

  const items = Array.isArray(data) ? data : [];

  useEffect(() => {
    const root = document.getElementById("root");
    const handler = () => {
      setOpen(true);
      setFolder("documents");
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
    setFolderHistory((prev) => [...prev, folder]);
    setFolder((prev) => `${prev}/${name}`);
    setSelectedFile(null);
  }, [folder]);

  const goBack = useCallback(() => {
    setFolderHistory((prev) => {
      const copy = [...prev];
      const parent = copy.pop();
      if (parent !== undefined) setFolder(parent);
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

  const currentFolderName = folder.split("/").pop() || "Documents";

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle component="div" fontWeight="bold">
        Choisir un fichier de votre espace de travail
      </DialogTitle>

      <DialogContent dividers sx={{ maxHeight: "55vh", overflowY: "auto", p: 0 }}>
        {/* Navigation */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 1, bgcolor: "action.hover" }}>
          {folderHistory.length > 0 && (
            <Button size="small" startIcon={<ArrowBackRoundedIcon />} onClick={goBack} sx={{ minWidth: 0 }}>
              Retour
            </Button>
          )}
          <Typography variant="body2" fontWeight={500} noWrap flex={1}>
            {currentFolderName.charAt(0).toUpperCase() + currentFolderName.slice(1)}
          </Typography>
        </Stack>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={28} />
          </Box>
        ) : items.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: "center" }}>
            Ce dossier est vide.
          </Typography>
        ) : (
          <List disablePadding>
            {items.map((item) => (
              <ListItemButton
                key={item.name}
                selected={selectedFile?.name === item.name && !item.isDirectory}
                onClick={() => {
                  if (item.isDirectory) {
                    openFolder(item.name);
                  } else {
                    setSelectedFile(item);
                  }
                }}
                onDoubleClick={() => {
                  if (item.isDirectory) {
                    openFolder(item.name);
                  } else {
                    setSelectedFile(item);
                    handleConfirm();
                  }
                }}
                sx={{ px: 2 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {item.isDirectory
                    ? <FolderRoundedIcon sx={{ color: "#FFA726" }} />
                    : <InsertDriveFileOutlinedIcon color="action" />
                  }
                </ListItemIcon>
                <ListItemText
                  primary={item.name}
                  primaryTypographyProps={{ variant: "body2", noWrap: true }}
                />
              </ListItemButton>
            ))}
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
}
