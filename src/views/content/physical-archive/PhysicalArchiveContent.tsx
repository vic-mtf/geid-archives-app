import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import DnsOutlinedIcon from "@mui/icons-material/DnsOutlined";
import ViewStreamOutlinedIcon from "@mui/icons-material/ViewStreamOutlined";
import StyleOutlinedIcon from "@mui/icons-material/StyleOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";

import useAxios from "../../../hooks/useAxios";
import useToken from "../../../hooks/useToken";
import { STATUS_LABEL, STATUS_COLOR, normalizeStatus } from "../archive-management-content/ArchiveManagementContent";
import { useSnackbar } from "notistack";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../../redux/store";
import { incrementVersion } from "../../../redux/data";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import type { Container, Shelf, Floor, Binder, PhysicalRecord, PhysicalDocument } from "../../../types";
import formatDate from "../../../utils/formatTime";
import scrollBarSx from "../../../utils/scrollBarSx";
import PhysicalEntityForm from "../../forms/physical/PhysicalEntityForm";
import type { PhysicalLevel } from "../../forms/physical/PhysicalEntityForm";

// ── Types locaux ───────────────────────────────────────────

type Level = "container" | "shelf" | "floor" | "binder" | "record" | "document";

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
    document:  { icon: <InsertDriveFileOutlinedIcon />,    label: "Document",  color: "#78909C" },
  };

  const showDetail = selected !== null;

  return (
    <Box display="flex" flex={1} overflow="hidden" height="100%" flexDirection="column">
      {/* ── Barre de navigation (fil d'Ariane) ────────────────── */}
      <Box
        px={2}
        py={0.75}
        display="flex"
        alignItems="center"
        gap={0.5}
        flexWrap="wrap"
        borderBottom={1}
        borderColor="divider"
        bgcolor="background.paper"
        minHeight={44}>
        <Typography
          variant="body2"
          sx={{ cursor: "pointer", fontWeight: breadcrumb.length === 0 ? "bold" : "normal", "&:hover": { textDecoration: "underline" } }}
          color={breadcrumb.length === 0 ? "text.primary" : "text.secondary"}
          onClick={() => handleBreadcrumb(0)}>
          Archivage physique
        </Typography>
        {breadcrumb.map((b, i) => (
          <React.Fragment key={b.id}>
            <NavigateNextRoundedIcon fontSize="small" sx={{ color: "text.disabled" }} />
            <Typography
              variant="body2"
              sx={{ cursor: "pointer", fontWeight: i === breadcrumb.length - 1 ? "bold" : "normal", "&:hover": { textDecoration: "underline" } }}
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

          {/* En-tête de la liste — style explorateur */}
          <Box
            px={2}
            py={0.75}
            display="flex"
            alignItems="center"
            gap={1}
            borderBottom={1}
            borderColor="divider"
            bgcolor="action.hover">
            <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ flex: 1, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Nom
            </Typography>
            <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ width: 120, textAlign: "right", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Type
            </Typography>
            <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ width: 100, textAlign: "right", textTransform: "uppercase", letterSpacing: 0.5, display: { xs: "none", sm: "block" } }}>
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
              <FolderOpenOutlinedIcon fontSize="small" sx={{ color: "text.disabled" }} />
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
                    {/* Type */}
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ width: 120, textAlign: "right", flexShrink: 0 }}>
                      {item.itemType === "archive" ? "Archive" : levelConfig[currentLevel].label}
                    </Typography>
                    {/* Info / méta */}
                    {item.meta && (
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ width: 100, textAlign: "right", flexShrink: 0, display: { xs: "none", sm: "block" } }}>
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

// ── Panneau de détail ──────────────────────────────────────

interface DetailPanelProps {
  level: Level;
  item: Container | Shelf | Floor | Binder | PhysicalRecord | PhysicalDocument;
  onDelete: (id: string, label: string) => void;
  headers: Record<string, string>;
}

