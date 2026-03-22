/**
 * LinkToPhysicalRecordDialog — Rattachement d'une archive à un dossier physique.
 *
 * UX : navigation en cascade dans la hiérarchie physique (5 niveaux).
 * L'utilisateur clique sur un élément pour descendre dans la hiérarchie,
 * un breadcrumb lui indique où il se trouve, et il peut revenir en arrière.
 *
 *   Conteneur → Étagère → Étage → Classeur → Dossier physique
 *
 * Déclenchement : CustomEvent "__link_physical_record" avec { doc: ArchiveDocument }
 */

import { useEffect, useState, useCallback } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Stack, Paper, Chip,
  CircularProgress, Breadcrumbs, Link, Skeleton,
  LinearProgress, Tooltip,
} from "@mui/material";
import NavigateNextIcon    from "@mui/icons-material/NavigateNext";
import WarehouseOutlinedIcon       from "@mui/icons-material/WarehouseOutlined";
import LayersOutlinedIcon          from "@mui/icons-material/LayersOutlined";
import FolderOpenOutlinedIcon      from "@mui/icons-material/FolderOpenOutlined";
import BookmarkBorderOutlinedIcon  from "@mui/icons-material/BookmarkBorderOutlined";
import ArticleOutlinedIcon         from "@mui/icons-material/ArticleOutlined";
import CheckCircleIcon             from "@mui/icons-material/CheckCircle";
import LinkIcon                    from "@mui/icons-material/Link";
import LinkOffIcon                 from "@mui/icons-material/LinkOff";
import ChevronRightIcon            from "@mui/icons-material/ChevronRight";
import InfoOutlinedIcon            from "@mui/icons-material/InfoOutlined";
import { useDispatch } from "react-redux";
import { useSnackbar } from "notistack";
import type { AppDispatch } from "../../../redux/store";
import { incrementVersion } from "../../../redux/data";
import useAxios from "../../../hooks/useAxios";
import useToken from "../../../hooks/useToken";
import type { ArchiveDocument } from "../../../types";

// ── Types ────────────────────────────────────────────────────

type Level = "container" | "shelf" | "floor" | "binder" | "record";

interface Item extends Record<string, unknown> {
  _id: string;
}

const LEVELS: Level[] = ["container", "shelf", "floor", "binder", "record"];

const LEVEL_LABELS: Record<Level, string> = {
  container : "Conteneur",
  shelf     : "Étagère",
  floor     : "Étage",
  binder    : "Classeur",
  record    : "Dossier physique",
};

const LEVEL_ICONS: Record<Level, React.ReactNode> = {
  container : <WarehouseOutlinedIcon fontSize="small" />,
  shelf     : <LayersOutlinedIcon fontSize="small" />,
  floor     : <FolderOpenOutlinedIcon fontSize="small" />,
  binder    : <BookmarkBorderOutlinedIcon fontSize="small" />,
  record    : <ArticleOutlinedIcon fontSize="small" />,
};

// URL de l'API pour chaque niveau (parentId = _id du niveau supérieur)
const levelUrl = (level: Level, parentId?: string) => {
  const base = "/api/stuff/archives/physical";
  switch (level) {
    case "container": return `${base}/containers`;
    case "shelf"    : return `${base}/shelves/container/${parentId}`;
    case "floor"    : return `${base}/floors/shelf/${parentId}`;
    case "binder"   : return `${base}/binders/floor/${parentId}`;
    case "record"   : return `${base}/records/binder/${parentId}`;
  }
};

const EVENT_NAME = "__link_physical_record";

// ── Sous-composants — cartes par niveau ──────────────────────

