/**
 * FileTypeIcon — Icône de type de fichier moderne via react-file-icon.
 * Utilisable comme composant React directement.
 */

import React from "react";
import { FileIcon, defaultStyles, type DefaultExtensionType } from "react-file-icon";
import { Box } from "@mui/material";

interface FileTypeIconProps {
  extension?: string;
  size?: number;
}

const FileTypeIcon = React.memo(function FileTypeIcon({ extension, size = 40 }: FileTypeIconProps) {
  const ext = (extension || "txt").toLowerCase() as DefaultExtensionType;
  const style = defaultStyles[ext] || defaultStyles.txt || {};

  return (
    <Box sx={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <FileIcon extension={ext} {...style} />
    </Box>
  );
});

export default FileTypeIcon;
