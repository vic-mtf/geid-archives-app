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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ArrowBackOutlinedIcon         from "@mui/icons-material/ArrowBackOutlined";
import AddOutlinedIcon               from "@mui/icons-material/AddOutlined";
import KeyboardReturnOutlinedIcon   from "@mui/icons-material/KeyboardReturnOutlined";
import InfoOutlinedIcon             from "@mui/icons-material/InfoOutlined";
import NavigateNextOutlinedIcon      from "@mui/icons-material/NavigateNextOutlined";

import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import useToken      from "@/hooks/useToken";
import { type PhysicalLevel, UPDATE_ENDPOINTS, RENAME_FIELD } from "@/constants/physical";
import { useLocation } from "react-router-dom";
import type { DeepTarget } from "@/utils/deepNavigate";
import useHighlightElement from "@/hooks/useHighlightElement";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { incrementVersion, invalidateCache as invalidateCacheAction } from "@/redux/data";
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
import usePanelWidth from "@/hooks/usePanelWidth";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragStartEvent } from "@dnd-kit/core";
import useArchiveDnd, { type ArchiveDragData } from "./useArchiveDnd";
import getFileIcon from "@/utils/getFileIcon";
import openArchiveFile from "@/utils/openArchiveFile";
import useDeletePhysical from "./useDeletePhysical";
import usePhysicalData from "./usePhysicalData";

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
  const { t } = useTranslation();

  // Largeur du tree (ajustable par drag)
  const [treeWidth, setTreeWidth] = usePanelWidth("physical.tree", 280);

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

  // ── Chargement des données (hook dédié) ─────────────────────
  const { levelData, setLevelData, levelLoading, executeFetch, apiCache, items } = usePhysicalData({
    currentLevel, parentId, parentLevel, dataVersion, headers,
  });

  // Drag & drop d'archives entre documents
  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const { handleDragEnd, moveConfirm, confirmMove, cancelMove } = useArchiveDnd({ headers, canWrite, executeFetch });
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
              xs: showDetail ? "0px 0px 0px minmax(0, 1fr)" : "0px 0px minmax(0, 1fr) 0px",
              md: `${treeWidth}px 1px minmax(0, 1fr) 280px`,
              lg: `${treeWidth}px 1px minmax(0, 1fr) 320px`,
            }
          : "minmax(0, 1fr)",
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
                  <NavigateNextOutlinedIcon sx={{ fontSize: 16, color: "text.disabled" }} />
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
              <Tooltip title={`${t("common.add")} ${t(`physical.addItem.${currentLevel}`)}`}>
                <IconButton size="small" onClick={() => { setFormLevel(currentLevel); setFormParentId(parentId); setFormParentLevel(breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1]?.level : undefined); setFormOpen(true); }}>
                  <AddOutlinedIcon sx={{ fontSize: 18 }} />
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
            parentDocumentId={[...breadcrumb].reverse().find((b) => b.level === "document")?.id}
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
            <Button startIcon={<ArrowBackOutlinedIcon />} onClick={() => setSelected(null)} sx={{ mb: 1, alignSelf: "flex-start" }} size="small">
              {t("common.back")}
            </Button>
          )}
          {!selected ? (() => {
            // Par défaut afficher les infos du conteneur actif
            const activeContainer = breadcrumb.length > 0
              ? (apiCache?.["/api/stuff/archives/physical/containers"]?.data as Array<Record<string, unknown>> | undefined)
                  ?.find((c) => c._id === breadcrumb[0].id)
              : undefined;
            if (activeContainer) {
              return (
                <DetailPanel
                  level="container"
                  item={activeContainer as unknown as Container}
                  onDelete={(id, label) => setDeleteTarget({ level: "container", id, label })}
                  headers={headers}
                />
              );
            }
            return (
              <Box display="flex" flex={1} justifyContent="center" alignItems="center" height="100%">
                <Stack alignItems="center" gap={1} px={2} textAlign="center">
                  <InfoOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                  <Typography color="text.secondary" variant="body2">
                    {t("physical.selectElementDetail")}
                  </Typography>
                </Stack>
              </Box>
            );
          })() : (
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
            enqueueSnackbar(t("notifications.archiveUnlinkedFromDoc", { label }), { variant: "success" });
          } catch {
            enqueueSnackbar(t("notifications.archiveUnlinkFromDocFailed"), { variant: "error" });
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

      {/* Confirmation de déplacement d'archive par drag & drop */}
      <Dialog open={Boolean(moveConfirm)} onClose={cancelMove} maxWidth="xs" fullWidth fullScreen={isMobile} BackdropProps={{ sx: { bgcolor: (theme: any) => theme.palette.background.paper + theme.customOptions.opacity, backdropFilter: (theme: any) => `blur(${theme.customOptions.blur})` } }} PaperProps={{ sx: { border: 1, borderColor: "divider" } }}>
        <DialogTitle component="div" fontWeight="bold">
          {t("dialogs.confirmMove")}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" dangerouslySetInnerHTML={{ __html: t("dialogs.moveMessage", { archiveLabel: moveConfirm?.archiveLabel, documentLabel: moveConfirm?.documentLabel }) }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelMove} color="inherit">{t("common.cancel")}</Button>
          <Button onClick={confirmMove} variant="contained">{t("dialogs.moveAction")}</Button>
        </DialogActions>
      </Dialog>
    </Box>
    <DragOverlay dropAnimation={null}>
      {activeDrag && (() => {
        const fi = getFileIcon(activeDrag.fileUrl ?? activeDrag.label);
        return (
          <Box sx={{
            display: "flex", alignItems: "center", gap: 0.75,
            px: 1.5, py: 0.5, borderRadius: 1,
            bgcolor: "action.hover",
            maxWidth: 280,
            opacity: 0.9,
          }}>
            <Box sx={{ color: fi.color, display: "flex", flexShrink: 0 }}>
              {React.cloneElement(fi.icon, { sx: { fontSize: 16 } })}
            </Box>
            <Typography variant="body2" noWrap sx={{ fontSize: "0.8rem" }}>
              {activeDrag.label}
            </Typography>
          </Box>
        );
      })()}
    </DragOverlay>
    </DndContext>
  );
}