function ContainerCard({ item, onClick }: { item: Item; onClick: () => void }) {
  return (
    <Paper variant="outlined" onClick={onClick} sx={cardSx}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box sx={{ color: "primary.main", flexShrink: 0 }}>
          <WarehouseOutlinedIcon />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700} noWrap>{item.name as string}</Typography>
          {!!item.location && (
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {item.location as string}
            </Typography>
          )}
        </Box>
        <ChevronRightIcon sx={{ color: "text.disabled", flexShrink: 0 }} />
      </Stack>
    </Paper>
  );
}

function ShelfCard({ item, onClick }: { item: Item; onClick: () => void }) {
  return (
    <Paper variant="outlined" onClick={onClick} sx={cardSx}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box sx={{ color: "primary.main", flexShrink: 0 }}>
          <LayersOutlinedIcon />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700} noWrap>{item.name as string}</Typography>
          {!!item.description && (
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {item.description as string}
            </Typography>
          )}
        </Box>
        <ChevronRightIcon sx={{ color: "text.disabled", flexShrink: 0 }} />
      </Stack>
    </Paper>
  );
}

function FloorCard({ item, onClick }: { item: Item; onClick: () => void }) {
  const unit = (item.administrativeUnit as Record<string, unknown> | undefined)?.name as string | undefined;
  return (
    <Paper variant="outlined" onClick={onClick} sx={cardSx}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box sx={{ color: "primary.main", flexShrink: 0 }}>
          <FolderOpenOutlinedIcon />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700}>
            Étage {item.number as number}
            {item.label ? ` — ${item.label as string}` : ""}
          </Typography>
          {unit && (
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {unit}
            </Typography>
          )}
        </Box>
        <ChevronRightIcon sx={{ color: "text.disabled", flexShrink: 0 }} />
      </Stack>
    </Paper>
  );
}

function BinderCard({ item, onClick }: { item: Item; onClick: () => void }) {
  const current  = (item.currentCount as number) ?? 0;
  const capacity = (item.maxCapacity  as number) ?? 1;
  const pct      = Math.min((current / capacity) * 100, 100);
  const full     = current >= capacity;
  return (
    <Tooltip title={full ? "Classeur plein — aucun nouveau dossier possible" : ""} placement="top">
      <Paper
        variant="outlined"
        onClick={full ? undefined : onClick}
        sx={{ ...cardSx, opacity: full ? 0.5 : 1, cursor: full ? "not-allowed" : "pointer" }}>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={0.75}>
          <Box sx={{ color: full ? "text.disabled" : "primary.main", flexShrink: 0 }}>
            <BookmarkBorderOutlinedIcon />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} noWrap>{item.name as string}</Typography>
            <Chip
              label={item.nature as string}
              size="small"
              variant="outlined"
              sx={{ height: 18, fontSize: "0.65rem", mt: 0.25 }}
            />
          </Box>
          {!full && <ChevronRightIcon sx={{ color: "text.disabled", flexShrink: 0 }} />}
        </Stack>
        {/* Barre de capacité */}
        <Box>
          <Stack direction="row" justifyContent="space-between" mb={0.25}>
            <Typography variant="caption" color="text.secondary">Occupation</Typography>
            <Typography variant="caption" color={full ? "error.main" : "text.secondary"}>
              {current} / {capacity}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={pct}
            color={pct >= 90 ? "error" : pct >= 70 ? "warning" : "primary"}
            sx={{ borderRadius: 1, height: 5 }}
          />
        </Box>
      </Paper>
    </Tooltip>
  );
}

function RecordCard({ item, selected, onClick }: { item: Item; selected: boolean; onClick: () => void }) {
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        ...cardSx,
        borderColor: selected ? "primary.main" : undefined,
        bgcolor: selected ? "action.selected" : undefined,
        outline: selected ? "2px solid" : "none",
        outlineColor: "primary.main",
      }}>
      <Stack direction="row" alignItems="flex-start" spacing={1.5}>
        <Box sx={{ color: selected ? "primary.main" : "text.secondary", flexShrink: 0, mt: 0.2 }}>
          {selected ? <CheckCircleIcon fontSize="small" color="primary" /> : <ArticleOutlinedIcon fontSize="small" />}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" mb={0.25}>
            <Typography variant="body2" fontWeight={700}>{item.internalNumber as string}</Typography>
            <Chip label={item.category as string} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.65rem" }} />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {item.subject as string}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Réf. {item.refNumber as string}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

