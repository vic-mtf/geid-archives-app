/**
 * LinkToPhysicalRecordDialog — Rattachement d'une archive à un dossier.
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
  Button, Typography, Box, Stack,
  CircularProgress, Breadcrumbs, Link, Skeleton,
  useMediaQuery, useTheme,
} from "@mui/material";
import NavigateNextIcon    from "@mui/icons-material/NavigateNext";
import LinkIcon            from "@mui/icons-material/Link";
import LinkOffIcon         from "@mui/icons-material/LinkOff";
import InfoOutlinedIcon    from "@mui/icons-material/InfoOutlined";
import { useDispatch } from "react-redux";
import { useSnackbar } from "notistack";
import type { AppDispatch } from "@/redux/store";
import { incrementVersion } from "@/redux/data";
import useAxios from "@/hooks/useAxios";
import useToken from "@/hooks/useToken";
import type { ArchiveDocument } from "@/types";

import type { Level, Item } from "@/views/forms/archives/hierarchyTypes";
import { LEVELS, LEVEL_LABELS, LEVEL_ICONS, levelUrl, EVENT_NAME } from "@/views/forms/archives/hierarchyTypes";
import { ContainerCard, ShelfCard, FloorCard, BinderCard, RecordCard } from "@/views/forms/archives/HierarchyLevelCards";

// ── Composant principal ──────────────────────────────────────

export default function LinkToPhysicalRecordDialog() {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
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
  const loadLevel = useCallback(async (lvl: Level, parentId?: string, parentLevel?: Level) => {
    setLoadingItems(true);
    setItems([]);
    try {
      const result = await fetchItems({ url: levelUrl(lvl, parentId, parentLevel) });
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

  // Clic sur une carte — descend d'un niveau
  const handleDrillDown = useCallback((item: Item, lvl: Level) => {
    const nextLevel = LEVELS[LEVELS.indexOf(lvl) + 1];
    setSelected(prev => ({ ...prev, [lvl]: item }));
    if (nextLevel) {
      const parentLevel = LEVELS[LEVELS.indexOf(lvl) - 1];
      const parentId = parentLevel ? selected[parentLevel]?._id : undefined;
      setNavHistory(h => [...h, { level: lvl, parentId, parentLevel }]);
      setLevel(nextLevel);
      loadLevel(nextLevel, item._id, lvl);
    }
  }, [loadLevel, selected]);

  // Sélection pour rattachement — record OU document (toggle)
  const handleSelectTarget = useCallback((item: Item, targetLevel: Level) => {
    setSelected(prev => ({
      ...prev,
      [targetLevel]: prev[targetLevel]?._id === item._id ? undefined : item,
    }));
  }, []);

  // Historique de navigation pour gérer les documents récursifs
  const [navHistory, setNavHistory] = useState<{ level: Level; parentId?: string; parentLevel?: Level }[]>([]);

  // Retour au niveau précédent via bouton ←
  const handleBack = useCallback(() => {
    if (navHistory.length === 0) return;
    const prev = navHistory[navHistory.length - 1];
    setNavHistory(h => h.slice(0, -1));
    setSelected(s => {
      const next = { ...s };
      delete next[level];
      return next;
    });
    setLevel(prev.level);
    loadLevel(prev.level, prev.parentId, prev.parentLevel);
  }, [level, navHistory, loadLevel]);

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
    setNavHistory([]);
    loadLevel(lvl, parentId, parentLevel);
  }, [selected, loadLevel]);

  // Fermer le dialog
  const handleClose = () => {
    if (linking) return;
    setDoc(null);
    setLevel("container");
    setSelected({});
    setItems([]);
    setNavHistory([]);
  };

  // Cible sélectionnée : record ou document
  const linkTarget = selected.document ?? selected.record;
  // Seul un document peut être la cible du rattachement (pas un dossier)
  const linkTargetType: "document" | null = selected.document ? "document" : null;
  const linkTargetLabel = linkTarget
    ? (linkTarget.title as string ?? linkTarget.internalNumber as string ?? linkTarget._id)
    : "";

  // Confirmer le rattachement
  const handleLink = async () => {
    if (!doc || !linkTarget || !linkTargetType) return;
    setLinking(true);
    try {
      await executePatch({
        url: `/api/stuff/archives/${doc._id ?? doc.id}`,
        data: { document: linkTarget._id, record: selected.record?._id ?? null },
      });
      enqueueSnackbar(
        `L'archive est maintenant rattachée au document « ${linkTargetLabel} ».`,
        { variant: "success", title: "Rattachement effectué avec succès" }
      );
      dispatch(incrementVersion());
      handleClose();
    } catch {
      enqueueSnackbar("Le rattachement n'a pas pu être effectué. L'archive n'a pas été modifiée. Vérifiez vos droits et réessayez.", {
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
        url: `/api/stuff/archives/${doc._id ?? doc.id}`,
        data: { record: null, document: null },
      });
      enqueueSnackbar("L'archive a été détachée. Elle n'est plus associée à aucun dossier.", { variant: "success", title: "Détachement effectué" });
      dispatch(incrementVersion());
      handleClose();
    } catch {
      enqueueSnackbar("Le détachement a échoué. Vérifiez vos droits et réessayez.", { variant: "error", title: "Détachement impossible" });
    } finally {
      setLinking(false);
    }
  };

  // Breadcrumbs : tous les niveaux sélectionnés avant le niveau courant
  const breadcrumbs = LEVELS.slice(0, LEVELS.indexOf(level)).filter(l => selected[l]);

  // Le document est-il déjà rattaché ?
  const alreadyLinked = Boolean(doc?.record) || Boolean((doc as Record<string, unknown>)?.document);

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
      fullScreen={fullScreen}
      PaperProps={{ sx: { height: "80vh", maxHeight: 620, display: "flex", flexDirection: "column" } }}>

      {/* ── En-tête ── */}
      <DialogTitle component="div" sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={0.25}>
          <LinkIcon fontSize="small" color="primary" />
          <Typography fontWeight={700}>Rattacher à un document</Typography>
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
              Cette archive est déjà rattachée à un document. Vous pouvez modifier ou détacher le rattachement.
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
              {(level === "record" || level === "document") ? "Sélectionnez un élément pour le rattachement" : `Choisissez ${level === "floor" ? "un étage" : `un${["étagère"].includes(LEVEL_LABELS[level].toLowerCase()) ? "e" : ""} ${LEVEL_LABELS[level].toLowerCase()}`}`}
            </Typography>
            {(level === "record" || level === "document") && (
              <Typography variant="caption" color="text.secondary">
                Cliquez pour sélectionner, utilisez la flèche pour naviguer dans le contenu
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
                if (level === "record") return (
                  <RecordCard
                    key={item._id}
                    item={item}
                    selected={selected.record?._id === item._id && !selected.document}
                    onClick={() => handleSelectTarget(item, "record")}
                    onDrillDown={() => handleDrillDown(item, "record")}
                  />
                );
                // document level
                return (
                  <RecordCard
                    key={item._id}
                    item={{ ...item, internalNumber: item.title as string, subject: item.description as string ?? "", refNumber: "", category: item.nature as string ?? "Document" }}
                    selected={selected.document?._id === item._id}
                    onClick={() => handleSelectTarget(item, "document")}
                    onDrillDown={() => handleDrillDown(item, "document")}
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
        {(level === "record" || level === "document") && (
          <Button
            variant="contained"
            onClick={handleLink}
            disabled={!linkTarget || linking}
            startIcon={linking ? <CircularProgress size={14} color="inherit" /> : <LinkIcon />}>
            Rattacher
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
