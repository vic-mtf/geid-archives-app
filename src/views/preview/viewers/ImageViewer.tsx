/**
 * ImageViewer — Affichage image avec zoom, pan, rotation, cache local.
 *
 * - Thumbnail flou → image HD progressive
 * - Cache blob local (pas de re-telechargement)
 * - Zoom molette + pinch-to-zoom tactile + double-clic
 * - Pan/drag quand zoome
 * - Rotation (bouton + touche R)
 * - Raccourcis : +/- zoom, 0 reset, R rotation
 */

import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Box, IconButton, Tooltip, Typography, CircularProgress } from "@mui/material";
import ZoomInOutlinedIcon from "@mui/icons-material/ZoomInOutlined";
import ZoomOutOutlinedIcon from "@mui/icons-material/ZoomOutOutlined";
import CropFreeOutlinedIcon from "@mui/icons-material/CropFreeOutlined";
import RotateRightOutlinedIcon from "@mui/icons-material/RotateRightOutlined";
import useAdaptiveThumbnail from "@/hooks/useAdaptiveThumbnail";
import type { RootState } from "@/redux/store";

// ── Cache module-level ──────────────────────────────────────
const imageCache = new Map<string, string>(); // fileUrl → blobURL
const MAX_CACHE = 50;

function evictOldest() {
  if (imageCache.size <= MAX_CACHE) return;
  const first = imageCache.keys().next().value;
  if (first) {
    URL.revokeObjectURL(imageCache.get(first)!);
    imageCache.delete(first);
  }
}