const cardSx = {
  p: 1.5,
  cursor: "pointer",
  borderRadius: 1.5,
  transition: "all .15s",
  "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
};

// ── Composant principal ──────────────────────────────────────

export default function LinkToPhysicalRecordDialog() {
  const Authorization = useToken();
  const dispatch      = useDispatch<AppDispatch>();
  const { enqueueSnackbar } = useSnackbar();

  const [doc,          setDoc]          = useState<ArchiveDocument | null>(null);
  const [level,        setLevel]        = useState<Level>("container");
  const [selected,     setSelected]     = useState<Partial<Record<Level, Item>>>({});
  const [items,        setItems]        = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [linking,      setLinking]      = useState(false);

  const [, fetchItems]   = useAxios({ headers: { Authorization } }, { manual: true });
  const [, executePatch] = useAxios({ method: "PUT", headers: { Authorization } }, { manual: true });

  // Écoute l'événement d'ouverture
  useEffect(() => {
    const root = document.getElementById("root");
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ doc: ArchiveDocument }>).detail;
      if (detail?.doc) {
        setDoc(detail.doc);
        setLevel("container");
        setSelected({});
        setItems([]);
      }
    };
    root?.addEventListener(EVENT_NAME, handler);
    return () => root?.removeEventListener(EVENT_NAME, handler);
  }, []);

  // Charger les éléments d'un niveau
  const loadLevel = useCallback(async (lvl: Level, parentId?: string) => {
    setLoadingItems(true);
    setItems([]);
    try {
      const result = await fetchItems({ url: levelUrl(lvl, parentId) });
      setItems((result.data as Item[]) ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, [fetchItems]);

  // Charger les conteneurs à l'ouverture
  useEffect(() => {
    if (doc) loadLevel("container");
  }, [doc, loadLevel]);

  // Clic sur une carte — descend d'un niveau (sauf record)
  const handleDrillDown = useCallback((item: Item, lvl: Level) => {
    const nextLevel = LEVELS[LEVELS.indexOf(lvl) + 1];
    setSelected(prev => ({ ...prev, [lvl]: item }));
    if (nextLevel) {
      setLevel(nextLevel);
      loadLevel(nextLevel, item._id);
    }
  }, [loadLevel]);

  // Clic sur un dossier physique — sélection (pas de descente)
  const handleSelectRecord = useCallback((item: Item) => {
    setSelected(prev => ({
      ...prev,
      record: prev.record?._id === item._id ? undefined : item, // toggle
    }));
  }, []);

  // Retour au niveau précédent via bouton ←
  const handleBack = useCallback(() => {
    const prevLevel   = LEVELS[LEVELS.indexOf(level) - 1];
    if (!prevLevel) return;
    const grandParent = LEVELS[LEVELS.indexOf(prevLevel) - 1];
    const parentId    = grandParent ? selected[grandParent]?._id : undefined;
    setSelected(prev => {
      const next = { ...prev };
      delete next[level];
      return next;
    });
    setLevel(prevLevel);
    loadLevel(prevLevel, parentId);
  }, [level, selected, loadLevel]);

  // Clic sur un item du breadcrumb — remonte
  const handleBreadcrumbClick = useCallback((lvl: Level) => {
    const parentLevel = LEVELS[LEVELS.indexOf(lvl) - 1];
    const parentId    = parentLevel ? selected[parentLevel]?._id : undefined;
    setSelected(prev => {
      const next = { ...prev };
      LEVELS.slice(LEVELS.indexOf(lvl)).forEach(l => delete next[l]);
      return next;
    });
    setLevel(lvl);
    loadLevel(lvl, parentId);
  }, [selected, loadLevel]);

  // Fermer le dialog
  const handleClose = () => {
    if (linking) return;
    setDoc(null);
    setLevel("container");
    setSelected({});
    setItems([]);
  };

  // Confirmer le rattachement
  const handleLink = async () => {
    if (!doc || !selected.record) return;
    setLinking(true);
    try {
      await executePatch({
        url : `/api/stuff/archives/${doc._id ?? doc.id}`,
        data: { record: selected.record._id },
      });
      enqueueSnackbar(
        `L'archive numérique est maintenant rattachée au dossier physique « ${selected.record.internalNumber as string} ». Vous pouvez la retrouver dans la section Archivage physique.`,
        { variant: "success", title: "Rattachement effectué avec succès" }
      );
      dispatch(incrementVersion());
      handleClose();
    } catch {
      enqueueSnackbar("Le rattachement a échoué. L'archive n'a pas été modifiée. Vérifiez vos droits et réessayez.", {
        variant: "error", title: "Rattachement impossible",
      });
    } finally {
      setLinking(false);
    }
  };

  // Détacher (supprimer le lien)
  const handleUnlink = async () => {
    if (!doc) return;
    setLinking(true);
    try {
      await executePatch({
        url : `/api/stuff/archives/${doc._id ?? doc.id}`,
        data: { record: null },
      });
      enqueueSnackbar("L'archive a été détachée de son dossier physique. Elle n'est plus associée à aucun support physique.", { variant: "success", title: "Détachement effectué" });
      dispatch(incrementVersion());
      handleClose();
    } catch {
      enqueueSnackbar("Le détachement a échoué. L'archive est toujours liée à son dossier physique. Vérifiez vos droits et réessayez.", { variant: "error", title: "Détachement impossible" });
    } finally {
      setLinking(false);
    }
  };

  // Breadcrumbs : tous les niveaux sélectionnés avant le niveau courant
  const breadcrumbs = LEVELS.slice(0, LEVELS.indexOf(level)).filter(l => selected[l]);

  // Le document est-il déjà rattaché à un dossier physique ?
  const alreadyLinked = Boolean(doc?.record);

  const itemLabel = (lvl: Level, item: Item): string => {
    if (lvl === "floor") return `Étage ${item.number as number}${item.label ? ` — ${item.label as string}` : ""}`;
    return (item.name ?? item.internalNumber ?? item._id) as string;
  };

  return (
    <Dialog
      open={Boolean(doc)}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { height: "80vh", maxHeight: 620, display: "flex", flexDirection: "column" } }}>

      {/* ── En-tête ── */}
      <DialogTitle component="div" sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={0.25}>
          <LinkIcon fontSize="small" color="primary" />
          <Typography fontWeight={700}>Rattacher à un dossier physique</Typography>
        </Stack>
        {doc?.designation && (
          <Typography variant="caption" color="text.secondary" noWrap display="block" pl={3.5}>
            {doc.designation as string}
          </Typography>
        )}
        {alreadyLinked && (
          <Stack direction="row" alignItems="center" spacing={0.75} mt={1}
            sx={{ bgcolor: "info.50", borderRadius: 1, px: 1.5, py: 0.75 }}>
            <InfoOutlinedIcon fontSize="small" color="info" />
            <Typography variant="caption" color="info.dark">
              Ce document est déjà rattaché à un dossier physique. Vous pouvez le modifier ou le détacher.
            </Typography>
          </Stack>
        )}
      </DialogTitle>

      {/* ── Corps ── */}
      <DialogContent
        dividers
        sx={{ p: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Breadcrumb */}
        {breadcrumbs.length > 0 && (
          <Box sx={{
            px: 2, py: 1,
            borderBottom: "1px solid", borderColor: "divider",
            bgcolor: "background.default", flexShrink: 0,
          }}>
            <Breadcrumbs separator={<NavigateNextIcon sx={{ fontSize: 14 }} />}>
              {breadcrumbs.map((l) => (
                <Link
                  key={l}
                  underline="hover"
                  color="text.secondary"
                  sx={{ cursor: "pointer", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: 0.5 }}
                  onClick={() => handleBreadcrumbClick(l)}>
                  {LEVEL_ICONS[l]}
                  {itemLabel(l, selected[l]!)}
                </Link>
              ))}
              <Typography
                sx={{ fontSize: "0.78rem", display: "flex", alignItems: "center", gap: 0.5 }}
                color="text.primary">
                {LEVEL_ICONS[level]}
                {LEVEL_LABELS[level]}
              </Typography>
            </Breadcrumbs>
          </Box>
        )}

        {/* Header du niveau courant */}
        <Box sx={{
          px: 2, py: 1.25,
          borderBottom: "1px solid", borderColor: "divider",
          flexShrink: 0,
          display: "flex", alignItems: "center", gap: 1,
        }}>
          <Box sx={{ color: "primary.main" }}>{LEVEL_ICONS[level]}</Box>
          <Box flex={1}>
            <Typography variant="subtitle2" fontWeight={600}>
              {level === "record" ? "Sélectionnez un dossier physique" : `Choisissez ${level === "floor" ? "un étage" : `un${["étagère"].includes(LEVEL_LABELS[level].toLowerCase()) ? "e" : ""} ${LEVEL_LABELS[level].toLowerCase()}`}`}
            </Typography>
            {level === "record" && (
              <Typography variant="caption" color="text.secondary">
                Cliquez sur un dossier pour le sélectionner, puis confirmez avec « Rattacher »
              </Typography>
            )}
          </Box>
          {loadingItems && <CircularProgress size={16} />}
        </Box>

        {/* Liste des items */}
        <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 1.5 }}>
          {loadingItems ? (
            <Stack spacing={1}>
              {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={64} />)}
            </Stack>
          ) : items.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 5 }}>
              <Typography variant="body2" color="text.secondary">
                Aucun {LEVEL_LABELS[level].toLowerCase()} disponible à ce niveau
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1}>
              {items.map((item) => {
                if (level === "container") return <ContainerCard key={item._id} item={item} onClick={() => handleDrillDown(item, "container")} />;
                if (level === "shelf")     return <ShelfCard     key={item._id} item={item} onClick={() => handleDrillDown(item, "shelf")} />;
                if (level === "floor")     return <FloorCard     key={item._id} item={item} onClick={() => handleDrillDown(item, "floor")} />;
                if (level === "binder")    return <BinderCard    key={item._id} item={item} onClick={() => handleDrillDown(item, "binder")} />;
                return (
                  <RecordCard
                    key={item._id}
                    item={item}
                    selected={selected.record?._id === item._id}
                    onClick={() => handleSelectRecord(item)}
                  />
                );
              })}
            </Stack>
          )}
        </Box>
      </DialogContent>

      {/* ── Actions ── */}
      <DialogActions sx={{ px: 2, py: 1.5, gap: 1 }}>
        {level !== "container" && (
          <Button
            onClick={handleBack}
            color="inherit"
            disabled={linking}
            sx={{ mr: "auto" }}>
            ← Retour
          </Button>
        )}
        {alreadyLinked && level === "container" && (
          <Button
            onClick={handleUnlink}
            color="error"
            variant="outlined"
            size="small"
            startIcon={<LinkOffIcon />}
            disabled={linking}>
            Détacher
          </Button>
        )}
        <Button onClick={handleClose} color="inherit" disabled={linking}>
          Annuler
        </Button>
        {level === "record" && (
          <Button
            variant="contained"
            onClick={handleLink}
            disabled={!selected.record || linking}
            startIcon={linking ? <CircularProgress size={14} color="inherit" /> : <LinkIcon />}>
            Rattacher
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
