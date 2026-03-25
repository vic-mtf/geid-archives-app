/**
 * PhysicalArchiveContent — Explorateur hiérarchique de l'archivage physique
 * (Conteneur > Étagère > Niveau > Classeur > Dossier > Document).
 */
import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Box,
  Button,
  Chip,
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
import KeyboardReturnOutlinedIcon   from "@mui/icons-material/KeyboardReturnOutlined";
import InfoOutlinedIcon             from "@mui/icons-material/InfoOutlined";
import NavigateNextRoundedIcon      from "@mui/icons-material/NavigateNextRounded";

import useAxios      from "@/hooks/useAxios";
import { useSnackbar } from "notistack";
import useToken      from "@/hooks/useToken";
import { type PhysicalLevel, UPDATE_ENDPOINTS, RENAME_FIELD } from "@/constants/physical";
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
import BreadcrumbBar, { type BreadcrumbItem } from "./BreadcrumbBar";
import SidebarTree   from "./SidebarTree";
import { levelConfig } from "./levelConfig";
import DetailPanel       from "./DetailPanel";
import PhysicalContextMenu, { type ContextMenuState } from "./PhysicalContextMenu";
import ArchiveContextMenu, { type ArchiveMenuState } from "./ArchiveContextMenu";
import PhysicalItemsList from "./PhysicalItemsList";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import ResizeDivider from "./ResizeDivider";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragStartEvent } from "@dnd-kit/core";
import useArchiveDnd, { type ArchiveDragData } from "./useArchiveDnd";
import getFileIcon from "@/utils/getFileIcon";
import openArchiveFile from "@/utils/openArchiveFile";
import useDeletePhysical from "./useDeletePhysical";

// ── Types locaux ───────────────────────────────────────────

type Level = PhysicalLevel;

// ── Composant principal ────────────────────────────────────

