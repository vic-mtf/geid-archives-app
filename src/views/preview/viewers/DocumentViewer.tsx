/**
 * DocumentViewer — Lecteur de documents page par page (style Google Docs).
 *
 * - Pages rendues en images par le backend
 * - Scroll virtualise (IntersectionObserver lazy loading)
 * - Footer flottant : zoom, recherche, navigation, selection
 * - Texte selectionnable via overlay transparent
 * - Cache local des images de pages
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import scrollBarSx from "@/utils/scrollBarSx";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import {
  Box, CircularProgress, IconButton, InputBase, LinearProgress, Skeleton, Typography,
} from "@mui/material";
import ZoomInOutlinedIcon from "@mui/icons-material/ZoomInOutlined";
import ZoomOutOutlinedIcon from "@mui/icons-material/ZoomOutOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import KeyboardArrowUpOutlinedIcon from "@mui/icons-material/KeyboardArrowUpOutlined";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import FirstPageOutlinedIcon from "@mui/icons-material/FirstPageOutlined";
import LastPageOutlinedIcon from "@mui/icons-material/LastPageOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import FileTypeIcon from "@/components/FileTypeIcon";
import type { RootState } from "@/redux/store";

interface DocumentViewerProps {
  fileUrl: string;
  filename: string;
  extension: string;
}

interface TextSpan {
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

interface PageInfo {
  page: number;
  width: number;
  height: number;
  text: string;
  spans: TextSpan[];
}

interface DocInfo { pageCount: number; pages: PageInfo[]; }

function extractArchiveId(fileUrl: string): string {
  const marker = "/api/stuff/archives/file/";
  const idx = fileUrl.indexOf(marker);
  if (idx >= 0) return fileUrl.substring(idx + marker.length);
  if (fileUrl.startsWith(marker)) return fileUrl.substring(marker.length);
  return fileUrl;
}

// Cache module-level
const pageImageCache = new Map<string, string>();
const MAX_PAGE_CACHE = 200;
function evictPageCache() {
  if (pageImageCache.size <= MAX_PAGE_CACHE) return;
  const first = pageImageCache.keys().next().value;
  if (first) { URL.revokeObjectURL(pageImageCache.get(first)!); pageImageCache.delete(first); }
}
const docInfoCache = new Map<string, DocInfo>();

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];

const DocumentViewer = React.memo(function DocumentViewer({ fileUrl, extension }: DocumentViewerProps) {
  const { t } = useTranslation();
  const token = useSelector((store: RootState) => (store.user as any)?.token as string);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [docInfo, setDocInfo] = useState<DocInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  // Search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [searchIndex, setSearchIndex] = useState(0);

  const filePath = useMemo(() => extractArchiveId(fileUrl), [fileUrl]);

  // Charger doc info
  useEffect(() => {
    if (!filePath || !token) return;
    let cancelled = false;
    setLoading(true);
    setError(false);

    const cached = docInfoCache.get(filePath);
    if (cached) { setDocInfo(cached); setLoading(false); return; }

    const encodedPath = filePath;
    fetch(`/api/stuff/archives/doc-info/${encodedPath}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then((info: DocInfo) => { if (!cancelled) { docInfoCache.set(filePath, info); setDocInfo(info); } })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filePath, token]);

  // Recherche
  useEffect(() => {
    if (!searchQuery.trim() || !docInfo) { setSearchResults([]); setSearchIndex(0); return; }
    const q = searchQuery.toLowerCase();
    const results = (docInfo.pages || []).filter((p) => (p.text || "").toLowerCase().includes(q)).map((p) => p.page);
    setSearchResults(results);
    setSearchIndex(0);
    if (results.length > 0) scrollToPage(results[0]);
  }, [searchQuery, docInfo]);

  const scrollToPage = useCallback((page: number) => {
    const el = document.getElementById(`doc-page-${page}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setCurrentPage(page);
  }, []);

  const nextSearchResult = useCallback(() => {
    if (searchResults.length === 0) return;
    const next = (searchIndex + 1) % searchResults.length;
    setSearchIndex(next);
    scrollToPage(searchResults[next]);
  }, [searchResults, searchIndex, scrollToPage]);

  const prevSearchResult = useCallback(() => {
    if (searchResults.length === 0) return;
    const prev = (searchIndex - 1 + searchResults.length) % searchResults.length;
    setSearchIndex(prev);
    scrollToPage(searchResults[prev]);
  }, [searchResults, searchIndex, scrollToPage]);

  // Zoom
  const zoomIn = useCallback(() => {
    const idx = ZOOM_LEVELS.findIndex((z) => z >= zoom);
    const next = idx < ZOOM_LEVELS.length - 1 ? ZOOM_LEVELS[idx + 1] : ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
    setZoom(next);
  }, [zoom]);
  const zoomOut = useCallback(() => {
    const idx = ZOOM_LEVELS.findIndex((z) => z >= zoom);
    const prev = idx > 0 ? ZOOM_LEVELS[idx - 1] : ZOOM_LEVELS[0];
    setZoom(prev);
  }, [zoom]);

  // Detecter page courante au scroll
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !docInfo) return;
    const container = scrollRef.current;
    const pages = container.querySelectorAll("[data-page]");
    let closest = 1;
    let minDist = Infinity;
    pages.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const dist = Math.abs(rect.top - container.getBoundingClientRect().top);
      if (dist < minDist) { minDist = dist; closest = parseInt(el.getAttribute("data-page") || "1"); }
    });
    setCurrentPage(closest);
  }, [docInfo]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.ctrlKey && e.key === "f") { e.preventDefault(); setSearchOpen(true); }
      else if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomIn(); }
      else if (e.key === "-") { e.preventDefault(); zoomOut(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [zoomIn, zoomOut]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", gap: 2 }}>
        <FileTypeIcon extension={extension} size={64} />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <CircularProgress size={20} sx={{ color: "common.white" }} />
          <Typography sx={{ color: "common.white", fontSize: 14 }}>{t("viewer.converting") || "Preparation du document..."}</Typography>
        </Box>
        <LinearProgress color="inherit" sx={{ width: 200, height: 2, borderRadius: 1, opacity: 0.5 }} />
      </Box>
    );
  }

  if (error || !docInfo || docInfo.pageCount === 0) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", gap: 2 }}>
        <DescriptionOutlinedIcon sx={{ fontSize: 64, color: "common.white", opacity: 0.3 }} />
        <Typography sx={{ color: "common.white" }}>{t("viewer.noPreview")}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", position: "relative" }}>
      {/* Pages scroll */}
      <Box
        ref={scrollRef}
        onScroll={handleScroll}
        sx={{
          flex: 1, overflowY: "auto", overflowX: "auto",
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: 1, py: 2, px: 1, ...scrollBarSx,
        }}
      >
        {(docInfo.pages || []).map((pageData) => (
          <PageImage
            key={pageData.page}
            filePath={filePath}
            pageData={pageData}
            zoom={zoom}
            token={token || ""}
            isSearchMatch={searchResults.includes(pageData.page)}
            searchQuery={searchQuery}
          />
        ))}
      </Box>

      {/* Footer flottant */}
      <Box
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        sx={{
          position: "absolute", bottom: { xs: 12, md: 20 }, left: "50%",
          transform: "translateX(-50%)", zIndex: 10,
          display: "flex", alignItems: "center", gap: 0.5,
          bgcolor: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)",
          borderRadius: 2, px: 1.5, py: 0.5,
          border: 1, borderColor: "rgba(255,255,255,0.08)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        }}
      >
        {/* Navigation pages */}
        <IconButton onClick={() => scrollToPage(1)} sx={{ color: "common.white", minWidth: 36, minHeight: 36 }}>
          <FirstPageOutlinedIcon sx={{ fontSize: 20 }} />
        </IconButton>
        <IconButton onClick={() => scrollToPage(Math.max(1, currentPage - 1))} sx={{ color: "common.white", minWidth: 36, minHeight: 36 }}>
          <KeyboardArrowUpOutlinedIcon sx={{ fontSize: 20 }} />
        </IconButton>
        <Typography sx={{ color: "common.white", fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums", minWidth: 60, textAlign: "center" }}>
          {currentPage} / {docInfo.pageCount}
        </Typography>
        <IconButton onClick={() => scrollToPage(Math.min(docInfo.pageCount, currentPage + 1))} sx={{ color: "common.white", minWidth: 36, minHeight: 36 }}>
          <KeyboardArrowDownOutlinedIcon sx={{ fontSize: 20 }} />
        </IconButton>
        <IconButton onClick={() => scrollToPage(docInfo.pageCount)} sx={{ color: "common.white", minWidth: 36, minHeight: 36 }}>
          <LastPageOutlinedIcon sx={{ fontSize: 20 }} />
        </IconButton>

        <Box sx={{ width: 1, height: 24, bgcolor: "rgba(255,255,255,0.15)", mx: 0.5 }} />

        {/* Zoom */}
        <IconButton onClick={zoomOut} sx={{ color: "common.white", minWidth: 36, minHeight: 36 }}>
          <ZoomOutOutlinedIcon sx={{ fontSize: 20 }} />
        </IconButton>
        <Typography sx={{ color: "common.white", fontSize: 12, fontWeight: 600, minWidth: 40, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
          {Math.round(zoom * 100)}%
        </Typography>
        <IconButton onClick={zoomIn} sx={{ color: "common.white", minWidth: 36, minHeight: 36 }}>
          <ZoomInOutlinedIcon sx={{ fontSize: 20 }} />
        </IconButton>

        <Box sx={{ width: 1, height: 24, bgcolor: "rgba(255,255,255,0.15)", mx: 0.5 }} />

        {/* Recherche */}
        {searchOpen ? (
          <>
            <InputBase
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") nextSearchResult(); if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); } }}
              placeholder={t("search.placeholder") || "Rechercher..."}
              sx={{ color: "common.white", fontSize: 13, width: { xs: 120, sm: 160 }, bgcolor: "rgba(255,255,255,0.1)", borderRadius: 1, px: 1, py: 0.5 }}
            />
            {searchResults.length > 0 && (
              <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 11, whiteSpace: "nowrap", mx: 0.5 }}>
                {searchIndex + 1}/{searchResults.length}
              </Typography>
            )}
            {searchQuery && searchResults.length === 0 && (
              <Typography sx={{ color: "error.light", fontSize: 11, whiteSpace: "nowrap", mx: 0.5 }}>
                0
              </Typography>
            )}
            <IconButton onClick={prevSearchResult} sx={{ color: "common.white", minWidth: 32, minHeight: 32 }}>
              <KeyboardArrowUpOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton onClick={nextSearchResult} sx={{ color: "common.white", minWidth: 32, minHeight: 32 }}>
              <KeyboardArrowDownOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton onClick={() => { setSearchOpen(false); setSearchQuery(""); }} sx={{ color: "common.white", minWidth: 32, minHeight: 32 }}>
              <CloseOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </>
        ) : (
          <IconButton onClick={() => setSearchOpen(true)} sx={{ color: "common.white", minWidth: 36, minHeight: 36 }}>
            <SearchOutlinedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        )}
      </Box>
    </Box>
  );
});

