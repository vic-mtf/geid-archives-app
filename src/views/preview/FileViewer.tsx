/**
 * FileViewer — Visualiseur de fichiers plein ecran pour archives.
 *
 * Ecoute l'evenement _open_file_preview et affiche le fichier
 * dans le sous-viewer adapte (image, video, document, audio, inconnu).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Box,
  Dialog,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ChevronLeftOutlinedIcon from "@mui/icons-material/ChevronLeftOutlined";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import ViewerTopBar from "@/views/preview/components/ViewerTopBar";
import ImageViewer from "@/views/preview/viewers/ImageViewer";
import VideoViewer from "@/views/preview/viewers/VideoViewer";
import DocumentViewer from "@/views/preview/viewers/DocumentViewer";
import AudioViewer from "@/views/preview/viewers/AudioViewer";
import UnknownViewer from "@/views/preview/viewers/UnknownViewer";
import getFileExtension from "@/utils/getFileExtention";
import type { RootState } from "@/redux/store";

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "avif"]);
const VIDEO_EXTS = new Set(["mp4", "webm", "mov", "avi", "mkv"]);
const DOCUMENT_EXTS = new Set(["pdf", "docx", "xlsx", "pptx", "doc", "xls", "ppt", "odt", "ods", "odp"]);
const AUDIO_EXTS = new Set(["mp3", "wav", "ogg", "flac"]);

type FileCategory = "image" | "video" | "document" | "audio" | "other";

function getCategory(ext: string): FileCategory {
  const e = ext.toLowerCase();
  if (IMAGE_EXTS.has(e)) return "image";
  if (VIDEO_EXTS.has(e)) return "video";
  if (DOCUMENT_EXTS.has(e)) return "document";
  if (AUDIO_EXTS.has(e)) return "audio";
  return "other";
}

interface ArchiveFile {
  _id?: string;
  name?: string;
  fileUrl?: string;
  size?: number;
  [key: string]: any;
}

export default function FileViewer() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const token = useSelector((store: RootState) => (store.user as any)?.token);

  const [open, setOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState<ArchiveFile | null>(null);
  const [filesList, setFilesList] = useState<ArchiveFile[]>([]);
  const [hovered, setHovered] = useState(false);

  const navigableFiles = useMemo(() => filesList.filter((f) => f.name), [filesList]);

  const currentIndex = useMemo(() => {
    if (!currentFile) return -1;
    return navigableFiles.findIndex((f) => f._id === currentFile._id || f.name === currentFile.name);
  }, [currentFile, navigableFiles]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < navigableFiles.length - 1;

  useEffect(() => {
    const root = document.getElementById("root");
    const handler = (event: any) => {
      const f = event.detail?.file;
      if (!f) return;
      setCurrentFile(f);
      setFilesList(event.detail?.files || []);
      setOpen(true);
    };
    root?.addEventListener("_open_file_preview", handler);
    return () => root?.removeEventListener("_open_file_preview", handler);
  }, []);

  const goTo = useCallback((direction: "prev" | "next") => {
    if (direction === "prev" && hasPrev) setCurrentFile(navigableFiles[currentIndex - 1]);
    else if (direction === "next" && hasNext) setCurrentFile(navigableFiles[currentIndex + 1]);
  }, [currentIndex, hasPrev, hasNext, navigableFiles]);

  const handleClose = useCallback(() => { setOpen(false); setCurrentFile(null); setFilesList([]); }, []);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      else if (e.key === "ArrowLeft") goTo("prev");
      else if (e.key === "ArrowRight") goTo("next");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, handleClose, goTo]);

  const handleDownload = useCallback(() => {
    const url = currentFile?.fileUrl;
    if (!url) return;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = currentFile?.name || "download";
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => {});
  }, [currentFile, token]);

  const handleDelete = useCallback(() => { handleClose(); }, [handleClose]);

  // URL du fichier archives
  const fileUrl = currentFile?.fileUrl || "";
  const ext = getFileExtension(currentFile?.name || "") || "";
  const category = getCategory(ext);

  const renderViewer = () => {
    if (!fileUrl && category !== "other") return null;
    const name = currentFile?.name || "";

    switch (category) {
      case "image":
        return <ImageViewer fileUrl={fileUrl} filename={name} imageWidth={currentFile?.imageWidth} imageHeight={currentFile?.imageHeight} />;
      case "video":
        return <VideoViewer fileUrl={fileUrl} filename={name} />;
      case "document":
        return <DocumentViewer fileUrl={fileUrl} filename={name} extension={ext} />;
      case "audio":
        return <AudioViewer fileUrl={fileUrl} filename={name} />;
      default:
        return <UnknownViewer filename={name} extension={ext} size={currentFile?.size} onDownload={handleDownload} />;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: (th: any) => th.palette.background.paper + th.customOptions.opacity,
          backdropFilter: (th: any) => `blur(${th.customOptions.blur})`,
          backgroundImage: "none",
        },
      }}
    >
      <Box
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        sx={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}
      >
        <ViewerTopBar
          filename={currentFile?.name || ""}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onClose={handleClose}
          hovered={hovered}
        />

        <Box sx={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "100%", height: "100%", pb: 2, px: { xs: 1, sm: 2, md: 6 },
          position: "relative", overflow: "hidden",
        }}>
          {hasPrev && (
            <Tooltip title={t("viewer.previousFile") || "Precedent"}>
              <IconButton
                onClick={() => goTo("prev")}
                sx={{
                  position: "absolute", left: { xs: 4, md: 16 }, top: "50%", transform: "translateY(-50%)",
                  zIndex: 10, color: "common.white", bgcolor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
                  opacity: isMobile ? 0.8 : hovered ? 0.9 : 0, transition: "opacity 0.3s ease",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.6)" },
                }}
              >
                <ChevronLeftOutlinedIcon fontSize="large" />
              </IconButton>
            </Tooltip>
          )}

          <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {renderViewer()}
          </Box>

          {hasNext && (
            <Tooltip title={t("viewer.nextFile") || "Suivant"}>
              <IconButton
                onClick={() => goTo("next")}
                sx={{
                  position: "absolute", right: { xs: 4, md: 16 }, top: "50%", transform: "translateY(-50%)",
                  zIndex: 10, color: "common.white", bgcolor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
                  opacity: isMobile ? 0.8 : hovered ? 0.9 : 0, transition: "opacity 0.3s ease",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.6)" },
                }}
              >
                <ChevronRightOutlinedIcon fontSize="large" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Dialog>
  );
}
