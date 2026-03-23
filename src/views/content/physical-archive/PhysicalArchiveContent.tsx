/**
 * PhysicalArchiveContent — Explorateur de fichiers de l'archivage physique.
 *
 * Navigation hiérarchique 6 niveaux :
 *   Conteneur → Étagère → Niveau → Classeur → Dossier → Document
 *
 * Sous-composants :
 *   - DetailPanel.tsx : détail par niveau avec archives liées
 *   - PhysicalEntityForm : formulaire de création (dans forms/physical/)
 */

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ArrowBackRoundedIcon         from "@mui/icons-material/ArrowBackRounded";
import AddRoundedIcon               from "@mui/icons-material/AddRounded";
import WarehouseOutlinedIcon        from "@mui/icons-material/WarehouseOutlined";
import DnsOutlinedIcon              from "@mui/icons-material/DnsOutlined";
import ViewStreamOutlinedIcon       from "@mui/icons-material/ViewStreamOutlined";
import StyleOutlinedIcon            from "@mui/icons-material/StyleOutlined";
import FolderOutlinedIcon           from "@mui/icons-material/FolderOutlined";
import KeyboardReturnOutlinedIcon   from "@mui/icons-material/KeyboardReturnOutlined";
import TopicOutlinedIcon            from "@mui/icons-material/TopicOutlined";
import ArticleOutlinedIcon          from "@mui/icons-material/ArticleOutlined";
import InfoOutlinedIcon             from "@mui/icons-material/InfoOutlined";
import NavigateNextRoundedIcon      from "@mui/icons-material/NavigateNextRounded";

import useAxios      from "@/hooks/useAxios";
import useToken      from "@/hooks/useToken";
import { type PhysicalLevel, UPDATE_ENDPOINTS, RENAME_FIELD } from "@/constants/physical";
import InlineEditableLabel from "./InlineEditableLabel";
import { useSnackbar } from "notistack";
import { useLocation } from "react-router-dom";
import type { DeepTarget } from "@/utils/deepNavigate";
import useHighlightElement from "@/hooks/useHighlightElement";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { incrementVersion, setCacheEntry, invalidateCache as invalidateCacheAction } from "@/redux/data";
import type { ApiCacheEntry } from "@/redux/data";
import type { Container, Shelf, Floor, Binder, PhysicalRecord, PhysicalDocument } from "@/types";
import scrollBarSx   from "@/utils/scrollBarSx";
import PhysicalEntityForm from "@/views/forms/physical/PhysicalEntityForm";
import useArchivePermissions from "@/hooks/useArchivePermissions";
import PhysicalTreeView  from "./PhysicalTreeView";
import PhysicalSearch    from "./PhysicalSearch";
import DetailPanel       from "./DetailPanel";
import PhysicalContextMenu, { type ContextMenuState } from "./PhysicalContextMenu";

// ── Types locaux ───────────────────────────────────────────

// Level = PhysicalLevel importé depuis @/constants/physical
type Level = PhysicalLevel;

interface BreadcrumbItem {
  id: string;
  label: string;
  level: Level;
}

// ── Composant principal ────────────────────────────────────

