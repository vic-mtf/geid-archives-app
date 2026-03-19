import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
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
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import ViewAgendaOutlinedIcon from "@mui/icons-material/ViewAgendaOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";

import useAxios from "../../../hooks/useAxios";
import useToken from "../../../hooks/useToken";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../../redux/store";
import { incrementVersion } from "../../../redux/data";
import type { Container, Shelf, Floor, Binder, PhysicalRecord } from "../../../types";
import formatDate from "../../../utils/formatTime";
import scrollBarSx from "../../../utils/scrollBarSx";
import PhysicalEntityForm from "../../forms/physical/PhysicalEntityForm";
import type { PhysicalLevel } from "../../forms/physical/PhysicalEntityForm";

// ── Types locaux ───────────────────────────────────────────

type Level = "container" | "shelf" | "floor" | "binder" | "record";

interface BreadcrumbItem {
  id: string;
  label: string;
  level: Level;
}

// ── Composant principal ────────────────────────────────────

export default function PhysicalArchiveContent() {
  const Authorization = useToken();
  const headers = useMemo(() => ({ Authorization }), [Authorization]);
  const dispatch = useDispatch<AppDispatch>();
  const dataVersion = useSelector((store: RootState) => store.data.dataVersion);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Formulaire de création
  const [formOpen, setFormOpen] = useState(false);

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
        record: "record",
      };
      return next[last.level];
    },
    [breadcrumb]
  );
  const parentId = breadcrumb[breadcrumb.length - 1]?.id;

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

  // Refetch la liste courante après une mutation
  useEffect(() => {
    if (dataVersion > 0) {
      const refetchMap: Record<Level, () => void> = {
        container: refetchContainers,
        shelf: refetchShelves,
        floor: refetchFloors,
        binder: refetchBinders,
        record: refetchRecords,
      };
      refetchMap[currentLevel]?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVersion]);

  // Élément sélectionné pour le panneau de détail
  const [selected, setSelected] = useState<{
    level: Level;
    item: Container | Shelf | Floor | Binder | PhysicalRecord;
  } | null>(null);

  const loading = cLoading || sLoading || fLoading || bLoading || rLoading;

  // ── Items courants ──────────────────────────────────────

  const items = useMemo<{ id: string; label: string; sub?: string; meta?: string }[]>(() => {
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
      default:
        return [];
    }
  }, [currentLevel, containers, shelves, floors, binders, records]);

  const getItemRaw = useCallback(
    (id: string) => {
      const lists: Record<Level, unknown[]> = {
        container: (containers as Container[]) ?? [],
        shelf: (shelves as Shelf[]) ?? [],
        floor: (floors as Floor[]) ?? [],
        binder: (binders as Binder[]) ?? [],
        record: (records as PhysicalRecord[]) ?? [],
      };
      return (lists[currentLevel] as Array<{ _id: string }>).find((i) => i._id === id);
    },
    [currentLevel, containers, shelves, floors, binders, records]
  );

  const handleSelect = (id: string, label: string) => {
    const raw = getItemRaw(id);
    if (raw) setSelected({ level: currentLevel, item: raw as Container });

    // Naviguer seulement si ce n'est pas le dernier niveau
    if (currentLevel !== "record") {
      setBreadcrumb((prev) => [...prev, { id, label, level: currentLevel }]);
    }
  };

  const handleBreadcrumb = (index: number) => {
    setBreadcrumb((prev) => prev.slice(0, index));
    setSelected(null);
  };

  const levelConfig: Record<Level, { icon: React.ReactNode; label: string; color: string }> = {
    container: { icon: <MeetingRoomOutlinedIcon />, label: "Conteneur", color: "primary.main" },
    shelf:     { icon: <LayersOutlinedIcon />,     label: "Étagère",   color: "success.main" },
    floor:     { icon: <ViewAgendaOutlinedIcon />, label: "Étage",     color: "info.main" },
    binder:    { icon: <FolderOpenOutlinedIcon />, label: "Classeur",  color: "warning.main" },
    record:    { icon: <ArticleOutlinedIcon />,    label: "Dossier",   color: "secondary.main" },
  };

  const showDetail = selected !== null;

  return (
    <Box display="flex" flex={1} overflow="hidden" height="100%">
      {/* Panneau gauche : navigation hiérarchique */}
      <Box
        sx={{
          width: { xs: "100%", md: 320 },
          flexShrink: 0,
          display: isMobile && showDetail ? "none" : "flex",
          flexDirection: "column",
          borderRight: { xs: "none", md: "1px solid" },
          borderColor: "divider",
          overflow: "hidden",
        }}>
        {/* Fil d'Ariane */}
        <Box px={1} py={0.5} display="flex" alignItems="center" gap={0.5} flexWrap="wrap" borderBottom={1} borderColor="divider" minHeight={40}>
          <Chip
            label="Racine"
            size="small"
            clickable
            variant={breadcrumb.length === 0 ? "filled" : "outlined"}
            onClick={() => handleBreadcrumb(0)}
          />
          {breadcrumb.map((b, i) => (
            <Box key={b.id} display="flex" alignItems="center" gap={0.5}>
              <ChevronRightRoundedIcon fontSize="small" sx={{ color: "text.disabled" }} />
              <Chip
                label={b.label}
                size="small"
                clickable
                variant={i === breadcrumb.length - 1 ? "filled" : "outlined"}
                onClick={() => handleBreadcrumb(i + 1)}
              />
            </Box>
          ))}
        </Box>

        {/* Niveau courant */}
        <Box px={1.5} py={1} display="flex" alignItems="center" gap={1}>
          <Box sx={{ color: levelConfig[currentLevel].color }}>
            {levelConfig[currentLevel].icon}
          </Box>
          <Typography fontWeight="bold" color={levelConfig[currentLevel].color}>
            {levelConfig[currentLevel].label}s
          </Typography>
          {!loading && (
            <Chip label={items.length} size="small" />
          )}
          <Tooltip title={`Ajouter un(e) ${levelConfig[currentLevel].label.toLowerCase()}`}>
            <IconButton size="small" onClick={() => setFormOpen(true)} sx={{ ml: "auto" }}>
              <AddRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Liste */}
        <Box overflow="auto" flex={1} sx={{ ...scrollBarSx }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress size={24} />
            </Box>
          ) : items.length === 0 ? (
            <Box display="flex" justifyContent="center" p={3}>
              <Typography color="text.secondary" variant="body2">Aucun élément</Typography>
            </Box>
          ) : (
            <List disablePadding dense>
              {items.map((item) => (
                <ListItemButton
                  key={item.id}
                  selected={selected?.item && (selected.item as { _id: string })._id === item.id}
                  onClick={() => handleSelect(item.id, item.label)}
                  sx={{ borderRadius: 1, mx: 0.5, my: 0.25 }}>
                  <ListItemIcon sx={{ minWidth: 32, color: levelConfig[currentLevel].color }}>
                    {currentLevel === "record" ? (
                      <QrCode2RoundedIcon fontSize="small" />
                    ) : (
                      levelConfig[currentLevel].icon
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    secondary={item.sub}
                    primaryTypographyProps={{ noWrap: true }}
                    secondaryTypographyProps={{ noWrap: true, variant: "caption" }}
                  />
                  {item.meta && (
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ ml: 1 }}>
                      {item.meta}
                    </Typography>
                  )}
                  {currentLevel !== "record" && (
                    <ChevronRightRoundedIcon fontSize="small" sx={{ color: "text.disabled", ml: 0.5 }} />
                  )}
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>
      </Box>

      {/* Panneau droit : détail */}
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
            <Chip
              variant="outlined"
              icon={<InfoOutlinedIcon />}
              label="Sélectionnez un élément pour afficher ses détails"
              sx={{ borderRadius: 1 }}
            />
          </Box>
        ) : (
          <DetailPanel level={selected.level} item={selected.item} />
        )}
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
    </Box>
  );
}