function DetailPanel({ level, item, onDelete, headers }: DetailPanelProps) {
  const levelLabels: Record<Level, string> = {
    container: "Conteneur",
    shelf: "Étagère",
    floor: "Étage",
    binder: "Classeur",
    record: "Dossier physique",
    document: "Document",
  };

  // Nom lisible de l'élément pour le dialogue de confirmation
  const itemLabel = useMemo(() => {
    const it = item as unknown as Record<string, unknown>;
    return (it.name ?? it.title ?? it.internalNumber ?? it.subject ?? (it.number !== undefined ? `Étage ${it.number}` : null) ?? it._id) as string;
  }, [item]);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" alignItems="center" gap={1} mb={2}>
          <Typography variant="h6" fontWeight="bold" sx={{ flex: 1 }}>
            {levelLabels[level]}
          </Typography>
          <Chip label={levelLabels[level]} size="small" variant="outlined" />
          <Tooltip title="Supprimer cet élément" placement="top">
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(item._id, itemLabel)}>
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
        <Divider sx={{ mb: 2 }} />

        {level === "container" && <ContainerDetail item={item as Container} />}
        {level === "shelf" && <ShelfDetail item={item as Shelf} />}
        {level === "floor" && <FloorDetail item={item as Floor} />}
        {level === "binder" && <BinderDetail item={item as Binder} />}
        {level === "record" && <RecordDetail item={item as PhysicalRecord} headers={headers} />}
        {level === "document" && <DocumentDetail item={item as PhysicalDocument} headers={headers} />}

        <Divider sx={{ mt: 2, mb: 1 }} />
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <DetailRow icon={<CalendarTodayOutlinedIcon fontSize="small" />} label="Créé le" value={(item as { createdAt?: string }).createdAt ? formatDate((item as { createdAt: string }).createdAt) : undefined} />
          </Grid>
          <Grid item xs={6}>
            <DetailRow icon={<CalendarTodayOutlinedIcon fontSize="small" />} label="Modifié le" value={(item as { updatedAt?: string }).updatedAt ? formatDate((item as { updatedAt: string }).updatedAt) : undefined} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

function ContainerDetail({ item }: { item: Container }) {
  return (
    <Stack spacing={1}>
      <DetailRow icon={<WarehouseOutlinedIcon fontSize="small" />} label="Nom" value={item.name} />
      {item.location && (
        <DetailRow icon={<LocationOnOutlinedIcon fontSize="small" />} label="Localisation" value={item.location} />
      )}
      {item.description && (
        <DetailRow icon={<InfoOutlinedIcon fontSize="small" />} label="Description" value={item.description} />
      )}
    </Stack>
  );
}

function ShelfDetail({ item }: { item: Shelf }) {
  return (
    <Stack spacing={1}>
      <DetailRow icon={<DnsOutlinedIcon fontSize="small" />} label="Nom" value={item.name} />
      {item.description && (
        <DetailRow icon={<InfoOutlinedIcon fontSize="small" />} label="Description" value={item.description} />
      )}
    </Stack>
  );
}

function FloorDetail({ item }: { item: Floor }) {
  return (
    <Stack spacing={1}>
      <DetailRow icon={<ViewStreamOutlinedIcon fontSize="small" />} label="Numéro" value={`${item.number}`} />
      {item.label && (
        <DetailRow icon={<InfoOutlinedIcon fontSize="small" />} label="Libellé" value={item.label} />
      )}
      {item.administrativeUnit && typeof item.administrativeUnit === "object" && (
        <DetailRow icon={<CategoryOutlinedIcon fontSize="small" />} label="Unité administrative" value={(item.administrativeUnit as { name?: string }).name ?? "—"} />
      )}
    </Stack>
  );
}

function BinderDetail({ item }: { item: Binder }) {
  const pct = item.maxCapacity
    ? Math.min(100, Math.round(((item.currentCount ?? 0) / item.maxCapacity) * 100))
    : 0;
  return (
    <Stack spacing={1.5}>
      <DetailRow icon={<FolderOpenOutlinedIcon fontSize="small" />} label="Nom" value={item.name} />
      <DetailRow icon={<CategoryOutlinedIcon fontSize="small" />} label="Nature" value={item.nature} />
      <Box>
        <Box display="flex" justifyContent="space-between" mb={0.5}>
          <Typography color="text.secondary">Capacité utilisée</Typography>
          <Typography>{item.currentCount ?? 0} / {item.maxCapacity} dossiers ({pct}%)</Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={pct}
          color={pct >= 90 ? "error" : pct >= 70 ? "warning" : "success"}
          sx={{ borderRadius: 1, height: 8 }}
        />
      </Box>
    </Stack>
  );
}

