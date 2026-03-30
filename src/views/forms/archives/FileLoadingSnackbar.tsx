/**
 * FileLoadingSnackbar — Barre de chargement de fichier avec progression visuelle.
 *
 * Affiche le nom du fichier, une barre de progression, la taille téléchargée,
 * et un bouton pour annuler le chargement.
 */

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import {
  setProgressCallback,
  cancelFileLoading,
  formatSize,
  type FileLoadingState,
} from "@/utils/openArchiveFile";

const INITIAL: FileLoadingState = {
  open: false, fileName: "", progress: 0, received: 0, total: 0, error: null, cancelled: false,
};

const FileLoadingSnackbar = React.memo(function FileLoadingSnackbar() {
  const { t } = useTranslation();
  const [state, setState] = useState<FileLoadingState>(INITIAL);

  useEffect(() => {
    setProgressCallback(setState);
    return () => setProgressCallback(null);
  }, []);

  if (!state.open) return null;

  const isError = !!state.error;
  const isCancelled = state.cancelled;
  const isLoading = !isError && !isCancelled;
  const hasTotal = state.total > 0;

  return (
    <Paper
      elevation={6}
      sx={{
        position: "fixed",
        bottom: { xs: 16, sm: 24 },
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1400,
        minWidth: { xs: "calc(100vw - 32px)", sm: 380 },
        maxWidth: { xs: "calc(100vw - 32px)", sm: 440 },
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      {/* Barre de progression en haut */}
      {isLoading && (
        <LinearProgress
          variant={hasTotal ? "determinate" : "indeterminate"}
          value={hasTotal ? state.progress : undefined}
          sx={{ height: 3 }}
        />
      )}

      <Box sx={{ px: 2, py: 1.5 }}>
        {/* Erreur */}
        {isError && (
          <Stack direction="row" alignItems="flex-start" spacing={1}>
            <ErrorOutlineOutlinedIcon color="error" sx={{ mt: 0.25, flexShrink: 0 }} />
            <Box flex={1}>
              <Typography variant="body2" fontWeight={600} color="error.main">
                {t("files.cannotOpenFile")}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={0.25}>
                {state.error}
              </Typography>
            </Box>
          </Stack>
        )}

        {/* Annulé */}
        {isCancelled && (
          <Stack direction="row" alignItems="center" spacing={1}>
            <CloseOutlinedIcon color="warning" sx={{ flexShrink: 0 }} />
            <Typography variant="body2" color="text.secondary">
              {t("files.cancelled", { fileName: state.fileName })}
            </Typography>
          </Stack>
        )}

        {/* Chargement en cours */}
        {isLoading && (
          <Stack spacing={0.5}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="body2" fontWeight={500} noWrap sx={{ flex: 1, mr: 1 }}>
                {t("files.preparingFile", { fileName: state.fileName })}
              </Typography>
              <Button
                size="small"
                color="inherit"
                onClick={cancelFileLoading}
                sx={{ minWidth: 0, fontSize: "0.75rem", textTransform: "none", flexShrink: 0 }}
              >
                {t("common.cancel")}
              </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {hasTotal
                ? t("files.progressWithTotal", { received: formatSize(state.received), total: formatSize(state.total), percent: state.progress })
                : state.received > 0
                  ? t("files.progressWithoutTotal", { received: formatSize(state.received) })
                  : t("files.connecting")
              }
            </Typography>
          </Stack>
        )}
      </Box>
    </Paper>
  );
});

export default FileLoadingSnackbar;