// ── Panneau de détail ──────────────────────────────────────

interface DetailPanelProps {
  level: Level;
  item: Container | Shelf | Floor | Binder | PhysicalRecord;
}

function DetailPanel({ level, item }: DetailPanelProps) {
  const levelLabels: Record<Level, string> = {
    container: "Conteneur",
    shelf: "Étagère",
    floor: "Étage",
    binder: "Classeur",
    record: "Dossier physique",
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" alignItems="center" gap={1} mb={2}>
          <Typography variant="h6" fontWeight="bold">
            {levelLabels[level]}
          </Typography>
          <Chip label={level} size="small" variant="outlined" />
        </Stack>
        <Divider sx={{ mb: 2 }} />

        {level === "container" && <ContainerDetail item={item as Container} />}
        {level === "shelf" && <ShelfDetail item={item as Shelf} />}
        {level === "floor" && <FloorDetail item={item as Floor} />}
        {level === "binder" && <BinderDetail item={item as Binder} />}
        {level === "record" && <RecordDetail item={item as PhysicalRecord} />}

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
      <DetailRow icon={<MeetingRoomOutlinedIcon fontSize="small" />} label="Nom" value={item.name} />
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
      <DetailRow icon={<LayersOutlinedIcon fontSize="small" />} label="Nom" value={item.name} />
      {item.description && (
        <DetailRow icon={<InfoOutlinedIcon fontSize="small" />} label="Description" value={item.description} />
      )}
    </Stack>
  );
}

function FloorDetail({ item }: { item: Floor }) {
  return (
    <Stack spacing={1}>
      <DetailRow icon={<ViewAgendaOutlinedIcon fontSize="small" />} label="Numéro" value={`${item.number}`} />
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

function RecordDetail({ item }: { item: PhysicalRecord }) {
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
