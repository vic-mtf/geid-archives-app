/**
 * UnknownViewer — Affichage de secours pour les fichiers non pris en charge.
 *
 * Affiche l'icone de type, le nom, la taille et un bouton de telechargement.
 */

import React from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, Typography } from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import FileTypeIcon from "@/components/FileTypeIcon";
import normaliseOctetSize from "@/utils/normaliseOctetSize";

interface UnknownViewerProps {
  filename: string;
  extension: string;
  size?: number;
  onDownload: () => void;
}

const UnknownViewer = React.memo(function UnknownViewer({
  filename,
  extension,
  size,
  onDownload,
}: UnknownViewerProps) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        gap: 2,
        px: 2,
      }}
    >
      <FileTypeIcon extension={extension} size={80} />

      <Typography variant="h6" sx={{ color: "common.white", textAlign: "center" }} noWrap>
        {filename}
      </Typography>

      {size != null && (
        <Typography variant="body2" sx={{ color: "common.white", opacity: 0.7 }}>
          {normaliseOctetSize(size)}
        </Typography>
      )}

      <Typography variant="body2" sx={{ color: "common.white", opacity: 0.5 }}>
        {t("viewer.noPreview")}
      </Typography>

      <Button
        variant="outlined"
        startIcon={<DownloadOutlinedIcon />}
        onClick={onDownload}
        sx={{
          mt: 1,
          color: "common.white",
          borderColor: "rgba(255,255,255,0.4)",
          "&:hover": { borderColor: "common.white", bgcolor: "rgba(255,255,255,0.08)" },
        }}
      >
        {t("viewer.download")}
      </Button>
    </Box>
  );
});

export default UnknownViewer;
