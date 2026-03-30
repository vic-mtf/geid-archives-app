/**
 * DocumentViewer — Affichage PDF et documents Office pour archives.
 *
 * Fetch le fichier via l'endpoint authentifie, affiche dans un iframe.
 * Cache blob local entre ouvertures.
 */

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Box, CircularProgress, Typography } from "@mui/material";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import FileTypeIcon from "@/components/FileTypeIcon";
import type { RootState } from "@/redux/store";

interface DocumentViewerProps {
  fileUrl: string;
  filename: string;
  extension: string;
}

const docCache = new Map<string, string>();
const MAX_CACHE = 15;
function evictOldest() {
  if (docCache.size <= MAX_CACHE) return;
  const first = docCache.keys().next().value;
  if (first) { URL.revokeObjectURL(docCache.get(first)!); docCache.delete(first); }
}

const DocumentViewer = React.memo(function DocumentViewer({ fileUrl, filename, extension }: DocumentViewerProps) {
  const { t } = useTranslation();
  const token = useSelector((store: RootState) => (store.user as any)?.token as string);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!fileUrl || !token) return;
    let cancelled = false;
    const cached = docCache.get(fileUrl);
    if (cached) { setBlobUrl(cached); setLoading(false); setError(false); return; }
    setLoading(true); setError(false); setBlobUrl(null);
    fetch(fileUrl, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { if (!res.ok) throw new Error(); return res.blob(); })
      .then((blob) => {
        if (cancelled) return;
        evictOldest();
        const url = URL.createObjectURL(blob);
        docCache.set(fileUrl, url);
        setBlobUrl(url);
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fileUrl, token]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", gap: 2 }}>
        <FileTypeIcon extension={extension} size={64} />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <CircularProgress size={20} sx={{ color: "common.white" }} />
          <Typography sx={{ color: "common.white", fontSize: 14 }}>{t("viewer.loading")}</Typography>
        </Box>
      </Box>
    );
  }

  if (error || !blobUrl) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", gap: 2 }}>
        <DescriptionOutlinedIcon sx={{ fontSize: 64, color: "common.white", opacity: 0.3 }} />
        <Typography sx={{ color: "common.white" }}>{t("viewer.noPreview")}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Box component="iframe" src={blobUrl} title={filename}
        sx={{ width: "100%", height: "100%", border: "none", borderRadius: 1, bgcolor: "common.white" }}
      />
    </Box>
  );
});

export default DocumentViewer;