function RecordDetail({ item, headers }: { item: PhysicalRecord; headers: Record<string, string> }) {
  const [{ data: archivesData, loading: archivesLoading }] = useAxios<{
    count: number;
    archives: Array<{
      _id: string;
      designation?: string;
      description?: string;
      folder?: string;
      classNumber?: string;
      status?: string;
      validated?: boolean;
      createdAt?: string;
    }>;
  }>(
    { url: `/api/stuff/archives/physical/records/${item._id}/archives`, headers },
    { manual: false }
  );

  const linkedArchives = archivesData?.archives ?? [];

  return (
    <Stack spacing={1}>
      <DetailRow icon={<ArticleOutlinedIcon fontSize="small" />} label="N° interne" value={item.internalNumber} />
      <DetailRow icon={<ArticleOutlinedIcon fontSize="small" />} label="N° référence" value={item.refNumber} />
      <DetailRow icon={<CategoryOutlinedIcon fontSize="small" />} label="Objet" value={item.subject} />
      <DetailRow icon={<CategoryOutlinedIcon fontSize="small" />} label="Catégorie" value={item.category} />
      <DetailRow icon={<CategoryOutlinedIcon fontSize="small" />} label="Nature" value={item.nature} />
      <DetailRow icon={<CalendarTodayOutlinedIcon fontSize="small" />} label="Date d'édition" value={formatDate(item.editionDate)} />
      <DetailRow icon={<CalendarTodayOutlinedIcon fontSize="small" />} label="Date d'archivage" value={formatDate(item.archivingDate)} />
      {item.qrCode && (
        <Box display="flex" alignItems="center" gap={1}>
          <QrCode2RoundedIcon fontSize="small" color="action" />
          <Box>
            <Typography color="text.secondary" variant="caption">QR Code</Typography>
            <Typography
              sx={{
                fontFamily: "monospace",
                fontSize: 11,
                bgcolor: "action.hover",
                px: 0.5,
                borderRadius: 0.5,
                wordBreak: "break-all",
              }}>
              {item.qrCode}
            </Typography>
          </Box>
        </Box>
      )}
      {item.agent && (
        <DetailRow
          icon={<InfoOutlinedIcon fontSize="small" />}
          label="Agent"
          value={`${item.agent.firstName ?? ""} ${item.agent.lastName ?? ""}`.trim() || "—"}
        />
      )}
      {item.metadata && Object.keys(item.metadata).length > 0 && (
        <Box>
          <Typography color="text.secondary" variant="caption">Métadonnées</Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>
            {Object.entries(item.metadata).map(([k, v]) => (
              <Tooltip key={k} title={k}>
                <Chip label={`${k}: ${v}`} size="small" variant="outlined" />
              </Tooltip>
            ))}
          </Stack>
        </Box>
      )}

      {/* ── Archives numériques liées ── */}
      <Box mt={1}>
        <Divider sx={{ mb: 1.5 }} />
        <Stack direction="row" alignItems="center" gap={1} mb={1}>
          <ArticleOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
          <Typography variant="subtitle2" fontWeight="bold">
            Archives numériques liées
          </Typography>
          {!archivesLoading && (
            <Chip label={linkedArchives.length} size="small" color={linkedArchives.length > 0 ? "primary" : "default"} />
          )}
        </Stack>
        {archivesLoading ? (
          <Box display="flex" justifyContent="center" py={1.5}>
            <CircularProgress size={20} />
          </Box>
        ) : linkedArchives.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", pl: 0.5 }}>
            Aucune archive numérique n&apos;est rattachée à ce document physique.
            Pour en ajouter une, ouvrez la fiche de l&apos;archive depuis la gestion des archives
            et utilisez l&apos;action &laquo;&nbsp;Dossier physique&nbsp;&raquo;.
          </Typography>
        ) : (
          <Stack spacing={0.75}>
            {linkedArchives.map((arc) => {
              const norm = normalizeStatus(arc.status, arc.validated);
              return (
                <Box
                  key={arc._id}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1,
                    p: 0.75,
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                  }}>
                  <ArticleOutlinedIcon fontSize="small" sx={{ color: "text.disabled", mt: 0.25, flexShrink: 0 }} />
                  <Box flex={1} minWidth={0}>
                    <Typography variant="body2" noWrap fontWeight={500}>
                      {arc.designation ?? arc.folder ?? arc._id}
                    </Typography>
                    {arc.classNumber && (
                      <Typography variant="caption" color="text.secondary" noWrap>
                        N° {arc.classNumber}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    label={STATUS_LABEL[norm] ?? norm}
                    color={STATUS_COLOR[norm] ?? "default"}
                    size="small"
                    variant="outlined"
                    sx={{ flexShrink: 0 }}
                  />
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}

// ── Détail d'un document ────────────────────────────────────

function DocumentDetail({ item, headers }: { item: PhysicalDocument; headers: Record<string, string> }) {
  const [{ data: archivesData, loading: archLoading }] = useAxios<{
    document: string;
    count: number;
    archives: Array<{ _id: string; designation?: string; folder?: string; classNumber?: string; status?: string; validated?: boolean }>;
  }>(
    { url: `/api/stuff/archives/physical/documents/${item._id}/archives`, headers },
  );

  const linkedArchives = archivesData?.archives ?? [];

  return (
    <Stack spacing={1}>
      <DetailRow icon={<DescriptionOutlinedIcon fontSize="small" />} label="Titre" value={item.title} />
      {item.description && (
        <DetailRow icon={<InfoOutlinedIcon fontSize="small" />} label="Description" value={item.description} />
      )}
      {item.nature && (
        <DetailRow icon={<CategoryOutlinedIcon fontSize="small" />} label="Nature" value={item.nature} />
      )}
      {item.documentDate && (
        <DetailRow icon={<CalendarTodayOutlinedIcon fontSize="small" />} label="Date du document" value={new Date(item.documentDate).toLocaleDateString("fr-FR")} />
      )}

      <Divider sx={{ my: 1 }} />
      <Stack direction="row" alignItems="center" gap={1} mb={1}>
        <ArticleOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
        <Typography variant="subtitle2" fontWeight="bold">
          Archives numériques liées
        </Typography>
        {archivesData && (
          <Chip label={archivesData.count} size="small" color="default" />
        )}
      </Stack>

      {archLoading ? (
        <CircularProgress size={20} />
      ) : linkedArchives.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", pl: 0.5 }}>
          Aucune archive numérique rattachée à ce document.
        </Typography>
      ) : (
        <Stack spacing={0.5}>
          {linkedArchives.map((arc) => {
            const norm = normalizeStatus(arc.status, arc.validated);
            return (
              <Box
                key={arc._id}
                sx={{
                  display: "flex", alignItems: "flex-start", gap: 1, p: 0.75,
                  borderRadius: 1, border: "1px solid", borderColor: "divider", bgcolor: "background.paper",
                }}>
                <ArticleOutlinedIcon fontSize="small" sx={{ color: "text.disabled", mt: 0.25, flexShrink: 0 }} />
                <Box flex={1} minWidth={0}>
                  <Typography variant="body2" noWrap fontWeight={500}>
                    {arc.designation ?? arc.folder ?? arc._id}
                  </Typography>
                  {arc.classNumber && (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      N° {arc.classNumber}
                    </Typography>
                  )}
                </Box>
                <Chip
                  label={STATUS_LABEL[norm] ?? norm}
                  color={STATUS_COLOR[norm] ?? "default"}
                  size="small" variant="outlined" sx={{ flexShrink: 0 }}
                />
              </Box>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}

// ── Ligne de détail ─────────────────────────────────────────

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <List disablePadding dense>
      <ListItem disablePadding>
        <ListItemIcon sx={{ minWidth: 28, color: "text.secondary" }}>{icon}</ListItemIcon>
        <ListItemText
          primary={value ?? "—"}
          secondary={label}
          primaryTypographyProps={{ variant: "body2" }}
          secondaryTypographyProps={{ variant: "caption" }}
        />
      </ListItem>
    </List>
  );
}
