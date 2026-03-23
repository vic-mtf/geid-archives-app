/**
 * PhysicalSearch — Barre de recherche indexée pour l'archivage physique.
 *
 * Utilise MiniSearch pour une recherche full-text performante côté client.
 * Les résultats sont regroupés par niveau avec l'icône correspondante.
 * Un clic sur un résultat navigue directement vers l'élément.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import SearchRoundedIcon    from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon     from "@mui/icons-material/CloseRounded";
import WarehouseOutlinedIcon  from "@mui/icons-material/WarehouseOutlined";
import DnsOutlinedIcon        from "@mui/icons-material/DnsOutlined";
import ViewStreamOutlinedIcon from "@mui/icons-material/ViewStreamOutlined";
import StyleOutlinedIcon      from "@mui/icons-material/StyleOutlined";
import FolderOutlinedIcon     from "@mui/icons-material/FolderOutlined";
import TopicOutlinedIcon      from "@mui/icons-material/TopicOutlined";
import MiniSearch from "minisearch";
import useAxios from "@/hooks/useAxios";

// ── Types ────────────────────────────────────────────────────

type Level = "container" | "shelf" | "floor" | "binder" | "record" | "document";

interface SearchItem {
  id: string;
  level: Level;
  name: string;
  sub?: string;
}

interface SearchResult extends SearchItem {
  score: number;
}

// ── Config ───────────────────────────────────────────────────

const LEVEL_ICON: Record<Level, React.ReactNode> = {
  container: <WarehouseOutlinedIcon sx={{ fontSize: 18, color: "#5C6BC0" }} />,
  shelf:     <DnsOutlinedIcon sx={{ fontSize: 18, color: "#26A69A" }} />,
  floor:     <ViewStreamOutlinedIcon sx={{ fontSize: 18, color: "#42A5F5" }} />,
  binder:    <StyleOutlinedIcon sx={{ fontSize: 18, color: "#FFA726" }} />,
  record:    <FolderOutlinedIcon sx={{ fontSize: 18, color: "#AB47BC" }} />,
  document:  <TopicOutlinedIcon sx={{ fontSize: 18, color: "#78909C" }} />,
};

const LEVEL_LABEL: Record<Level, string> = {
  container: "Conteneur",
  shelf: "Étagère",
  floor: "Niveau",
  binder: "Classeur",
  record: "Dossier",
  document: "Document",
};

// ── Props ────────────────────────────────────────────────────

export interface PhysicalSearchProps {
  headers: Record<string, string>;
  /** Callback quand un résultat est cliqué — navigue vers l'élément */
  onNavigate: (id: string, level: Level, label: string) => void;
}

// ── Composant ────────────────────────────────────────────────

export default function PhysicalSearch({ headers, onNavigate }: PhysicalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [indexReady, setIndexReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const indexRef = useRef<MiniSearch<SearchItem> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [, fetchData] = useAxios({ headers }, { manual: true });

  // ── Construction de l'index au montage ─────────────────────
  useEffect(() => {
    let cancelled = false;

    async function buildIndex() {
      setLoading(true);
      const base = "/api/stuff/archives/physical";
      const allItems: SearchItem[] = [];

      try {
        // Charger tous les niveaux en parallèle
        const [cRes, sRes, fRes, bRes, rRes, dRes] = await Promise.all([
          fetchData({ url: `${base}/containers` }),
          fetchData({ url: `${base}/shelves` }),
          fetchData({ url: `${base}/floors` }),
          fetchData({ url: `${base}/binders` }),
          fetchData({ url: `${base}/records` }),
          fetchData({ url: `${base}/documents` }),
        ]);

        const addItems = (data: unknown, level: Level, nameKey: string, subKey?: string) => {
          ((data as Record<string, unknown>[]) ?? []).forEach((item) => {
            allItems.push({
              id: item._id as string,
              level,
              name: (item[nameKey] as string) ?? String(item._id),
              sub: subKey ? (item[subKey] as string) : undefined,
            });
          });
        };

        addItems(cRes.data, "container", "name", "location");
        addItems(sRes.data, "shelf", "name", "description");
        addItems(fRes.data, "floor", "label", "number");
        addItems(bRes.data, "binder", "name", "nature");
        addItems(rRes.data, "record", "internalNumber", "subject");
        addItems(dRes.data, "document", "title", "description");

        if (cancelled) return;

        // Construire l'index MiniSearch
        const ms = new MiniSearch<SearchItem>({
          fields: ["name", "sub"],
          storeFields: ["id", "level", "name", "sub"],
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: { name: 2 },
          },
        });
        ms.addAll(allItems);
        indexRef.current = ms;
        setIndexReady(true);
      } catch {
        // Index échoué — la recherche sera désactivée
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    buildIndex();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Recherche avec debounce ────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!indexRef.current || query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      const found = indexRef.current!.search(query.trim()).slice(0, 15);
      setResults(found.map((r) => ({
        id: r.id as string,
        level: r.level as Level,
        name: r.name as string,
        sub: r.sub as string | undefined,
        score: r.score,
      })));
    }, 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Grouper par niveau
  const grouped = useMemo(() => {
    const groups: Partial<Record<Level, SearchResult[]>> = {};
    results.forEach((r) => {
      if (!groups[r.level]) groups[r.level] = [];
      groups[r.level]!.push(r);
    });
    return groups;
  }, [results]);

  const handleSelect = useCallback((item: SearchResult) => {
    onNavigate(item.id, item.level, item.name);
    setQuery("");
    setResults([]);
  }, [onNavigate]);

  return (
    <Box sx={{ position: "relative" }}>
      <TextField
        size="small"
        fullWidth
        autoFocus={false}
        placeholder={indexReady ? "Trouver un élément…" : "Chargement…"}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={!indexReady}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {loading ? <CircularProgress size={16} /> : <SearchRoundedIcon fontSize="small" color="action" />}
            </InputAdornment>
          ),
          endAdornment: query ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => { setQuery(""); setResults([]); }}>
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
          sx: { fontSize: "0.85rem" },
        }}
      />

      {/* Dropdown des résultats */}
      {results.length > 0 && (
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
                  <ListItemButton key={item.id} onClick={() => handleSelect(item)} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      {LEVEL_ICON[item.level]}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.name}
                      secondary={item.sub}
                      primaryTypographyProps={{ variant: "body2", noWrap: true, fontWeight: 500 }}
                      secondaryTypographyProps={{ variant: "caption", noWrap: true }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          ))}
        </Paper>
      )}

      {/* Aucun résultat */}
      {query.trim().length >= 2 && results.length === 0 && indexReady && (
        <Paper elevation={4} sx={{ position: "absolute", zIndex: 20, left: 0, right: 0, mt: 0.5, p: 2, textAlign: "center", borderRadius: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            Aucun résultat pour « {query.trim()} »
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
