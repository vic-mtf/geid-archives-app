/**
 * getFileIcon — Retourne l'icone react-file-icon pour un fichier.
 *
 * Meme composant FileTypeIcon que workspaces — pas de couleur supplementaire,
 * react-file-icon gere ses propres couleurs par extension.
 */

import React from "react";
import FileTypeIcon from "@/components/FileTypeIcon";
import getFileExtension from "@/utils/getFileExtention";

export interface FileIconInfo {
  icon: React.ReactElement;
  color: string;
  bg: string;
}

export default function getFileIcon(filename: string | undefined | null): FileIconInfo {
  const ext = getFileExtension(filename ?? "")?.toLowerCase() ?? "";

  return {
    icon: <FileTypeIcon extension={ext || "txt"} size={24} />,
    color: "text.primary",
    bg: "transparent",
  };
}
