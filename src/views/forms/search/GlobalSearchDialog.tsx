/**
 * GlobalSearchDialog
 *
 * Dialogue de recherche unifiée — Archives numériques + Documents physiques.
 *
 * Déclenchement : CustomEvent "__global_search_open" (sans données)
 * Raccourci clavier : Ctrl+K / ⌘K (écouté sur window)
 *
 * Résultats groupés en deux sections :
 *   - Archives numériques  → endpoint GET /api/stuff/archives/search?q=…
 *   - Documents physiques  → inclus dans la même réponse
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import QrCode2OutlinedIcon from "@mui/icons-material/QrCode2Outlined";
import { useTranslation } from "react-i18next";
import useToken from "@/hooks/useToken";
import useAxios from "@/hooks/useAxios";
import useNavigateSetState from "@/hooks/useNavigateSetState";
import { STATUS_LABEL, STATUS_COLOR, normalizeStatus } from "@/constants/lifecycle";
import formatDate from "@/utils/formatTime";
import deepNavigate from "@/utils/deepNavigate";
import getFileIcon from "@/utils/getFileIcon";

// ── Mise en gras du texte trouvé ────────────────────────────

function stripAccents(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Retourne un fragment JSX avec les occurrences en gras */
function highlightMatch(text: string | undefined | null, query: string) {
  if (!text || !query || query.length < 2) return text ?? "";
  const normalizedText = stripAccents(text);
  const normalizedQuery = stripAccents(query);
  const regex = new RegExp(`(${normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  // Trouver les positions de match dans la version normalisée
  const parts: Array<{ text: string; bold: boolean }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(normalizedText)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), bold: false });
    }
    parts.push({ text: text.slice(match.index, match.index + match[0].length), bold: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), bold: false });
  }
  if (parts.length === 0) return text;
  return (
    <>
      {parts.map((p, i) => p.bold ? <strong key={i}>{p.text}</strong> : <span key={i}>{p.text}</span>)}
    </>
  );
}

// ── Événement déclencheur ──────────────────────────────────
const OPEN_EVENT = "__global_search_open";

// ── Types locaux ──────────────────────────────────────────

interface ArchiveResult {
  _id: string;
  designation?: string;
  description?: string;
  folder?: string;
  classNumber?: string;
  refNumber?: string;
  status?: string;
  validated?: boolean;
  createdAt?: string;
  fileUrl?: string;
}

interface RecordResult {
  _id: string;
  internalNumber: string;
  refNumber?: string;
  subject?: string;
  category?: string;
  nature?: string;
  qrCode?: string;
  editionDate?: string;
}

interface SearchResponse {
  query: string;
  total: number;
  archives: ArchiveResult[];
  records: RecordResult[];
}

// ── Composant ─────────────────────────────────────────────

export default function GlobalSearchDialog() {
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelRef = useRef(false);
  const navigateTo = useNavigateSetState();

  const token = useToken(); // "Bearer <token>" ou null
  const headers = { Authorization: token ?? "" };

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery("");
    setDebouncedQuery("");
    setResults(null);
    setSearchError(false);
    cancelRef.current = true;
  }, []);

  // ── Deep navigate handlers ────────────────────────────────
  const [, executePath] = useAxios({ headers }, { manual: true });

  /** Clic sur une archive → naviguer vers Archives + ouvrir le détail */
  const handleArchiveClick = useCallback((archiveId: string) => {
    handleClose();
    deepNavigate(navigateTo, { tab: "archiveManager", archiveId });
  }, [navigateTo, handleClose]);

  /** Clic sur un record → charger le chemin complet puis naviguer vers Physique */
  const handleRecordClick = useCallback(async (recordId: string) => {
    handleClose();
    try {
      const res = await executePath({ url: `/api/stuff/archives/physical/path/record/${recordId}` });
      const path = ((res.data as unknown) as { path: Array<{ id: string; label: string; level: string }> }).path ?? [];
      deepNavigate(navigateTo, { tab: "physicalArchive", physicalPath: path });
    } catch {
      // Fallback — juste aller vers l'onglet
      deepNavigate(navigateTo, { tab: "physicalArchive" });
    }
  }, [navigateTo, executePath, handleClose]);

  const [, execute] = useAxios<SearchResponse>(
    { headers: { Authorization: token ?? "" } },
    { manual: true }
  );

  // ── Écoute du déclencheur + raccourci clavier ──────────────
  useEffect(() => {
    const root = document.getElementById("root");
    const openDialog = () => setOpen(true);
    root?.addEventListener(OPEN_EVENT, openDialog);

    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      root?.removeEventListener(OPEN_EVENT, openDialog);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // ── Debounce de la saisie (350 ms) ─────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // ── Appel API déclenché par debouncedQuery ─────────────────
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults(null);
      setSearchError(false);
      return;
    }
    cancelRef.current = false;
    setLoading(true);
    setSearchError(false);

    execute({
      url: `/api/stuff/archives/search?q=${encodeURIComponent(debouncedQuery)}&limit=15`,
    })
      .then((res) => {
        if (!cancelRef.current) {
          setResults(res.data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelRef.current) {
          setSearchError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelRef.current = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const archives = results?.archives ?? [];
  const records  = results?.records  ?? [];
  const hasResults = archives.length > 0 || records.length > 0;
  const shouldSearch = debouncedQuery.length >= 2;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 2, overflow: "hidden", height: fullScreen ? "100%" : "70vh", display: "flex", flexDirection: "column" } }}>
      {/* Barre de recherche */}
      <Box
        px={2}
        py={1.5}
        display="flex"
        alignItems="center"
        gap={1}
        borderBottom={1}
        borderColor="divider">
        <SearchOutlinedIcon color="action" />
        <TextField
          autoFocus
          fullWidth
          variant="standard"
          placeholder={t("search.placeholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            disableUnderline: true,
            sx: { fontSize: "1rem" },
            endAdornment: loading ? (
              <InputAdornment position="end">
                <CircularProgress size={16} />
              </InputAdornment>
            ) : query ? (
              <InputAdornment position="end">
                <Tooltip title={t("search.clearSearch")}>
                  <IconButton size="small" onClick={() => setQuery("")} sx={{ bgcolor: "action.hover", borderRadius: 1, px: 0.75 }}>
                    <CloseOutlinedIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ) : null,
          }}
        />
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        <Tooltip title={t("search.closeDialog")}>
          <IconButton size="small" onClick={handleClose}>
            <CloseOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <DialogContent sx={{ p: 0, flex: 1, overflow: "auto" }}>
        {/* État initial */}
        {!shouldSearch && !loading && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            gap={1}
            py={5}>
            <SearchOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
            <Typography color="text.secondary" variant="body2">
              {t("search.minChars")}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {t("search.shortcutHint")}
            </Typography>
          </Box>
        )}

        {/* Aucun résultat */}
        {shouldSearch && !loading && !searchError && results !== null && !hasResults && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            gap={1}
            py={5}>
            <Typography color="text.secondary" variant="body2" dangerouslySetInnerHTML={{ __html: t("search.noResults", { query: debouncedQuery }) }} />
            <Typography variant="caption" color="text.disabled">
              {t("search.noResultsHint")}
            </Typography>
          </Box>
        )}

        {/* Erreur */}
        {searchError && (
          <Box py={4} textAlign="center">
            <Typography color="error" variant="body2">
              {t("search.searchFailed")}
            </Typography>
          </Box>
        )}

        {/* Résultats */}
        {hasResults && (
          <Stack>
            {/* Archives numériques */}
            {archives.length > 0 && (
              <Box>
                <Box px={2} py={1} display="flex" alignItems="center" gap={1} bgcolor="action.hover">
                  <ArticleOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                  <Typography variant="caption" fontWeight="bold" color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
                    {t("search.digitalArchives")}
                  </Typography>
                  <Chip label={archives.length} size="small" />
                </Box>
                <List disablePadding dense>
                  {archives.map((arc) => {
                    const norm = normalizeStatus(arc.status, arc.validated);
                    const fi = getFileIcon(arc.fileUrl ?? arc.designation);
                    return (
                      <ListItemButton key={arc._id} sx={{ px: 2, py: 0.75 }} onClick={() => handleArchiveClick(arc._id)}>
                        <ListItemIcon sx={{ minWidth: 32, color: fi.color }}>
                          {React.cloneElement(fi.icon, { fontSize: "small" })}
                        </ListItemIcon>
                        <ListItemText
                          primary={highlightMatch(arc.designation ?? arc.folder ?? "", debouncedQuery)}
                          secondary={
                            <span>
                              {arc.classNumber && <span>N°&nbsp;{arc.classNumber} · </span>}
                              {arc.description
                                ? highlightMatch(
                                    arc.description.slice(0, 100) + (arc.description.length > 100 ? "…" : ""),
                                    debouncedQuery
                                  )
                                : arc.folder ? highlightMatch(arc.folder, debouncedQuery) : ""}
                            </span>
                          }
                          primaryTypographyProps={{ noWrap: true, variant: "body2", fontWeight: 500 }}
                          secondaryTypographyProps={{ noWrap: true, variant: "caption" }}
                        />
                        <Chip
                          label={STATUS_LABEL[norm] ?? norm}
                          color={STATUS_COLOR[norm] ?? "default"}
                          size="small"
                          variant="outlined"
                          sx={{ ml: 1, flexShrink: 0 }}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              </Box>
            )}

            {archives.length > 0 && records.length > 0 && <Divider />}

            {/* Documents physiques */}
            {records.length > 0 && (
              <Box>
                <Box px={2} py={1} display="flex" alignItems="center" gap={1} bgcolor="action.hover">
                  <FolderOpenOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                  <Typography variant="caption" fontWeight="bold" color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
                    {t("search.physicalDocuments")}
                  </Typography>
                  <Chip label={records.length} size="small" />
                </Box>
                <List disablePadding dense>
                  {records.map((rec) => (
                    <ListItemButton key={rec._id} sx={{ px: 2, py: 0.75 }} onClick={() => handleRecordClick(rec._id)}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {rec.qrCode
                          ? <QrCode2OutlinedIcon fontSize="small" color="action" />
                          : <FolderOpenOutlinedIcon fontSize="small" color="action" />}
                      </ListItemIcon>
                      <ListItemText
                        primary={highlightMatch(rec.subject ?? rec.internalNumber, debouncedQuery)}
                        secondary={
                          <span>
                            {highlightMatch(rec.internalNumber, debouncedQuery)}
                            {rec.category && <span> · {highlightMatch(rec.category, debouncedQuery)}</span>}
                            {rec.editionDate && <span> · {formatDate(rec.editionDate)}</span>}
                          </span>
                        }
                        primaryTypographyProps={{ noWrap: true, variant: "body2", fontWeight: 500 }}
                        secondaryTypographyProps={{ noWrap: true, variant: "caption" }}
                      />
                      {rec.nature && (
                        <Chip
                          label={rec.nature}
                          size="small"
                          variant="outlined"
                          sx={{ ml: 1, flexShrink: 0 }}
                        />
                      )}
                    </ListItemButton>
                  ))}
                </List>
              </Box>
            )}
          </Stack>
        )}

        {/* Total */}
        {hasResults && (
          <Box px={2} py={1} borderTop={1} borderColor="divider" textAlign="right">
            <Typography variant="caption" color="text.secondary">
              {t("search.totalResults", { count: results?.total, query: debouncedQuery })}
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
