/**
 * getFileIcon — Retourne l'icône colorée, la couleur et le fond adaptés au type de fichier.
 *
 * Utilise react-file-icon (mêmes icônes que workspaces) pour une représentation
 * visuelle riche et cohérente entre les deux apps.
 */

import React from "react";
import FileTypeIcon from "@/components/FileTypeIcon";
import getFileExtension from "@/utils/getFileExtention";
import fileExtensionBase from "@/utils/fileExtensionBase";

export interface FileIconInfo {
  icon: React.ReactElement;
  color: string;
  bg: string;
}

// Couleurs par type de document
const TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  pdf:          { color: "#E53935", bg: "#FFEBEE" },
  word:         { color: "#1565C0", bg: "#E3F2FD" },
  excel:        { color: "#2E7D32", bg: "#E8F5E9" },
  "power point": { color: "#E65100", bg: "#FFF3E0" },
  image:        { color: "#7B1FA2", bg: "#F3E5F5" },
  video:        { color: "#C62828", bg: "#FFEBEE" },
  audio:        { color: "#F57C00", bg: "#FFF3E0" },
};

const DEFAULT_COLORS = { color: "#78909C", bg: "#ECEFF1" };

export default function getFileIcon(filename: string | undefined | null): FileIconInfo {
  const ext = getFileExtension(filename ?? "")?.toLowerCase() ?? "";
  const entry = fileExtensionBase.find(({ exts }) => exts.includes(ext));

  let colors = DEFAULT_COLORS;
  if (ext === "pdf") colors = TYPE_COLORS.pdf;
  else if (entry?.docType && TYPE_COLORS[entry.docType]) colors = TYPE_COLORS[entry.docType];
  else if (entry?.type && TYPE_COLORS[entry.type]) colors = TYPE_COLORS[entry.type];

  return {
    icon: <FileTypeIcon extension={ext || "txt"} size={24} />,
    color: colors.color,
    bg: colors.bg,
  };
}
