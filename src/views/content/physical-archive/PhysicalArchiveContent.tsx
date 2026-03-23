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
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
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
import type { PhysicalLevel } from "@/constants/physical";
import DetailPanel   from "./DetailPanel";
import { useSnackbar } from "notistack";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { incrementVersion } from "@/redux/data";
import type { Container, Shelf, Floor, Binder, PhysicalRecord, PhysicalDocument } from "@/types";
import scrollBarSx   from "@/utils/scrollBarSx";
import PhysicalEntityForm from "@/views/forms/physical/PhysicalEntityForm";

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
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { enqueueSnackbar } = useSnackbar();

  // Formulaire de création
  const [formOpen, setFormOpen] = useState(false);

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

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const levelLabels: Record<string, string> = {
      container: "conteneur",
      shelf:     "étagère",
      floor:     "travée",
      binder:    "dossier",
      record:    "fiche physique",
      document:  "document",
    };
    const levelLabel = levelLabels[deleteTarget.level] ?? "élément";
    const key = enqueueSnackbar(`Suppression du ${levelLabel} en cours, veuillez patienter…`, { autoHideDuration: null });
    try {
      await executeDelete({ url: `${deleteEndpoints[deleteTarget.level]}/${deleteTarget.id}` });
      enqueueSnackbar(
        `Le ${levelLabel} « ${deleteTarget.label} » a été supprimé de l'inventaire physique. Les archives associées ne sont plus rattachées à ce support.`,
        { variant: "success", title: `${levelLabel.charAt(0).toUpperCase() + levelLabel.slice(1)} supprimé` }
      );
      setDeleteTarget(null);
      setSelected(null);
      // Si on est dans un sous-niveau, revenir au niveau parent
      if (breadcrumb.length > 0 && breadcrumb[breadcrumb.length - 1].id === deleteTarget.id) {
        setBreadcrumb((prev) => prev.slice(0, -1));
      }
      dispatch(incrementVersion());
    } catch (err: unknown) {
      const msg =
        ((err as { response?: { data?: { error?: string } } })?.response?.data?.error) ??
        `La suppression du ${levelLabel} a échoué. Il n'a pas été modifié. Vérifiez vos droits et réessayez.`;
      enqueueSnackbar(msg, { variant: "error", title: "Suppression impossible" });
    } finally {
      enqueueSnackbar("", { key, persist: false });
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

  // URL des documents : dépend si le parent est un record ou un document
  const documentsUrl = currentLevel === "document" && parentId
    ? parentLevel === "record"
      ? `/api/stuff/archives/physical/documents/record/${parentId}`   // premier niveau
      : `/api/stuff/archives/physical/documents/parent/${parentId}`   // sous-documents
    : null;

  // ── Chargement selon le niveau ──────────────────────────

  const [{ data: containers, loading: cLoading }, refetchContainers] = useAxios<Container[]>(
    { url: "/api/stuff/archives/physical/containers", headers },
    { manual: currentLevel !== "container" }
  );

  const [{ data: shelves, loading: sLoading }, refetchShelves] = useAxios<Shelf[]>(
    { url: `/api/stuff/archives/physical/shelves/container/${parentId}`, headers },
    { manual: currentLevel !== "shelf" || !parentId }
  );

  const [{ data: floors, loading: fLoading }, refetchFloors] = useAxios<Floor[]>(
    { url: `/api/stuff/archives/physical/floors/shelf/${parentId}`, headers },
    { manual: currentLevel !== "floor" || !parentId }
  );

  const [{ data: binders, loading: bLoading }, refetchBinders] = useAxios<Binder[]>(
    { url: `/api/stuff/archives/physical/binders/floor/${parentId}`, headers },
    { manual: currentLevel !== "binder" || !parentId }
  );

  const [{ data: records, loading: rLoading }, refetchRecords] = useAxios<PhysicalRecord[]>(
    { url: `/api/stuff/archives/physical/records/binder/${parentId}`, headers },
    { manual: currentLevel !== "record" || !parentId }
  );

  const [{ data: documents, loading: dLoading }, refetchDocuments] = useAxios<PhysicalDocument[]>(
    { url: documentsUrl ?? "", headers },
    { manual: !documentsUrl }
  );

  // Refetch la liste courante après une mutation
  useEffect(() => {
    if (dataVersion > 0) {
      const refetchMap: Record<Level, () => void> = {
        container: refetchContainers,
        shelf: refetchShelves,
        floor: refetchFloors,
        binder: refetchBinders,
        record: refetchRecords,
        document: () => { refetchDocuments(); if (isInsideDocument) refetchDocArchives(); },
      };
      refetchMap[currentLevel]?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVersion]);

  // Élément sélectionné pour le panneau de détail
  const [selected, setSelected] = useState<{
    level: Level;
    item: Container | Shelf | Floor | Binder | PhysicalRecord | PhysicalDocument;
  } | null>(null);

  const loading = cLoading || sLoading || fLoading || bLoading || rLoading || dLoading;

  // ── Items courants ──────────────────────────────────────

  // Fetch archives liées au document courant (pour affichage mixte)
  const isInsideDocument = currentLevel === "document" && parentLevel === "document";
  const [{ data: docArchivesData }, refetchDocArchives] = useAxios<{
    document: string; count: number;
    archives: Array<{ _id: string; designation?: string; folder?: string; classNumber?: string; status?: string; validated?: boolean; createdAt?: string }>;
  }>(
    { url: isInsideDocument ? `/api/stuff/archives/physical/documents/${parentId}/archives` : "", headers },
    { manual: !isInsideDocument }
  );

  const items = useMemo<{ id: string; label: string; sub?: string; meta?: string; itemType?: "document" | "archive" }[]>(() => {
    switch (currentLevel) {
      case "container":
        return ((containers as Container[]) ?? []).map((c) => ({
          id: c._id,
          label: c.name,
          sub: c.location,
          meta: c.description,
        }));
      case "shelf":
        return ((shelves as Shelf[]) ?? []).map((s) => ({
          id: s._id,
          label: s.name,
          sub: s.description,
        }));
      case "floor":
        return ((floors as Floor[]) ?? []).map((f) => ({
          id: f._id,
          label: f.label ?? `Étage ${f.number}`,
          sub: `N° ${f.number}`,
        }));
      case "binder":
        return ((binders as Binder[]) ?? []).map((b) => ({
          id: b._id,
          label: b.name,
          sub: `Nature : ${b.nature}`,
          meta: `${b.currentCount ?? 0} / ${b.maxCapacity} dossiers`,
        }));
      case "record":
        return ((records as PhysicalRecord[]) ?? []).map((r) => ({
          id: r._id,
          label: r.internalNumber,
          sub: r.subject,
          meta: r.nature,
        }));
      case "document": {
        // Sous-documents
        const docItems = ((documents as PhysicalDocument[]) ?? []).map((d) => ({
          id: d._id,
          label: d.title,
          sub: d.nature ?? d.description,
          meta: d.documentDate ? new Date(d.documentDate).toLocaleDateString("fr-FR") : undefined,
          itemType: "document" as const,
        }));
        // Archives liées (affichées dans la même liste quand on est dans un document)
        const archiveItems = isInsideDocument
          ? (docArchivesData?.archives ?? []).map((a) => ({
              id: a._id,
              label: a.designation ?? a.folder ?? a._id,
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
  }, [currentLevel, containers, shelves, floors, binders, records, documents, isInsideDocument, docArchivesData]);

  const getItemRaw = useCallback(
    (id: string) => {
      const lists: Record<Level, unknown[]> = {
        container: (containers as Container[]) ?? [],
        shelf: (shelves as Shelf[]) ?? [],
        floor: (floors as Floor[]) ?? [],
        binder: (binders as Binder[]) ?? [],
        record: (records as PhysicalRecord[]) ?? [],
        document: (documents as PhysicalDocument[]) ?? [],
      };
      return (lists[currentLevel] as Array<{ _id: string }>).find((i) => i._id === id);
    },
    [currentLevel, containers, shelves, floors, binders, records, documents]
  );

  const handleSelect = (id: string, label: string, itemType?: string) => {
    // Les archives sont des feuilles — pas de navigation, seulement sélection
    if (itemType === "archive") {
      // On ne navigue pas dans une archive, on la sélectionne seulement
      return;
    }

    const raw = getItemRaw(id);
    if (raw) setSelected({ level: currentLevel, item: raw as Container });

    // Naviguer dans les sous-éléments
    setBreadcrumb((prev) => [...prev, { id, label, level: currentLevel }]);
  };

  const handleBreadcrumb = (index: number) => {
    setBreadcrumb((prev) => prev.slice(0, index));
    setSelected(null);
  };

  const levelConfig: Record<Level, { icon: React.ReactNode; label: string; color: string }> = {
    container: { icon: <WarehouseOutlinedIcon />,          label: "Conteneur", color: "#5C6BC0" },
    shelf:     { icon: <DnsOutlinedIcon />,                label: "Étagère",   color: "#26A69A" },
    floor:     { icon: <ViewStreamOutlinedIcon />,         label: "Niveau",    color: "#42A5F5" },
    binder:    { icon: <StyleOutlinedIcon />,              label: "Classeur",  color: "#FFA726" },
    record:    { icon: <FolderOutlinedIcon />,             label: "Dossier",   color: "#AB47BC" },
    document:  { icon: <TopicOutlinedIcon />,               label: "Document",  color: "#78909C" },
  };

  const showDetail = selected !== null;

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
        <Tooltip title={`Ajouter un(e) ${levelConfig[currentLevel].label.toLowerCase()}`}>
          <IconButton size="small" onClick={() => setFormOpen(true)}>
            <AddRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Contenu principal : explorateur + détail ────────────── */}
      <Box display="flex" flex={1} overflow="hidden">
        {/* ── Panneau gauche : explorateur de fichiers ───────── */}
        <Box
          sx={{
            width: { xs: "100%", md: showDetail ? "45%" : "100%" },
            flexShrink: 0,
            display: isMobile && showDetail ? "none" : "flex",
            flexDirection: "column",
            borderRight: showDetail ? { xs: "none", md: "1px solid" } : "none",
            borderColor: "divider",
            overflow: "hidden",
          }}>

          {/* Titre contextuel — indique le niveau courant */}
          <Box
            px={2}
            py={1}
            display="flex"
            alignItems="center"
            gap={1}
            borderBottom={1}
            borderColor="divider"
            bgcolor="action.hover">
            <Box sx={{ color: levelConfig[currentLevel].color, display: "flex" }}>
              {React.cloneElement(levelConfig[currentLevel].icon as React.ReactElement, { fontSize: "small" })}
            </Box>
            <Typography variant="body2" fontWeight="bold" color={levelConfig[currentLevel].color}>
              {levelConfig[currentLevel].label}s
            </Typography>
            {!loading && (
              <Chip label={items.length} size="small" sx={{ height: 20, fontSize: "0.7rem" }} />
            )}
            <Box flex={1} />
            <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ width: { xs: 70, sm: 100, md: 120 }, textAlign: "right", textTransform: "uppercase", letterSpacing: 0.5, display: { xs: "none", sm: "block" } }}>
              Type
            </Typography>
            <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ width: { sm: 80, md: 100 }, textAlign: "right", textTransform: "uppercase", letterSpacing: 0.5, display: { xs: "none", md: "block" } }}>
              Info
            </Typography>
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
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress size={24} />
              </Box>
            ) : items.length === 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={6} gap={1}>
                {levelConfig[currentLevel].icon}
                <Typography color="text.secondary" variant="body2">
                  Aucun {levelConfig[currentLevel].label.toLowerCase()}
                </Typography>
                <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => setFormOpen(true)}>
                  Créer
                </Button>
              </Box>
            ) : (
              items.map((item) => {
                const isSelected = selected?.item && (selected.item as { _id: string })._id === item.id;
                return (
                  <Box
                    key={item.id}
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
                    onClick={() => handleSelect(item.id, item.label, item.itemType)}>
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
                    {/* Nom + sous-titre */}
                    <Box flex={1} minWidth={0}>
                      <Typography variant="body2" noWrap fontWeight={500}>
                        {item.label}
                      </Typography>
                      {item.sub && (
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {item.sub}
                        </Typography>
                      )}
                    </Box>
                    {/* Type — masqué sur mobile */}
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ width: { xs: 70, sm: 100, md: 120 }, textAlign: "right", flexShrink: 0, display: { xs: "none", sm: "block" } }}>
                      {item.itemType === "archive" ? "Archive" : levelConfig[currentLevel].label}
                    </Typography>
                    {/* Info / méta — masqué sur mobile et tablette */}
                    {item.meta && (
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ width: { sm: 80, md: 100 }, textAlign: "right", flexShrink: 0, display: { xs: "none", md: "block" } }}>
                        {item.meta}
                      </Typography>
                    )}
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

        {/* ── Panneau droit : détail ─────────────────────────── */}
        <Box
          flex={1}
          overflow="auto"
          p={2}
          sx={{
            ...scrollBarSx,
            display: isMobile && !showDetail ? "none" : "flex",
            flexDirection: "column",
          }}>
          {isMobile && showDetail && (
            <Button
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() => setSelected(null)}
              sx={{ mb: 1, alignSelf: "flex-start" }}
              size="small">
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
      </Box>

      {/* Formulaire de création */}
      <PhysicalEntityForm
        open={formOpen}
        level={currentLevel as PhysicalLevel}
        parentId={parentId}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          setFormOpen(false);
          dispatch(incrementVersion());
        }}
      />

      {/* Dialogue de confirmation de suppression */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle component="div" fontWeight="bold">
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Supprimer <strong>"{deleteTarget?.label}"</strong> ? Cette action est irréversible.
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            La suppression sera refusée si cet élément contient encore des enfants.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">Annuler</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

