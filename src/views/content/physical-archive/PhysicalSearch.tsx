/**
 * PhysicalSearch — Recherche dans l'archivage physique via API backend.
 *
 * Cherche dans tous les niveaux : conteneurs, étagères, niveaux,
 * classeurs, dossiers, documents et archives numériques.
 * Cache les résultats en local pour les requêtes déjà effectuées.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { setCacheEntry } from "@/redux/data";
import type { ApiCacheEntry } from "@/redux/data";
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import SearchRoundedIcon      from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon       from "@mui/icons-material/CloseRounded";
import WarehouseOutlinedIcon  from "@mui/icons-material/WarehouseOutlined";
import DnsOutlinedIcon        from "@mui/icons-material/DnsOutlined";
import ViewStreamOutlinedIcon from "@mui/icons-material/ViewStreamOutlined";
import StyleOutlinedIcon      from "@mui/icons-material/StyleOutlined";
import FolderOutlinedIcon     from "@mui/icons-material/FolderOutlined";
import TopicOutlinedIcon      from "@mui/icons-material/TopicOutlined";
import ArticleOutlinedIcon    from "@mui/icons-material/ArticleOutlined";
import useAxios from "@/hooks/useAxios";

// ── Types ────────────────────────────────────────────────────

type Level = "container" | "shelf" | "floor" | "binder" | "record" | "document" | "archive";

interface SearchResult {
  _id: string;
  _level: Level;
  _label: string;
  [key: string]: unknown;
}

// ── Config icônes par niveau ─────────────────────────────────

const LEVEL_ICON: Record<Level, React.ReactNode> = {
  container: <WarehouseOutlinedIcon sx={{ fontSize: 18, color: "#5C6BC0" }} />,
  shelf:     <DnsOutlinedIcon sx={{ fontSize: 18, color: "#26A69A" }} />,
  floor:     <ViewStreamOutlinedIcon sx={{ fontSize: 18, color: "#42A5F5" }} />,
  binder:    <StyleOutlinedIcon sx={{ fontSize: 18, color: "#FFA726" }} />,
  record:    <FolderOutlinedIcon sx={{ fontSize: 18, color: "#AB47BC" }} />,
  document:  <TopicOutlinedIcon sx={{ fontSize: 18, color: "#78909C" }} />,
  archive:   <ArticleOutlinedIcon sx={{ fontSize: 18, color: "#43A047" }} />,
};

const LEVEL_LABEL: Record<Level, string> = {
  container: "Conteneur",
  shelf:     "Étagère",
  floor:     "Niveau",
  binder:    "Classeur",
  record:    "Dossier",
  document:  "Document",
  archive:   "Archive",
};

// Cache via Redux (store.data.apiCache) — pas de Map globale

// ── Props ────────────────────────────────────────────────────

// Les archives redirigent vers le niveau document

interface PathItem { id: string; label: string; level: string }

export interface PhysicalSearchProps {
  headers: Record<string, string>;
  /** Reçoit le chemin complet depuis la racine (comme l'arbre) */
  onNavigate: (path: PathItem[]) => void;
}

// ── Composant ────────────────────────────────────────────────

export default function PhysicalSearch({ headers, onNavigate }: PhysicalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelRef = useRef(false);
  const dispatch = useDispatch<AppDispatch>();
  const apiCache = useSelector((store: RootState) =>
    (store.data as unknown as Record<string, unknown>).apiCache as Record<string, ApiCacheEntry> | undefined
  );

  const [, execute] = useAxios<{ query: string; total: number; results: SearchResult[] }>(
    { headers },
    { manual: true },
  );

  // ── Recherche avec debounce + cache ────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    // Vérifier le cache Redux
    const cacheKey = `physical_search:${q}`;
    const cached = apiCache?.[cacheKey];
    if (cached) {
      setResults(cached.data as SearchResult[]);
      setShowDropdown(true);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      cancelRef.current = false;
      setLoading(true);
      try {
        const res = await execute({
          url: `/api/stuff/archives/physical/search?q=${encodeURIComponent(q)}&limit=10`,
        });
        if (!cancelRef.current) {
          const data = res.data.results ?? [];
          dispatch(setCacheEntry({ url: cacheKey, data }));
          setResults(data);
          setShowDropdown(true);
        }
      } catch {
        if (!cancelRef.current) {
          setResults([]);
          setShowDropdown(true);
        }
      } finally {
        if (!cancelRef.current) setLoading(false);
      }
    }, 300);

    return () => {
      cancelRef.current = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, execute]);

  // Grouper par niveau
  const grouped: Partial<Record<Level, SearchResult[]>> = {};
  results.forEach((r) => {
    const lvl = r._level;
    if (!grouped[lvl]) grouped[lvl] = [];
    grouped[lvl]!.push(r);
  });

  const handleSelect = useCallback(async (item: SearchResult) => {
    setQuery("");
    setResults([]);
    setShowDropdown(false);

    // Charger le chemin complet via l'API
    const level = item._level === "archive" ? "document" : item._level;
    try {
      const res = await execute({ url: `/api/stuff/archives/physical/path/${level}/${item._id}` });
      const path = ((res.data as unknown) as { path: PathItem[] }).path ?? [];
      if (path.length > 0) {
        onNavigate(path);
      } else {
        // Fallback — un seul item
        onNavigate([{ id: item._id, label: item._label, level }]);
      }
    } catch {
      // Fallback si l'API échoue
      onNavigate([{ id: item._id, label: item._label, level }]);
    }
  }, [onNavigate, execute]);

  return (
    <Box sx={{ position: "relative" }}>
      <TextField
        size="small"
        fullWidth
        placeholder="Trouver un élément…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
        onBlur={() => { setTimeout(() => setShowDropdown(false), 200); }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {loading ? <CircularProgress size={14} /> : <SearchRoundedIcon fontSize="small" color="action" />}
            </InputAdornment>
          ),
          endAdornment: query ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => { setQuery(""); setResults([]); setShowDropdown(false); }}>
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
          sx: { fontSize: "0.85rem" },
        }}
      />

      {/* Dropdown des résultats */}
      {showDropdown && results.length > 0 && (
        <Paper
          elevation={8}
          sx={{
            position: "absolute",
            zIndex: 20,
            left: 0,
            right: 0,
            mt: 0.5,
            maxHeight: 400,
            overflow: "auto",
            borderRadius: 1.5,
          }}>
          {(Object.entries(grouped) as [Level, SearchResult[]][]).map(([level, items]) => (
            <Box key={level}>
              <Box px={1.5} py={0.5} bgcolor="action.hover" display="flex" alignItems="center" gap={0.75}>
                {LEVEL_ICON[level]}
                <Typography variant="caption" fontWeight="bold" color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
                  {LEVEL_LABEL[level]}s
                </Typography>
                <Chip label={items.length} size="small" sx={{ height: 18, fontSize: "0.65rem" }} />
              </Box>
              <List dense disablePadding>
                {items.map((item) => (
                  <ListItemButton key={item._id} onMouseDown={() => handleSelect(item)} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      {LEVEL_ICON[item._level]}
                    </ListItemIcon>
                    <ListItemText
                      primary={item._label}
                      primaryTypographyProps={{ variant: "body2", noWrap: true, fontWeight: 500 }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          ))}
        </Paper>
      )}

      {/* Aucun résultat */}
      {showDropdown && query.trim().length >= 2 && results.length === 0 && !loading && (
        <Paper elevation={4} sx={{ position: "absolute", zIndex: 20, left: 0, right: 0, mt: 0.5, p: 2, textAlign: "center", borderRadius: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            Aucun résultat pour « {query.trim()} »
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
