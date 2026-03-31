/**
 * DocumentPageComponents — Composants de rendu de page pour DocumentViewer.
 *
 * - PageImage : page individuelle avec lazy loading + texte sélectionnable
 * - TextSpanOverlay : span de texte positionné et étiré pour matcher l'image PDF
 * - highlightText : surligne les occurrences de recherche
 */

import React, { useEffect, useRef, useState } from "react";
import { Box, CircularProgress, Skeleton, Typography } from "@mui/material";

export interface TextSpan {
  text: string;
  top: number;
  left: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
}

export interface PageInfo {
  page: number;
  width: number;
  height: number;
  text: string;
  spans: TextSpan[];
}

// ── Cache module-level ───────────────────────────────────────

const pageImageCache = new Map<string, string>();
const MAX_PAGE_CACHE = 200;

function evictPageCache() {
  if (pageImageCache.size <= MAX_PAGE_CACHE) return;
  const first = pageImageCache.keys().next().value;
  if (first) { URL.revokeObjectURL(pageImageCache.get(first)!); pageImageCache.delete(first); }
}

// ── highlightText ────────────────────────────────────────────

export function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const q = query.toLowerCase();
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  while (remaining.length > 0) {
    const idx = remaining.toLowerCase().indexOf(q);
    if (idx === -1) { parts.push(remaining); break; }
    if (idx > 0) parts.push(remaining.substring(0, idx));
    parts.push(
      <mark key={key++} style={{ backgroundColor: "rgba(255, 213, 0, 0.55)", color: "inherit", borderRadius: 2, padding: 0 }}>
        {remaining.substring(idx, idx + query.length)}
      </mark>
    );
    remaining = remaining.substring(idx + query.length);
  }
  return <>{parts}</>;
}

// ── TextSpanOverlay ──────────────────────────────────────────

export const TextSpanOverlay = React.memo(function TextSpanOverlay({
  span, pdfW, pdfH, displayW, displayH, searchQuery,
}: {
  span: TextSpan; pdfW: number; pdfH: number; displayW: number; displayH: number; searchQuery: string;
}) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [scaleX, setScaleX] = useState(1);

  const left = (span.left / pdfW) * displayW;
  const top = (span.top / pdfH) * displayH;
  const targetW = (span.width / pdfW) * displayW;
  const height = (span.height / pdfH) * displayH;
  const fontSize = (span.fontSize / pdfH) * displayH;

  useEffect(() => {
    if (!spanRef.current) return;
    const natural = spanRef.current.offsetWidth;
    if (natural > 0 && targetW > 0) {
      setScaleX(targetW / natural);
    }
  }, [targetW, span.text, fontSize]);

  return (
    <span
      ref={spanRef}
      style={{
        position: "absolute",
        left, top, height,
        fontSize,
        fontFamily: span.fontFamily || "serif",
        fontWeight: span.bold ? 700 : 400,
        fontStyle: span.italic ? "italic" : "normal",
        lineHeight: `${height}px`,
        color: "transparent",
        whiteSpace: "pre",
        transformOrigin: "left top",
        transform: `scaleX(${scaleX})`,
      }}
    >
      {highlightText(span.text, searchQuery)}
    </span>
  );
});

// ── PageImage ────────────────────────────────────────────────

export const PageImage = React.memo(function PageImage({
  filePath, pageData, zoom, token, isSearchMatch, searchQuery,
}: {
  filePath: string; pageData: PageInfo; zoom: number; token: string;
  isSearchMatch: boolean; searchQuery: string;
}) {
  const { page, width: pdfW = 595, height: pdfH = 842, spans = [] } = pageData || {};
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // IntersectionObserver lazy loading
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { rootMargin: "600px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Charger l'image
  useEffect(() => {
    if (!visible || src) return;
    const cacheKey = `${filePath}::page-${page}`;
    const cached = pageImageCache.get(cacheKey);
    if (cached) { setSrc(cached); return; }

    setLoading(true);
    const encodedPath = filePath;
    fetch(`/api/stuff/archives/doc-page/${encodedPath}?page=${page}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { if (!res.ok) throw new Error(); return res.blob(); })
      .then((blob) => { evictPageCache(); const url = URL.createObjectURL(blob); pageImageCache.set(cacheKey, url); setSrc(url); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visible, filePath, page, token, src]);

  const scale = zoom;
  const displayW = Math.round(pdfW * scale);
  const displayH = Math.round(pdfH * scale);

  return (
    <Box
      ref={ref}
      id={`doc-page-${page}`}
      data-page={page}
      sx={{
        width: displayW, height: displayH,
        bgcolor: "common.white", borderRadius: 0.5, boxShadow: 6,
        overflow: "hidden", position: "relative", flexShrink: 0,
        outline: isSearchMatch ? "3px solid" : "none", outlineColor: "primary.main",
      }}
    >
      {src ? (
        <Box component="img" src={src} draggable={false}
          sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", userSelect: "none", pointerEvents: "none" }}
        />
      ) : loading ? (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Skeleton variant="rectangular" width="100%" height="100%" />
      )}

      {src && spans && spans.length > 0 && (
        <Box sx={{ position: "absolute", inset: 0, userSelect: "text", cursor: "text", overflow: "hidden" }}>
          {spans.map((span, i) => (
            <TextSpanOverlay key={i} span={span} pdfW={pdfW} pdfH={pdfH} displayW={displayW} displayH={displayH} searchQuery={searchQuery} />
          ))}
        </Box>
      )}

      <Typography sx={{
        position: "absolute", bottom: 4, right: 8,
        fontSize: 10, color: "text.disabled", fontVariantNumeric: "tabular-nums",
        pointerEvents: "none",
      }}>
        {page}
      </Typography>
    </Box>
  );
});