export default function PhysicalArchiveContent() {
  const Authorization = useToken();
  const headers = useMemo(() => ({ Authorization: Authorization ?? "" }), [Authorization]);
  const dispatch = useDispatch<AppDispatch>();
  const { enqueueSnackbar } = useSnackbar();
  const dataVersion = useSelector((store: RootState) => store.data.dataVersion);
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { canWrite } = useArchivePermissions();

  // Largeur du tree (ajustable par drag)
  const [treeWidth, setTreeWidth] = useState(280);

  // Formulaire de création
  const [formOpen, setFormOpen] = useState(false);
  const [formParentId, setFormParentId] = useState<string | undefined>(undefined);
  const [formLevel, setFormLevel] = useState<Level>("container");
  const [formParentLevel, setFormParentLevel] = useState<Level | undefined>(undefined);

  // Menu contextuel (clic droit) — éléments physiques
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  // Menu contextuel — archives numériques
  const [archiveMenu, setArchiveMenu] = useState<ArchiveMenuState | null>(null);

  // ID de l'élément en cours de renommage (déclenché depuis le menu contextuel)
  const [renamingId, setRenamingId] = useState<string | null>(null);

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
  const [levelData, setLevelData] = useState<unknown[]>([]);
  const [levelLoading, setLevelLoading] = useState(false);
  const [, executeFetch] = useAxios({ headers }, { manual: true });

  // Drag & drop d'archives entre documents
  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const { handleDragEnd } = useArchiveDnd({ headers, canWrite, executeFetch });
  const [activeDrag, setActiveDrag] = useState<{ label: string; fileUrl?: string } | null>(null);
  const handleDragStart = useCallback((e: DragStartEvent) => {
    const data = e.active.data.current as ArchiveDragData | undefined;
    if (data?.type === "archive") {
      setActiveDrag({ label: data.archiveLabel, fileUrl: undefined });
    }
  }, []);
  const handleDragEndWrapped = useCallback((e: Parameters<typeof handleDragEnd>[0]) => {
    setActiveDrag(null);
    handleDragEnd(e);
  }, [handleDragEnd]);

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

    const cached = apiCache?.[currentUrl];
    if (cached) {
      setLevelData((cached.data as unknown[]) ?? []);
      setLevelLoading(false);
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

  // Refetch après une mutation
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

  // Suppression d'éléments physiques (hook dédié)
  const { deleteTarget, setDeleteTarget, deleting, handleDeleteConfirm } = useDeletePhysical(
    headers, breadcrumb, setBreadcrumb,
    () => setSelected(null), setLevelData, executeFetch,
  );

  // ── Archives liées au document courant (quand on est dans un document) ──
  const isInsideDocument = currentLevel === "document" && parentLevel === "document";
  const [docArchives, setDocArchives] = useState<Array<{ _id: string; designation?: string; fileUrl?: string; classNumber?: string; createdAt?: string }>>([]);

  useEffect(() => {
    if (!isInsideDocument || !parentId) { setDocArchives([]); return; }
    executeFetch({ url: `/api/stuff/archives/physical/documents/${parentId}/archives` })
      .then((res) => {
        const data = res.data as { archives?: typeof docArchives };
        setDocArchives(data?.archives ?? []);
      })
      .catch(() => setDocArchives([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInsideDocument, parentId, dataVersion]);

  // ── Items courants ──────────────────────────────────────

  const items = useMemo<{ id: string; label: string; sub?: string; meta?: string; isArchive?: boolean; fileUrl?: string }[]>(() => {
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
        const docs = data.map((d) => ({
          id: d._id as string,
          label: d.title as string,
          sub: (d.nature as string) ?? (d.description as string),
          meta: d.documentDate ? new Date(d.documentDate as string).toLocaleDateString("fr-FR") : undefined,
        }));
        const archives = docArchives.map((a) => ({
          id: a._id,
          label: a.designation ?? "Archive",
          sub: a.classNumber ? `N° ${a.classNumber}` : undefined,
          meta: a.createdAt ? new Date(a.createdAt).toLocaleDateString("fr-FR") : undefined,
          isArchive: true,
          fileUrl: a.fileUrl,
        }));
        return [...docs, ...archives];
      }
      default:
        return [];
    }
  }, [currentLevel, levelData, docArchives]);

  const getItemRaw = useCallback(
    (id: string) => (levelData as Array<{ _id: string }>).find((i) => i._id === id),
    [levelData]
  );

  const handleSelect = useCallback((id: string, label: string) => {
    const raw = getItemRaw(id);
    if (raw) setSelected({ level: currentLevel, item: raw as Container });
    setBreadcrumb((prev) => [...prev, { id, label, level: currentLevel }]);
  }, [currentLevel, getItemRaw]);

  const handleNavigateFromTree = useCallback((path: Array<{ id: string; label: string; level: Level }>) => {
    setBreadcrumb(path);
    setSelected(null);
  }, []);

  const handleNavigateFromSearch = useCallback((path: Array<{ id: string; label: string; level: string }>) => {
    setBreadcrumb(path.map((p) => ({ id: p.id, label: p.label, level: p.level as Level })));
    setSelected(null);
  }, []);

  const handleBreadcrumb = useCallback((index: number) => {
    setBreadcrumb((prev) => prev.slice(0, index));
    setSelected(null);
  }, []);

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

  // Écouter le deep navigate
  useEffect(() => {
    const target = location.state?.deepTarget as DeepTarget | undefined;
    if (!target?.physicalPath?.length) return;
    setBreadcrumb(target.physicalPath.map((p) => ({ id: p.id, label: p.label, level: p.level as Level })));
    setSelected(null);
  }, [location.state?.deepTarget]);

  const deepPhysicalPath = (location.state?.deepTarget as DeepTarget | undefined)?.physicalPath;
  const deepPhysicalLastId = deepPhysicalPath?.length ? deepPhysicalPath[deepPhysicalPath.length - 1].id : null;
  useHighlightElement(deepPhysicalLastId);

  const showDetail = selected !== null;
  const insideContainer = breadcrumb.length > 0;

  return (
    <DndContext sensors={dndSensors} onDragStart={handleDragStart} onDragEnd={handleDragEndWrapped}>
    <Box display="flex" flex={1} overflow="hidden" height="100%" flexDirection="column">
      {/* ── Barre de navigation (fil d'Ariane) ────────────────── */}
      <BreadcrumbBar
        breadcrumb={breadcrumb}
        headers={headers}
        onBreadcrumbClick={handleBreadcrumb}
        onNavigateFromSearch={handleNavigateFromSearch}
      />

      {/* ── Contenu principal : CSS Grid stable ────── */}
      <Box sx={{
        display: "grid",
        flex: 1,
        overflow: "hidden",
        minHeight: 0,
        gridTemplateColumns: insideContainer
          ? {
              xs: showDetail ? "0px 0px 0px 1fr" : "0px 0px 1fr 0px",
              md: `${treeWidth}px 1px 1fr 280px`,
              lg: `${treeWidth}px 1px 1fr 320px`,
            }
          : "1fr",
      }}>

        {/* ── Col 1 : Sidebar arborescence ── */}
        {insideContainer && (
          <SidebarTree
            headers={headers}
            parentId={parentId}
            breadcrumb={breadcrumb}
            dataVersion={dataVersion}
            canWrite={canWrite}
            renamingId={renamingId}
            onSetFormOpen={(level, pid, pLevel) => {
              setFormLevel(level);
              setFormParentId(pid);
              setFormParentLevel(pLevel);
              setFormOpen(true);
            }}
            onNavigateFromTree={handleNavigateFromTree}
            onContextMenu={(state) => setContextMenu(state)}
            onArchiveContextMenu={(e, archiveId, label) => {
              setArchiveMenu({ mouseX: e.clientX, mouseY: e.clientY, archiveId, archiveLabel: label });
            }}
            onRenamingEnd={() => setRenamingId(null)}
            setBreadcrumb={setBreadcrumb}
            executeFetch={executeFetch}
          />
        )}

        {/* ── Col 2 : Séparateur ajustable ── */}
        {insideContainer && (
          <ResizeDivider
            onResize={setTreeWidth}
            minLeft={180}
            minRight={250}
          />
        )}

        {/* ── Col 3 : Panneau central ──────── */}
        <Box sx={{ display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
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
                <IconButton size="small" onClick={() => { setFormLevel(currentLevel); setFormParentId(parentId); setFormParentLevel(breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1]?.level : undefined); setFormOpen(true); }}>
                  <AddRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {breadcrumb.length > 0 && (
            <Box
              px={2} py={0.75} display="flex" alignItems="center" gap={1}
              sx={{ cursor: "pointer", "&:hover": { bgcolor: "action.hover" }, borderBottom: "1px solid", borderColor: "divider" }}
              onClick={() => handleBreadcrumb(breadcrumb.length - 1)}>
              <KeyboardReturnOutlinedIcon fontSize="small" sx={{ color: "text.disabled", transform: "scaleX(-1)" }} />
              <Typography variant="body2" color="text.secondary">..</Typography>
            </Box>
          )}

          <PhysicalItemsList
            loading={loading}
            items={items}
            currentLevel={currentLevel}
            levelConfig={levelConfig}
            selectedId={selected?.item ? (selected.item as { _id: string })._id : null}
            canWrite={canWrite}
            renamingId={renamingId}
            onRenamingEnd={() => setRenamingId(null)}
            onSelect={handleSelect}
            onContextMenu={handleContextMenu}
            onArchiveContextMenu={(e, archiveId, label) => {
              setArchiveMenu({ mouseX: e.clientX, mouseY: e.clientY, archiveId, archiveLabel: label });
            }}
            onRename={async (id, newValue) => {
              const field = RENAME_FIELD[currentLevel];
              await executeFetch({ url: `${UPDATE_ENDPOINTS[currentLevel]}/${id}`, method: "PUT", data: { [field]: newValue } });
              setBreadcrumb((prev) => prev.map((b) => b.id === id ? { ...b, label: newValue } : b));
              dispatch(invalidateCacheAction("/api/stuff/archives/physical"));
              dispatch(incrementVersion());
            }}
          />
        </Box>

        {/* ── Col 4 : Panneau détail ── */}
        {insideContainer && (
        <Box sx={{
          ...scrollBarSx,
          overflowY: "auto",
          minHeight: 0,
          p: 2,
          display: "flex",
          flexDirection: "column",
          borderLeft: "1px solid",
          borderColor: "divider",
        }}>
          {isMobile && showDetail && (
            <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => setSelected(null)} sx={{ mb: 1, alignSelf: "flex-start" }} size="small">
              Retour
            </Button>
          )}
          {!selected ? (
            <Box display="flex" flex={1} justifyContent="center" alignItems="center" height="100%">
              <Stack alignItems="center" gap={1} px={2} textAlign="center">
                <InfoOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                <Typography color="text.secondary" variant="body2">
                  Sélectionnez un élément pour consulter ses informations
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
        parentLevel={formParentLevel as PhysicalLevel | undefined}
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
          const nextLevels: Record<Level, Level> = {
            container: "shelf", shelf: "floor", floor: "binder",
            binder: "record", record: "document", document: "document",
          };
          setFormLevel(nextLevels[level]);
          setFormParentId(pid);
          setFormParentLevel(level);
          setFormOpen(true);
        }}
        onDelete={(id, label, level) => setDeleteTarget({ level, id, label })}
        onViewDetail={(id, level) => {
          const raw = getItemRaw(id);
          if (raw) setSelected({ level, item: raw as Container });
        }}
        onRename={(id) => setRenamingId(id)}
      />

      {/* Menu contextuel archives numériques */}
      <ArchiveContextMenu
        state={archiveMenu}
        onClose={() => setArchiveMenu(null)}
        canWrite={canWrite}
        onOpen={(archiveId) => openArchiveFile(archiveId, archiveMenu?.archiveLabel)}
        onMove={(archiveId, label) => {
          document.getElementById("root")?.dispatchEvent(
            new CustomEvent("__link_physical_record", {
              detail: { doc: { _id: archiveId, designation: label } },
            })
          );
        }}
        onUnlink={async (archiveId, label) => {
          try {
            await executeFetch({
              url: `/api/stuff/archives/${archiveId}`,
              method: "PUT",
              data: { record: null, document: null },
            });
            dispatch(incrementVersion());
            enqueueSnackbar(`L'archive « ${label} » a été dissociée du document.`, { variant: "success" });
          } catch {
            enqueueSnackbar("La dissociation a échoué. Vérifiez vos droits et réessayez.", { variant: "error" });
          }
        }}
      />

      {/* Dialogue de confirmation de suppression */}
      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        label={deleteTarget?.label}
        deleting={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </Box>
    <DragOverlay dropAnimation={null}>
      {activeDrag && (() => {
        const fi = getFileIcon(activeDrag.fileUrl ?? activeDrag.label);
        return (
          <Box sx={{
            display: "flex", alignItems: "center", gap: 1,
            px: 1.5, py: 0.75, borderRadius: 1.5,
            bgcolor: "background.paper",
            boxShadow: 4, border: "1px solid", borderColor: "primary.main",
            maxWidth: 260,
          }}>
            <Box sx={{ color: fi.color, display: "flex", flexShrink: 0 }}>
              {React.cloneElement(fi.icon, { fontSize: "small" })}
            </Box>
            <Typography variant="body2" fontWeight={500} noWrap>
              {activeDrag.label}
            </Typography>
          </Box>
        );
      })()}
    </DragOverlay>
    </DndContext>
  );
}