export default function PhysicalArchiveContent() {
  const Authorization = useToken();
  const headers = useMemo(() => ({ Authorization: Authorization ?? "" }), [Authorization]);
  const dispatch = useDispatch<AppDispatch>();
  const dataVersion = useSelector((store: RootState) => store.data.dataVersion);
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { enqueueSnackbar } = useSnackbar();
  const { canWrite } = useArchivePermissions();

  // Formulaire de création
  const [formOpen, setFormOpen] = useState(false);
  const [formParentId, setFormParentId] = useState<string | undefined>(undefined);
  const [formLevel, setFormLevel] = useState<Level>("container");

  // Menu contextuel (clic droit)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Dialogue de suppression
  const [deleteTarget, setDeleteTarget] = useState<{
    level: Level;
    id: string;
    label: string;
  } | null>(null);

  const deleteEndpoints: Record<Level, string> = {
    container: "/api/stuff/archives/physical/containers",
    shelf:     "/api/stuff/archives/physical/shelves",
    floor:     "/api/stuff/archives/physical/floors",
    binder:    "/api/stuff/archives/physical/binders",
    record:    "/api/stuff/archives/physical/records",
    document:  "/api/stuff/archives/physical/documents",
  };

  const [, executeDelete] = useAxios(
    { method: "DELETE", headers },
    { manual: true }
  );

  const [deleting, setDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleting) return;
    const levelLabels: Record<string, string> = {
      container: "conteneur",
      shelf:     "étagère",
      floor:     "niveau",
      binder:    "classeur",
      record:    "dossier",
      document:  "document",
    };
    const levelLabel = levelLabels[deleteTarget.level] ?? "élément";

    setDeleting(true);
    try {
      await executeDelete({ url: `${deleteEndpoints[deleteTarget.level]}/${deleteTarget.id}` });

      // Fermer le dialogue AVANT la notification
      const deletedLabel = deleteTarget.label;
      const deletedId = deleteTarget.id;
      setDeleteTarget(null);
      setSelected(null);

      // Calculer le nouveau breadcrumb après suppression
      let newBreadcrumb = [...breadcrumb];
      if (newBreadcrumb.length > 0 && newBreadcrumb[newBreadcrumb.length - 1].id === deletedId) {
        newBreadcrumb = newBreadcrumb.slice(0, -1);
      }
      setBreadcrumb(newBreadcrumb);

      // Invalider tout le cache physique dans Redux
      dispatch(invalidateCacheAction("/api/stuff/archives/physical"));
      dispatch(incrementVersion());

      // Calculer l'URL du niveau APRÈS suppression et forcer le refetch
      const base = "/api/stuff/archives/physical";
      const newParentId = newBreadcrumb.length > 0 ? newBreadcrumb[newBreadcrumb.length - 1].id : undefined;
      const newParentLevel = newBreadcrumb.length > 0 ? newBreadcrumb[newBreadcrumb.length - 1].level : undefined;
      const nextLevels: Record<string, string> = { container: "shelf", shelf: "floor", floor: "binder", binder: "record", record: "document", document: "document" };
      const newLevel = newBreadcrumb.length > 0 ? nextLevels[newBreadcrumb[newBreadcrumb.length - 1].level] : "container";

      let refetchUrl: string;
      if (newLevel === "container") refetchUrl = `${base}/containers`;
      else if (newLevel === "shelf") refetchUrl = `${base}/shelves/container/${newParentId}`;
      else if (newLevel === "floor") refetchUrl = `${base}/floors/shelf/${newParentId}`;
      else if (newLevel === "binder") refetchUrl = `${base}/binders/floor/${newParentId}`;
      else if (newLevel === "record") refetchUrl = `${base}/records/binder/${newParentId}`;
      else refetchUrl = newParentLevel === "record" ? `${base}/documents/record/${newParentId}` : `${base}/documents/parent/${newParentId}`;

      // Refetch immédiat avec la bonne URL
      executeFetch({ url: refetchUrl })
        .then((res) => {
          const fresh = (res.data as unknown[]) ?? [];
          setLevelData(fresh);
          dispatch(setCacheEntry({ url: refetchUrl, data: fresh }));
        })
        .catch(() => setLevelData([]));

      // Notification de succès
      enqueueSnackbar(
        `Le ${levelLabel} « ${deletedLabel} » a bien été supprimé. Les éléments qui y étaient rattachés ne sont plus liés à cet emplacement.`,
        { variant: "success" }
      );
    } catch (err: unknown) {
      const serverMsg = ((err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message)
        ?? ((err as { response?: { data?: { error?: string } } })?.response?.data?.error);
      enqueueSnackbar(
        serverMsg ?? `La suppression n'a pas pu être effectuée. Cet élément contient peut-être des sous-éléments qui doivent être supprimés en premier.`,
        { variant: "error" }
      );
    } finally {
      setDeleting(false);
    }
  };

  // Fil d'Ariane / navigation
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const currentLevel = useMemo<Level>(
    () => {
      const last = breadcrumb[breadcrumb.length - 1];
      if (!last) return "container";
      const next: Record<Level, Level> = {
        container: "shelf",
        shelf: "floor",
        floor: "binder",
        binder: "record",
        record: "document",
        document: "document",
      };
      return next[last.level];
    },
    [breadcrumb]
  );
  const parentId = breadcrumb[breadcrumb.length - 1]?.id;
  const parentLevel = breadcrumb[breadcrumb.length - 1]?.level;

  // ── Chargement unique par execute() impératif ──────────────
  // Un seul hook useAxios en mode manual — on déclenche le fetch
  // quand le breadcrumb change (navigation dans n'importe quel sens).

  const [levelData, setLevelData] = useState<unknown[]>([]);
  const [levelLoading, setLevelLoading] = useState(false);
  const [, executeFetch] = useAxios({ headers }, { manual: true });

  // URL à charger selon le niveau courant et le parent
  const currentUrl = useMemo(() => {
    const base = "/api/stuff/archives/physical";
    switch (currentLevel) {
      case "container": return `${base}/containers`;
      case "shelf":     return parentId ? `${base}/shelves/container/${parentId}` : null;
      case "floor":     return parentId ? `${base}/floors/shelf/${parentId}` : null;
      case "binder":    return parentId ? `${base}/binders/floor/${parentId}` : null;
      case "record":    return parentId ? `${base}/records/binder/${parentId}` : null;
      case "document":  return parentId
        ? parentLevel === "record"
          ? `${base}/documents/record/${parentId}`
          : `${base}/documents/parent/${parentId}`
        : null;
    }
  }, [currentLevel, parentId, parentLevel]);

  // Cache Redux pour les données physiques
  const apiCache = useSelector((store: RootState) =>
    (store.data as unknown as Record<string, unknown>).apiCache as Record<string, ApiCacheEntry> | undefined
  );

  // Charger les données quand l'URL change — cache instantané puis revalidation
  useEffect(() => {
    if (!currentUrl) { setLevelData([]); setLevelLoading(false); return; }
    let cancelled = false;

    // Vérifier le cache Redux
    const cached = apiCache?.[currentUrl];
    if (cached) {
      // Cache disponible → afficher instantanément, pas de loading visible
      setLevelData((cached.data as unknown[]) ?? []);
      setLevelLoading(false);
      // Revalider en arrière-plan si stale (> 30s)
      if (Date.now() - cached.timestamp > 30_000) {
        executeFetch({ url: currentUrl })
          .then((res) => {
            if (!cancelled) {
              const fresh = (res.data as unknown[]) ?? [];
              setLevelData(fresh);
              dispatch(setCacheEntry({ url: currentUrl, data: fresh }));
            }
          })
          .catch(() => {});
      }
    } else {
      // Pas de cache → premier chargement visible
      setLevelLoading(true);
      executeFetch({ url: currentUrl })
        .then((res) => {
          if (!cancelled) {
            const fresh = (res.data as unknown[]) ?? [];
            setLevelData(fresh);
            dispatch(setCacheEntry({ url: currentUrl, data: fresh }));
          }
        })
        .catch(() => { if (!cancelled) setLevelData([]); })
        .finally(() => { if (!cancelled) setLevelLoading(false); });
    }

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUrl]);

  // Refetch après une mutation — invalide le cache et recharge
  useEffect(() => {
    if (dataVersion > 0) {
      dispatch(invalidateCacheAction("/api/stuff/archives/physical"));
      if (currentUrl) {
        executeFetch({ url: currentUrl })
          .then((res) => {
            const fresh = (res.data as unknown[]) ?? [];
            setLevelData(fresh);
            dispatch(setCacheEntry({ url: currentUrl, data: fresh }));
          })
          .catch(() => {});
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVersion]);

  // Élément sélectionné pour le panneau de détail
  const [selected, setSelected] = useState<{
    level: Level;
    item: Container | Shelf | Floor | Binder | PhysicalRecord | PhysicalDocument;
  } | null>(null);

  const loading = levelLoading;

  // ── Items courants ──────────────────────────────────────

  // Fetch archives liées au document courant (pour affichage mixte)
  const isInsideDocument = currentLevel === "document" && parentLevel === "document";
  const [docArchivesData, setDocArchivesData] = useState<{
    document: string; count: number;
    archives: Array<{ _id: string; designation?: string; folder?: string; classNumber?: string; status?: string; validated?: boolean; createdAt?: string }>;
  } | null>(null);

  useEffect(() => {
    if (!isInsideDocument || !parentId) { setDocArchivesData(null); return; }
    executeFetch({ url: `/api/stuff/archives/physical/documents/${parentId}/archives` })
      .then((res) => setDocArchivesData(res.data as typeof docArchivesData))
      .catch(() => setDocArchivesData(null));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInsideDocument, parentId]);

  // Transformer les données brutes (levelData) en items affichables
  const items = useMemo<{ id: string; label: string; sub?: string; meta?: string; itemType?: "document" | "archive" }[]>(() => {
    const data = levelData as Record<string, unknown>[];
    switch (currentLevel) {
      case "container":
        return data.map((c) => ({ id: c._id as string, label: c.name as string, sub: c.location as string, meta: c.description as string }));
      case "shelf":
        return data.map((s) => ({ id: s._id as string, label: s.name as string, sub: s.description as string }));
      case "floor":
        return data.map((f) => ({ id: f._id as string, label: (f.label as string) ?? `Étage ${f.number}`, sub: `N° ${f.number}` }));
      case "binder":
        return data.map((b) => ({ id: b._id as string, label: b.name as string, sub: `Nature : ${b.nature}`, meta: `${b.currentCount ?? 0} / ${b.maxCapacity} dossiers` }));
      case "record":
        return data.map((r) => ({ id: r._id as string, label: r.internalNumber as string, sub: r.subject as string, meta: r.nature as string }));
      case "document": {
        const docItems = data.map((d) => ({
          id: d._id as string,
          label: d.title as string,
          sub: (d.nature as string) ?? (d.description as string),
          meta: d.documentDate ? new Date(d.documentDate as string).toLocaleDateString("fr-FR") : undefined,
          itemType: "document" as const,
        }));
        const archiveItems = isInsideDocument
          ? (docArchivesData?.archives ?? []).map((a) => ({
              id: a._id, label: a.designation ?? a.folder ?? a._id,
              sub: a.classNumber ? `N° ${a.classNumber}` : undefined,
              meta: a.createdAt ? new Date(a.createdAt).toLocaleDateString("fr-FR") : undefined,
              itemType: "archive" as const,
            }))
          : [];
        return [...docItems, ...archiveItems];
      }
      default:
        return [];
    }
  }, [currentLevel, levelData, isInsideDocument, docArchivesData]);

  /** Retrouve l'item brut par son ID dans les données du niveau courant */
  const getItemRaw = useCallback(
    (id: string) => (levelData as Array<{ _id: string }>).find((i) => i._id === id),
    [levelData]
  );

  /** Clic sur un item dans l'explorateur → descend d'un niveau */
  const handleSelect = useCallback((id: string, label: string, itemType?: string) => {
    if (itemType === "archive") return;

    const raw = getItemRaw(id);
    if (raw) setSelected({ level: currentLevel, item: raw as Container });

    setBreadcrumb((prev) => [...prev, { id, label, level: currentLevel }]);
  }, [currentLevel, getItemRaw]);

  /** Navigation depuis l'arbre → synchronise l'explorateur avec le chemin complet */
  const handleNavigateFromTree = useCallback((path: Array<{ id: string; label: string; level: Level }>) => {
    setBreadcrumb(path);
    setSelected(null);
  }, []);

  /** Navigation depuis la recherche → chemin complet via API /path */
  const handleNavigateFromSearch = useCallback((path: Array<{ id: string; label: string; level: string }>) => {
    setBreadcrumb(path.map((p) => ({ id: p.id, label: p.label, level: p.level as Level })));
    setSelected(null);
  }, []);

  /** Clic sur un breadcrumb → remonte au niveau demandé */
  const handleBreadcrumb = useCallback((index: number) => {
    setBreadcrumb((prev) => prev.slice(0, index));
    setSelected(null);
  }, []);

  /** Clic droit sur un élément → menu contextuel */
  const handleContextMenu = useCallback((e: React.MouseEvent, id: string, label: string) => {
    e.preventDefault();
    setContextMenu({
      mouseX: e.clientX,
      mouseY: e.clientY,
      itemId: id,
      itemLabel: label,
      level: currentLevel,
    });
  }, [currentLevel]);

  const levelConfig: Record<Level, { icon: React.ReactNode; label: string; color: string }> = {
    container: { icon: <WarehouseOutlinedIcon />,          label: "Conteneur", color: "#5C6BC0" },
    shelf:     { icon: <DnsOutlinedIcon />,                label: "Étagère",   color: "#26A69A" },
    floor:     { icon: <ViewStreamOutlinedIcon />,         label: "Niveau",    color: "#42A5F5" },
    binder:    { icon: <StyleOutlinedIcon />,              label: "Classeur",  color: "#FFA726" },
    record:    { icon: <FolderOutlinedIcon />,             label: "Dossier",   color: "#AB47BC" },
    document:  { icon: <TopicOutlinedIcon />,               label: "Document",  color: "#78909C" },
  };

  // Écouter le deep navigate — naviguer vers un chemin physique
  useEffect(() => {
    const target = location.state?.deepTarget as DeepTarget | undefined;
    if (!target?.physicalPath?.length) return;
    setBreadcrumb(target.physicalPath.map((p) => ({ id: p.id, label: p.label, level: p.level as Level })));
    setSelected(null);
  }, [location.state?.deepTarget]);

  // Flash + scroll vers le dernier élément du chemin physique
  const deepPhysicalPath = (location.state?.deepTarget as DeepTarget | undefined)?.physicalPath;
  const deepPhysicalLastId = deepPhysicalPath?.length ? deepPhysicalPath[deepPhysicalPath.length - 1].id : null;
  useHighlightElement(deepPhysicalLastId);

  const showDetail = selected !== null;
  const insideContainer = breadcrumb.length > 0;

  return (
    <Box display="flex" flex={1} overflow="hidden" height="100%" flexDirection="column">
      {/* ── Barre de navigation (fil d'Ariane) ────────────────── */}
      <Box
        px={{ xs: 1, sm: 2 }}
        py={0.75}
        display="flex"
        alignItems="center"
        gap={0.5}
        flexWrap="wrap"
        borderBottom={1}
        borderColor="divider"
        bgcolor="background.paper"
        minHeight={{ xs: 36, sm: 44 }}>
        <Typography
          sx={{ cursor: "pointer", fontWeight: breadcrumb.length === 0 ? "bold" : "normal", "&:hover": { textDecoration: "underline" }, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
          color={breadcrumb.length === 0 ? "text.primary" : "text.secondary"}
          onClick={() => handleBreadcrumb(0)}>
          Archivage physique
        </Typography>
        {breadcrumb.map((b, i) => (
          <React.Fragment key={b.id}>
            <NavigateNextRoundedIcon sx={{ fontSize: { xs: 14, sm: 18 }, color: "text.disabled" }} />
            <Typography
              sx={{ cursor: "pointer", fontWeight: i === breadcrumb.length - 1 ? "bold" : "normal", "&:hover": { textDecoration: "underline" }, fontSize: { xs: "0.75rem", sm: "0.875rem" }, maxWidth: { xs: 100, sm: 200 }, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              color={i === breadcrumb.length - 1 ? "text.primary" : "text.secondary"}
              onClick={() => handleBreadcrumb(i + 1)}>
              {b.label}
            </Typography>
          </React.Fragment>
        ))}
        <Box flex={1} />
        <Box sx={{ width: { xs: 150, sm: 220, md: 280 } }}>
          <PhysicalSearch headers={headers} onNavigate={handleNavigateFromSearch} />
        </Box>
      </Box>

      {/* ── Contenu principal : arbre + explorateur + détail ────── */}
      <Box display="flex" flex={1} overflow="hidden">

        {/* ── Sidebar arborescence (visible uniquement dans un conteneur) ── */}
        {insideContainer && (
        <Box sx={{
          width: { lg: 300, xl: 340 },
          flexShrink: 0,
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          borderRight: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}>
          <Box px={1.5} borderBottom={1} borderColor="divider" bgcolor="action.hover" display="flex" alignItems="center" minHeight={42}>
            <Box display="flex" alignItems="center" gap={0.5} flex={1}>
              <WarehouseOutlinedIcon sx={{ fontSize: 16, color: levelConfig.container.color }} />
              <Typography variant="caption" fontWeight="bold" color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
                Conteneurs
              </Typography>
            </Box>
            {canWrite && (
              <Tooltip title="Nouveau conteneur">
                <IconButton size="small" onClick={() => { setFormLevel("container"); setFormParentId(undefined); setFormOpen(true); }}>
                  <AddRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <PhysicalTreeView
            headers={headers}
            selectedId={parentId ?? null}
            expandedIds={breadcrumb.map((b) => b.id)}
            onSelect={handleNavigateFromTree}
            dataVersion={dataVersion}
            canWrite={canWrite}
            onContextMenu={(e, id, label, level) => {
              e.preventDefault();
              setContextMenu({ mouseX: e.clientX, mouseY: e.clientY, itemId: id, itemLabel: label, level });
            }}
            onRename={async (id, level, newValue) => {
              const field = RENAME_FIELD[level];
              await executeFetch({ url: `${UPDATE_ENDPOINTS[level]}/${id}`, method: "PUT", data: { [field]: newValue } });
              setBreadcrumb((prev) => prev.map((b) => b.id === id ? { ...b, label: newValue } : b));
              dispatch(invalidateCacheAction("/api/stuff/archives/physical"));
              dispatch(incrementVersion());
            }}
          />
        </Box>
        )}

        {/* ── Panneau central (toujours visible) ──────── */}
        <Box sx={{
          flex: 1, minWidth: 0,
          display: isMobile && showDetail ? "none" : "flex",
          flexDirection: "column",
          borderRight: showDetail ? { xs: "none", md: "1px solid" } : "none",
          borderColor: "divider", overflow: "hidden",
        }}>
          <Box px={2} display="flex" alignItems="center" gap={1} borderBottom={1} borderColor="divider" bgcolor="action.hover" minHeight={42}>
            {insideContainer && (() => {
              const parent = breadcrumb[breadcrumb.length - 1];
              const parentConfig = levelConfig[parent.level];
              return (
                <>
                  <Box sx={{ color: parentConfig.color, display: "flex" }}>
                    {React.cloneElement(parentConfig.icon as React.ReactElement, { fontSize: "small" })}
                  </Box>
                  <Typography variant="body2" fontWeight="bold" color={parentConfig.color} noWrap sx={{ maxWidth: { xs: 80, sm: 150 } }}>
                    {parent.label}
                  </Typography>
                  <NavigateNextRoundedIcon sx={{ fontSize: 16, color: "text.disabled" }} />
                </>
              );
            })()}
            <Box sx={{ color: levelConfig[currentLevel].color, display: "flex" }}>
              {React.cloneElement(levelConfig[currentLevel].icon as React.ReactElement, { fontSize: "small" })}
            </Box>
            <Typography variant="body2" fontWeight="bold" color={levelConfig[currentLevel].color}>
              {levelConfig[currentLevel].label}s
            </Typography>
            {loading
              ? <Skeleton variant="rounded" width={28} height={20} />
              : <Chip label={items.length} size="small" sx={{ height: 20, fontSize: "0.7rem" }} />
            }
            <Box flex={1} />
            {canWrite && (
              <Tooltip title={`Ajouter ${{ container: "un conteneur", shelf: "une étagère", floor: "un niveau", binder: "un classeur", record: "un dossier", document: "un document" }[currentLevel]}`}>
                <IconButton size="small" onClick={() => { setFormLevel(currentLevel); setFormParentId(parentId); setFormOpen(true); }}>
                  <AddRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* Ligne parent (..) pour remonter */}
          {breadcrumb.length > 0 && (
            <Box
              px={2}
              py={0.75}
              display="flex"
              alignItems="center"
              gap={1}
              sx={{ cursor: "pointer", "&:hover": { bgcolor: "action.hover" }, borderBottom: "1px solid", borderColor: "divider" }}
              onClick={() => handleBreadcrumb(breadcrumb.length - 1)}>
              <KeyboardReturnOutlinedIcon fontSize="small" sx={{ color: "text.disabled", transform: "scaleX(-1)" }} />
              <Typography variant="body2" color="text.secondary">..</Typography>
            </Box>
          )}

          {/* Liste des éléments */}
          <Box overflow="auto" flex={1} sx={{ ...scrollBarSx }}>
            {loading ? (
              <Stack spacing={0}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Box key={i} px={2} py={0.75} display="flex" alignItems="center" gap={1} borderBottom="1px solid" borderColor="divider">
                    <Skeleton variant="circular" width={20} height={20} />
                    <Box flex={1}>
                      <Skeleton variant="text" width="60%" height={20} />
                      <Skeleton variant="text" width="40%" height={14} />
                    </Box>
                    <Skeleton variant="text" width={80} height={14} sx={{ display: { xs: "none", sm: "block" } }} />
                  </Box>
                ))}
              </Stack>
            ) : items.length === 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={6} gap={1}>
                <Box sx={{ color: levelConfig[currentLevel].color, opacity: 0.4 }}>
                  {React.cloneElement(levelConfig[currentLevel].icon as React.ReactElement, { sx: { fontSize: 40 } })}
                </Box>
                <Typography color="text.secondary" variant="body2">
                  Aucun {levelConfig[currentLevel].label.toLowerCase()}
                </Typography>
                <Typography color="text.disabled" variant="caption">
                  Utilisez le bouton + dans l&apos;arborescence pour en créer
                </Typography>
              </Box>
            ) : (
              items.map((item) => {
                const isSelected = selected?.item && (selected.item as { _id: string })._id === item.id;
                return (
                  <Box
                    key={item.id}
                    data-highlight-id={item.id}
                    px={2}
                    py={0.75}
                    display="flex"
                    alignItems="center"
                    gap={1}
                    sx={{
                      cursor: "pointer",
                      bgcolor: isSelected ? "action.selected" : "transparent",
                      "&:hover": { bgcolor: isSelected ? "action.selected" : "action.hover" },
                      borderBottom: "1px solid",
                      borderColor: "divider",
                    }}
                    onClick={() => handleSelect(item.id, item.label, item.itemType)}
                    onContextMenu={(e) => handleContextMenu(e, item.id, item.label)}>
                    {/* Icône — document vs archive */}
                    <Box sx={{
                      color: item.itemType === "archive" ? "#43A047" : levelConfig[currentLevel].color,
                      display: "flex", flexShrink: 0
                    }}>
                      {item.itemType === "archive"
                        ? <ArticleOutlinedIcon fontSize="small" />
                        : React.cloneElement(levelConfig[currentLevel].icon as React.ReactElement, { fontSize: "small" })
                      }
                    </Box>
                    {/* Nom (renommable au double-clic) + sous-titre */}
                    <Box flex={1} minWidth={0}>
                      <InlineEditableLabel
                        value={item.label}
                        editable={canWrite && item.itemType !== "archive"}
                        onSave={async (newValue) => {
                          const field = RENAME_FIELD[currentLevel];
                          await executeFetch({ url: `${UPDATE_ENDPOINTS[currentLevel]}/${item.id}`, method: "PUT", data: { [field]: newValue } });
                          setBreadcrumb((prev) => prev.map((b) => b.id === item.id ? { ...b, label: newValue } : b));
                          dispatch(invalidateCacheAction("/api/stuff/archives/physical"));
                          dispatch(incrementVersion());
                        }}
                        variant="body2"
                        fontWeight={500}
                        noWrap
                      />
                      {item.sub && (
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {item.sub}
                        </Typography>
                      )}
                    </Box>
                    {/* Flèche navigation (pas pour les archives) */}
                    {item.itemType !== "archive" && (
                      <NavigateNextRoundedIcon fontSize="small" sx={{ color: "text.disabled", flexShrink: 0 }} />
                    )}
                  </Box>
                );
              })
            )}
          </Box>
        </Box>

        {/* ── Panneau droit : détail (masqué si pas dans un conteneur) ── */}
        {insideContainer && (
        <Box flex={1} overflow="auto" p={2} sx={{
          ...scrollBarSx,
          display: isMobile && !showDetail ? "none" : "flex",
          flexDirection: "column",
        }}>
          {isMobile && showDetail && (
            <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => setSelected(null)} sx={{ mb: 1, alignSelf: "flex-start" }} size="small">
              Retour
            </Button>
          )}
          {!selected ? (
            <Box display="flex" flex={1} justifyContent="center" alignItems="center" height="100%">
              <Stack alignItems="center" gap={1}>
                <InfoOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                <Typography color="text.secondary" variant="body2">
                  Sélectionnez un élément pour afficher ses détails
                </Typography>
              </Stack>
            </Box>
          ) : (
            <DetailPanel
              level={selected.level}
              item={selected.item}
              headers={headers}
              onDelete={(id, label) => setDeleteTarget({ level: selected.level, id, label })}
            />
          )}
        </Box>
        )}

      </Box>

      {/* Formulaire de création */}
      <PhysicalEntityForm
        open={formOpen}
        level={formLevel as PhysicalLevel}
        parentId={formParentId}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          setFormOpen(false);
          dispatch(incrementVersion());
        }}
      />

      {/* Menu contextuel (clic droit) */}
      <PhysicalContextMenu
        state={contextMenu}
        onClose={() => setContextMenu(null)}
        canWrite={canWrite}
        onAdd={(level, pid) => {
          // Ouvrir le formulaire pour créer un enfant du niveau suivant
          const nextLevels: Record<Level, Level> = {
            container: "shelf", shelf: "floor", floor: "binder",
            binder: "record", record: "document", document: "document",
          };
          setFormLevel(nextLevels[level]);
          setFormParentId(pid);
          setFormOpen(true);
        }}
        onDelete={(id, label, level) => setDeleteTarget({ level, id, label })}
        onViewDetail={(id, level) => {
          const raw = getItemRaw(id);
          if (raw) setSelected({ level, item: raw as Container });
        }}
      />

      {/* Dialogue de confirmation de suppression */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle component="div" fontWeight="bold">
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Êtes-vous sûr de vouloir supprimer <strong>« {deleteTarget?.label} »</strong> ?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Cette action est définitive et ne peut pas être annulée. Si cet élément contient des sous-éléments, vous devrez les supprimer d&apos;abord.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} color="inherit" disabled={deleting}>
            Annuler
          </Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error" disabled={deleting}>
            {deleting ? "Suppression en cours…" : "Supprimer définitivement"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