/**
 * TextSpanOverlay — Un span de texte positionne et etire pour matcher l'image PDF.
 * Mesure la largeur naturelle du texte puis applique scaleX pour correspondre exactement.
 */
const TextSpanOverlay = React.memo(function TextSpanOverlay({
  span, pdfW, pdfH, displayW, displayH, searchQuery,
}: {
  span: TextSpan; pdfW: number; pdfH: number; displayW: number; displayH: number; searchQuery: string;
}) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [scaleX, setScaleX] = useState(1);

  // Position et taille en pixels absolus
  const left = (span.left / pdfW) * displayW;
  const top = (span.top / pdfH) * displayH;
  const targetW = (span.width / pdfW) * displayW;
  const height = (span.height / pdfH) * displayH;
  const fontSize = (span.fontSize / pdfH) * displayH;

  // Mesurer et calculer scaleX apres le premier render
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

/** Surligne les occurrences de query dans le texte d'un span */
function highlightText(text: string, query: string): React.ReactNode {
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

/** Page individuelle avec lazy loading + texte positionne selectionnable */
const PageImage = React.memo(function PageImage({
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

  // Dimensions rendues (le DPI de rendu est 200, les coords PDF sont en 72 DPI)
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
      {/* Image de la page */}
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

      {/* Overlay texte — invisible, selectionnable, etire pour matcher l'image */}
      {src && spans && spans.length > 0 && (
        <Box sx={{ position: "absolute", inset: 0, userSelect: "text", cursor: "text", overflow: "hidden" }}>
          {spans.map((span, i) => (
            <TextSpanOverlay key={i} span={span} pdfW={pdfW} pdfH={pdfH} displayW={displayW} displayH={displayH} searchQuery={searchQuery} />
          ))}
        </Box>
      )}

      {/* Numero de page */}
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

export default DocumentViewer;