interface ImageViewerProps {
  fileUrl: string;
  filename: string;
  imageWidth?: number;
  imageHeight?: number;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;
const ZOOM_STEP = 0.25;

const ImageViewer = React.memo(function ImageViewer({ fileUrl, filename, imageWidth, imageHeight }: ImageViewerProps) {
  const { t } = useTranslation();
  const token = useSelector((store: RootState) => store.user.token);

  const { src: thumbSrc } = useAdaptiveThumbnail(fileUrl);
  const [fullSrc, setFullSrc] = useState<string | null>(null);
  const [loadingFull, setLoadingFull] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Pinch-to-zoom state
  const lastPinchDist = useRef(0);

  // Fetch full image avec cache
  useEffect(() => {
    if (!fileUrl) return;
    let cancelled = false;

    // 1. Cache local
    const cached = imageCache.get(fileUrl);
    if (cached) {
      setFullSrc(cached);
      setLoadingFull(false);
      return;
    }

    // 2. Telecharger
    setLoadingFull(true);
    fetch(fileUrl, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        if (cancelled) return;
        evictOldest();
        const blobUrl = URL.createObjectURL(blob);
        imageCache.set(fileUrl, blobUrl);
        setFullSrc(blobUrl);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingFull(false); });
    return () => { cancelled = true; };
  }, [fileUrl, token]);

  const displaySrc = fullSrc || thumbSrc;
  // Toujours flouter le thumbnail tant que l'image HD n'est pas chargee
  const showBlur = !fullSrc && !!thumbSrc;

  // Ratio : props backend > detecte au chargement
  const [detectedSize, setDetectedSize] = useState<{ w: number; h: number } | null>(null);
  const handleImgLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setDetectedSize({ w: img.naturalWidth, h: img.naturalHeight });
    }
  }, []);
  const aspectRatio = useMemo(() => {
    if (imageWidth && imageHeight && imageHeight > 0) return `${imageWidth} / ${imageHeight}`;
    if (detectedSize) return `${detectedSize.w} / ${detectedSize.h}`;
    return undefined;
  }, [imageWidth, imageHeight, detectedSize]);

  // Reset sur changement de fichier
  useEffect(() => { setZoom(1); setRotation(0); setPan({ x: 0, y: 0 }); setDetectedSize(null); }, [fileUrl]);

  // Zoom
  const zoomTo = useCallback((newZoom: number) => {
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    setZoom(clamped);
    if (clamped <= 1) setPan({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = useCallback(() => zoomTo(zoom + ZOOM_STEP), [zoom, zoomTo]);
  const handleZoomOut = useCallback(() => zoomTo(zoom - ZOOM_STEP), [zoom, zoomTo]);
  const handleFit = useCallback(() => { zoomTo(1); setPan({ x: 0, y: 0 }); }, [zoomTo]);
  const handleRotate = useCallback(() => setRotation((r) => (r + 90) % 360), []);

  // Molette
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    zoomTo(zoom + delta);
  }, [zoom, zoomTo]);

  // Double-clic : zoom 2x ou reset
  const handleDoubleClick = useCallback(() => {
    if (zoom > 1) { zoomTo(1); setPan({ x: 0, y: 0 }); }
    else zoomTo(2);
  }, [zoom, zoomTo]);

  // Pan (drag)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return;
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    e.preventDefault();
  }, [zoom, pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    setPan({
      x: dragStart.current.panX + (e.clientX - dragStart.current.x),
      y: dragStart.current.panY + (e.clientY - dragStart.current.y),
    });
  }, []);

  const handleMouseUp = useCallback(() => { dragging.current = false; }, []);

  // Touch: pinch-to-zoom + pan
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastPinchDist.current > 0) {
        const scale = dist / lastPinchDist.current;
        zoomTo(zoom * scale);
      }
      lastPinchDist.current = dist;
    } else if (e.touches.length === 1 && zoom > 1 && dragging.current) {
      const touch = e.touches[0];
      setPan({
        x: dragStart.current.panX + (touch.clientX - dragStart.current.x),
        y: dragStart.current.panY + (touch.clientY - dragStart.current.y),
      });
    }
  }, [zoom, zoomTo]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
    } else if (e.touches.length === 1 && zoom > 1) {
      dragging.current = true;
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, panX: pan.x, panY: pan.y };
    }
  }, [zoom, pan]);

  const handleTouchEnd = useCallback(() => {
    lastPinchDist.current = 0;
    dragging.current = false;
  }, []);

  // Raccourcis clavier
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "+" || e.key === "=") { e.preventDefault(); handleZoomIn(); }
      else if (e.key === "-") { e.preventDefault(); handleZoomOut(); }
      else if (e.key === "0") { e.preventDefault(); handleFit(); }
      else if (e.key === "r" || e.key === "R") { e.preventDefault(); handleRotate(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleZoomIn, handleZoomOut, handleFit, handleRotate]);

  const zoomPercent = Math.round(zoom * 100);

  return (
    <Box
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      sx={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        width: "100%", height: "100%", position: "relative", overflow: "hidden",
        cursor: zoom > 1 ? (dragging.current ? "grabbing" : "grab") : "default",
      }}
    >
      {/* Controles zoom/rotation */}
      <Box
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        sx={{
          position: "absolute", bottom: { xs: 16, md: 24 }, left: "50%",
          transform: "translateX(-50%)", zIndex: 10,
          display: "flex", alignItems: "center", gap: 0.5,
          bgcolor: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
          borderRadius: 2, p: 0.5, pointerEvents: "auto",
        }}
      >
        <Tooltip title={t("viewer.zoomOut")}>
          <IconButton onClick={handleZoomOut} size="small" sx={{ color: "common.white" }}>
            <ZoomOutOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Typography sx={{ color: "common.white", fontSize: 12, fontWeight: 600, minWidth: 40, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
          {zoomPercent}%
        </Typography>
        <Tooltip title={t("viewer.zoomIn")}>
          <IconButton onClick={handleZoomIn} size="small" sx={{ color: "common.white" }}>
            <ZoomInOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t("viewer.fitToScreen")}>
          <IconButton onClick={handleFit} size="small" sx={{ color: "common.white" }}>
            <CropFreeOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t("viewer.rotate") || "Rotation"}>
          <IconButton onClick={handleRotate} size="small" sx={{ color: "common.white" }}>
            <RotateRightOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Loading sans thumbnail */}
      {loadingFull && !thumbSrc && (
        <CircularProgress sx={{ color: "common.white" }} />
      )}

      {/* Image — wrapper au bon ratio + image dedans */}
      {displaySrc && (
        <Box
          sx={{
            position: "relative",
            maxWidth: zoom <= 1 ? "100%" : "none",
            maxHeight: zoom <= 1 ? "100%" : "none",
            ...(aspectRatio && { aspectRatio }),
            transform: `scale(${zoom}) rotate(${rotation}deg) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transition: dragging.current ? "none" : "transform 0.15s ease, filter 0.4s ease",
            transformOrigin: "center center",
            userSelect: "none", pointerEvents: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {/* Spinner sur l'image floue pendant le chargement HD */}
          {showBlur && loadingFull && (
            <CircularProgress size={36} sx={{ position: "absolute", zIndex: 2, color: "common.white", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.5))" }} />
          )}
          <Box
            component="img"
            src={displaySrc}
            alt={filename}
            draggable={false}
            onLoad={handleImgLoad}
            sx={{
              width: "100%", height: "100%",
              objectFit: "contain",
              filter: showBlur ? "blur(20px) saturate(1.2)" : "none",
              transition: "filter 0.4s ease",
            }}
          />
        </Box>
      )}
    </Box>
  );
});

export default ImageViewer;
