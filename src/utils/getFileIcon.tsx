/**
 * getFileIcon — Retourne l'icône MUI, la couleur et le fond adaptés au type de fichier.
 *
 * Utilisé partout où un fichier/archive est affiché pour donner une indication
 * visuelle immédiate du type (PDF rouge, Word bleu, Excel vert, etc.).
 */

import React from "react";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import VideoFileOutlinedIcon from "@mui/icons-material/VideoFileOutlined";
import AudioFileOutlinedIcon from "@mui/icons-material/AudioFileOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import SlideshowOutlinedIcon from "@mui/icons-material/SlideshowOutlined";
import getFileExtension from "@/utils/getFileExtention";
import fileExtensionBase from "@/utils/fileExtensionBase";

export interface FileIconInfo {
  icon: React.ReactElement;
  color: string;
  bg: string;
}

export default function getFileIcon(filename: string | undefined | null): FileIconInfo {
  const ext = getFileExtension(filename ?? "")?.toLowerCase() ?? "";

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
