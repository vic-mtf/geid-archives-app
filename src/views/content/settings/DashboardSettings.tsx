/**
 * DashboardSettings — Paramètres du tableau de bord d'archivage.
 *
 * 1. Cartes de synthèse (max 6) — drag & drop pour réorganiser
 * 2. Sections visibles du tableau de bord
 * 3. Type de graphique pour la répartition
 * 4. Seuils DUA et classeurs
 * 5. Profondeur de l'historique
 * 6. Temps réel
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControlLabel,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import RestoreOutlinedIcon         from "@mui/icons-material/RestoreOutlined";
import SaveOutlinedIcon            from "@mui/icons-material/SaveOutlined";
import DragIndicatorRoundedIcon    from "@mui/icons-material/DragIndicatorRounded";
import ManageHistoryRoundedIcon    from "@mui/icons-material/ManageHistoryRounded";
import HourglassTopOutlinedIcon    from "@mui/icons-material/HourglassTopOutlined";
import CheckCircleOutlineIcon      from "@mui/icons-material/CheckCircleOutline";
import ArchiveRoundedIcon          from "@mui/icons-material/ArchiveRounded";
import MenuBookRoundedIcon         from "@mui/icons-material/MenuBookRounded";
import DeleteOutlineRoundedIcon    from "@mui/icons-material/DeleteOutlineRounded";
import GavelRoundedIcon            from "@mui/icons-material/GavelRounded";
import WarehouseOutlinedIcon       from "@mui/icons-material/WarehouseOutlined";
import FolderOpenOutlinedIcon      from "@mui/icons-material/FolderOpenOutlined";
import TopicOutlinedIcon           from "@mui/icons-material/TopicOutlined";
import AlarmRoundedIcon            from "@mui/icons-material/AlarmRounded";
import PeopleOutlineRoundedIcon    from "@mui/icons-material/PeopleOutlineRounded";
import DonutLargeRoundedIcon       from "@mui/icons-material/DonutLargeRounded";
import PieChartRoundedIcon         from "@mui/icons-material/PieChartRounded";
import BarChartRoundedIcon         from "@mui/icons-material/BarChartRounded";
import ViewListRoundedIcon         from "@mui/icons-material/ViewListRounded";
import useAxios from "@/hooks/useAxios";
import useToken from "@/hooks/useToken";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { setCacheEntry } from "@/redux/data";
import type { ApiCacheEntry } from "@/redux/data";
import scrollBarSx from "@/utils/scrollBarSx";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const PREFS_CACHE_KEY = "/api/stuff/archives/prefs/dashboard";
const MAX_STATS = 6;

// ── Types ────────────────────────────────────────────────────

interface DashboardPrefs {
  visibleWidgets: string[];
  visibleStats: string[];
  chartType: "pie" | "bar" | "donut" | "list";
  recentCount: number;
  alertThresholds: { duaDays: number; binderCapacity: number };
  autoRefreshSeconds: number;
  [key: string]: unknown;
}

interface CardDef { id: string; label: string; icon: React.ReactNode; color: string }

// ── Pool de cartes statistiques (12 options, max 6 actives) ──

const STAT_CARDS: CardDef[] = [
  { id: "totalArchives",        label: "Total archives",             icon: <ManageHistoryRoundedIcon fontSize="small" />,  color: "primary.main" },
  { id: "pending",              label: "En attente de validation",   icon: <HourglassTopOutlinedIcon fontSize="small" />,  color: "warning.main" },
  { id: "active",               label: "Archives actives",           icon: <CheckCircleOutlineIcon fontSize="small" />,    color: "success.main" },
  { id: "semiActive",           label: "Archives intermédiaires",    icon: <ArchiveRoundedIcon fontSize="small" />,        color: "info.main" },
  { id: "permanent",            label: "Archives historiques",       icon: <MenuBookRoundedIcon fontSize="small" />,       color: "#9c27b0" },
  { id: "destroyed",            label: "Archives détruites",         icon: <DeleteOutlineRoundedIcon fontSize="small" />,  color: "error.main" },
  { id: "proposedElimination",  label: "Éliminations proposées",     icon: <GavelRoundedIcon fontSize="small" />,         color: "#c62828" },
  { id: "containers",           label: "Conteneurs physiques",       icon: <WarehouseOutlinedIcon fontSize="small" />,     color: "#5C6BC0" },
  { id: "binders",              label: "Classeurs",                  icon: <FolderOpenOutlinedIcon fontSize="small" />,    color: "#795548" },
  { id: "records",              label: "Dossiers physiques",         icon: <TopicOutlinedIcon fontSize="small" />,         color: "#00897b" },
  { id: "duaExpired",           label: "Conservations dépassées",    icon: <AlarmRoundedIcon fontSize="small" />,          color: "error.main" },
  { id: "users",                label: "Utilisateurs actifs",        icon: <PeopleOutlineRoundedIcon fontSize="small" />,  color: "#546e7a" },
  { id: "eliminationPvs",      label: "Procès-verbaux d'élimination", icon: <GavelRoundedIcon fontSize="small" />,        color: "#c62828" },
];

const STAT_MAP = new Map(STAT_CARDS.map((c) => [c.id, c]));

// ── Sections (widgets) du tableau de bord ────────────────────

const SECTIONS = [
  { id: "alerts",       label: "Alertes prioritaires" },
  { id: "stats",        label: "Cartes de synthèse" },
  { id: "recent",       label: "Activité récente" },
  { id: "distribution", label: "Répartition par statut" },
  { id: "dua",          label: "Durées de conservation" },
  { id: "binders",      label: "Capacité des classeurs" },
  { id: "inventory",    label: "Inventaire physique" },
  { id: "users",        label: "Équipe et accès" },
  { id: "quickAccess",  label: "Raccourcis rapides" },
];

const CHART_TYPES = [
  { value: "donut", label: "Donut",     icon: <DonutLargeRoundedIcon /> },
  { value: "pie",   label: "Camembert", icon: <PieChartRoundedIcon /> },
  { value: "bar",   label: "Barres",    icon: <BarChartRoundedIcon /> },
  { value: "list",  label: "Liste",     icon: <ViewListRoundedIcon /> },
];

const DEFAULT_STATS = ["totalArchives", "pending", "active", "semiActive", "permanent", "containers"];

// ── Composant ────────────────────────────────────────────────

export default function DashboardSettings() {
  const Authorization = useToken();
  const headers = useMemo(() => ({ Authorization: Authorization ?? "" }), [Authorization]);
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();

  const cachedPrefs = useSelector((store: RootState) =>
    ((store.data as unknown as Record<string, unknown>).apiCache as Record<string, ApiCacheEntry> | undefined)?.[PREFS_CACHE_KEY]
  );

  const [prefs, setPrefs] = useState<DashboardPrefs | null>((cachedPrefs?.data as DashboardPrefs) ?? null);
  const initialPrefs = useRef<DashboardPrefs | null>(null);
  const [loading, setLoading] = useState(!cachedPrefs);
  const [saving, setSaving] = useState(false);
  const [saveCount, setSaveCount] = useState(0);

  const hasChanges = useMemo(() => {
    void saveCount;
    if (!prefs || !initialPrefs.current) return false;
    const a = prefs, b = initialPrefs.current;
    if (a.chartType !== b.chartType) return true;
    if (a.recentCount !== b.recentCount) return true;
    if (a.autoRefreshSeconds !== b.autoRefreshSeconds) return true;
    if (a.alertThresholds.duaDays !== b.alertThresholds.duaDays) return true;
    if (a.alertThresholds.binderCapacity !== b.alertThresholds.binderCapacity) return true;
    if (a.visibleWidgets.length !== b.visibleWidgets.length) return true;
    if (a.visibleWidgets.some((w, i) => w !== b.visibleWidgets[i])) return true;
    const as_ = a.visibleStats ?? DEFAULT_STATS;
    const bs_ = b.visibleStats ?? DEFAULT_STATS;
    if (as_.length !== bs_.length) return true;
    if (as_.some((s, i) => s !== bs_[i])) return true;
    return false;
  }, [prefs, saveCount]);

  const [, execute] = useAxios({ headers }, { manual: true });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (cachedPrefs) {
      setPrefs(cachedPrefs.data as DashboardPrefs);
      initialPrefs.current = structuredClone(cachedPrefs.data as DashboardPrefs);
      setLoading(false);
      return;
    }
    execute({ url: PREFS_CACHE_KEY })
      .then((res) => {
        const data = res.data as DashboardPrefs;
        setPrefs(data);
        initialPrefs.current = structuredClone(data);
        dispatch(setCacheEntry({ url: PREFS_CACHE_KEY, data }));
      })
      .catch(() => {}).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synchroniser temps réel vers le dashboard
  useEffect(() => {
    if (prefs) dispatch(setCacheEntry({ url: PREFS_CACHE_KEY, data: prefs }));
  }, [prefs, dispatch]);

  const handleSave = useCallback(async () => {
    if (!prefs) return;
    setSaving(true);
    try {
      await execute({ url: PREFS_CACHE_KEY, method: "PUT", data: prefs });
      dispatch(setCacheEntry({ url: PREFS_CACHE_KEY, data: prefs }));
      initialPrefs.current = structuredClone(prefs);
      setSaveCount((c) => c + 1);
      enqueueSnackbar(t("notifications.settingsSaved"), { variant: "success" });
    } catch { enqueueSnackbar(t("notifications.errorSettingsSaveFailed"), { variant: "error" }); }
    finally { setSaving(false); }
  }, [prefs, execute, dispatch, enqueueSnackbar]);

  const handleReset = useCallback(async () => {
    try {
      const res = await execute({ url: PREFS_CACHE_KEY, method: "DELETE" });
      const fresh = (res.data as { prefs: DashboardPrefs }).prefs;
      setPrefs(fresh);
      initialPrefs.current = structuredClone(fresh);
      setSaveCount((c) => c + 1);
      dispatch(setCacheEntry({ url: PREFS_CACHE_KEY, data: fresh }));
      enqueueSnackbar(t("notifications.settingsReset"), { variant: "info" });
    } catch { enqueueSnackbar(t("notifications.errorSettingsResetFailed"), { variant: "error" }); }
  }, [execute, dispatch, enqueueSnackbar]);

  const update = useCallback(<K extends keyof DashboardPrefs>(key: K, val: DashboardPrefs[K]) => {
    setPrefs((p) => p ? { ...p, [key]: val } : p);
  }, []);

  // ── Stat cards helpers ──────────────────────────────────────
  const statIds = prefs?.visibleStats ?? DEFAULT_STATS;
  const activeStatIds = statIds.filter((id) => STAT_MAP.has(id));
  const inactiveStats = STAT_CARDS.filter((c) => !activeStatIds.includes(c.id));
  const atStatMax = activeStatIds.length >= MAX_STATS;

  const toggleStat = useCallback((id: string) => {
    setPrefs((p) => {
      if (!p) return p;
      const cur = p.visibleStats ?? DEFAULT_STATS;
      if (cur.includes(id)) {
        return { ...p, visibleStats: cur.filter((s) => s !== id) };
      }
      if (cur.length >= MAX_STATS) return p;
      return { ...p, visibleStats: [...cur, id] };
    });
  }, []);

  const handleStatDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setPrefs((p) => {
      if (!p) return p;
      const cur = p.visibleStats ?? DEFAULT_STATS;
      const oldIdx = cur.indexOf(active.id as string);
      const newIdx = cur.indexOf(over.id as string);
      if (oldIdx === -1 || newIdx === -1) return p;
      return { ...p, visibleStats: arrayMove(cur, oldIdx, newIdx) };
    });
  }, []);

  // ── Widget section helpers ──────────────────────────────────
  const toggleWidget = useCallback((id: string) => {
    setPrefs((p) => {
      if (!p) return p;
      const v = p.visibleWidgets.includes(id)
        ? p.visibleWidgets.filter((w) => w !== id)
        : [...p.visibleWidgets, id];
      return { ...p, visibleWidgets: v };
    });
  }, []);

  if (loading) return <Box p={3}><Stack spacing={2}>{[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={50} />)}</Stack></Box>;
  if (!prefs) return null;

  return (
    <Box height="100%" overflow="auto" sx={{ ...scrollBarSx }}>
      {/* Header avec boutons */}
      <Box px={2.5} py={1.5} display="flex" alignItems="center" justifyContent="space-between"
        borderBottom={1} borderColor="divider"
        sx={{ position: "sticky", top: 0, zIndex: 1, bgcolor: "background.paper", backdropFilter: "blur(12px)", opacity: 0.95 }}>
        <Typography variant="body1" fontWeight="bold">{t("nav.dashboard")}</Typography>
        <Box display="flex" gap={1}>
          <Button size="small" variant="outlined" color="inherit" startIcon={<RestoreOutlinedIcon />} onClick={handleReset}>
            {t("settings.reset")}
          </Button>
          <Button size="small" variant="contained" startIcon={<SaveOutlinedIcon />} onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? "…" : t("common.save")}
          </Button>
        </Box>
      </Box>

      <Box p={2.5}>
        <Stack spacing={3}>

          {/* 1. Sections visibles */}
          <Section title="Sections du tableau de bord" desc="Choisissez les blocs d'information affichés sous les cartes.">
            <Box display="flex" flexWrap="wrap" gap={1}>
              {SECTIONS.map((s) => (
                <Chip key={s.id} label={s.label}
                  variant={prefs.visibleWidgets.includes(s.id) ? "filled" : "outlined"}
                  color={prefs.visibleWidgets.includes(s.id) ? "primary" : "default"}
                  onClick={() => toggleWidget(s.id)} sx={{ cursor: "pointer" }} />
              ))}
            </Box>
          </Section>

          {/* 2. Cartes de synthèse — drag & drop + toggle, max 6 */}
          <Section title="Cartes de synthèse" desc="Choisissez les compteurs affichés en haut du tableau de bord et glissez-les pour changer l'ordre.">
            <Chip label={`${activeStatIds.length}/${MAX_STATS}`} size="small" color={atStatMax ? "warning" : "primary"} sx={{ mb: 1.5 }} />

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleStatDragEnd}>
              <SortableContext items={activeStatIds} strategy={verticalListSortingStrategy}>
                {activeStatIds.map((id) => {
                  const c = STAT_MAP.get(id);
                  if (!c) return null;
                  return <SortableCardRow key={id} card={c} onToggle={toggleStat} />;
                })}
              </SortableContext>
            </DndContext>

            {inactiveStats.length > 0 && (
              <>
                <Typography variant="caption" color="text.disabled" mt={1.5} mb={0.5} display="block">
                  Disponibles
                </Typography>
                {inactiveStats.map((c) => (
                  <CardRow key={c.id} card={c} disabled={atStatMax} onToggle={toggleStat} />
                ))}
              </>
            )}
          </Section>

          {/* 3. Type de graphique — icônes MUI */}
          <Section title="Visualisation de la répartition" desc="Type de graphique pour la répartition des archives par statut.">
            <Box display="flex" gap={1.5} flexWrap="wrap">
              {CHART_TYPES.map((c) => {
                const selected = prefs.chartType === c.value;
                return (
                  <Box key={c.value}
                    onClick={() => update("chartType", c.value as DashboardPrefs["chartType"])}
                    sx={{
                      width: 90, height: 80, borderRadius: 2,
                      border: 2, borderColor: selected ? "primary.main" : "divider",
                      bgcolor: selected ? "primary.50" : "transparent",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      gap: 0.5, cursor: "pointer", transition: "all 0.15s",
                      "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
                    }}>
                    <Box sx={{ color: selected ? "primary.main" : "text.secondary", display: "flex" }}>
                      {React.cloneElement(c.icon as React.ReactElement, { sx: { fontSize: 28 } })}
                    </Box>
                    <Typography variant="caption" fontWeight={selected ? 600 : 400} color={selected ? "primary.main" : "text.secondary"}>
                      {c.label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Section>

          {/* 4. Seuil DUA */}
          <Section title="Alerte de conservation" desc="Nombre de jours avant l'expiration d'une durée de conservation pour déclencher une alerte.">
            <TextField size="small" type="number" label="Jours avant échéance" value={prefs.alertThresholds.duaDays}
              onChange={(e) => update("alertThresholds", { ...prefs.alertThresholds, duaDays: parseInt(e.target.value) || 30 })}
              sx={{ maxWidth: 250 }} />
          </Section>

          {/* 5. Seuil classeurs */}
          <Section title="Alerte de capacité" desc="Pourcentage de remplissage des classeurs au-delà duquel une alerte apparaît.">
            <TextField size="small" type="number" label="Seuil d'alerte (%)" value={prefs.alertThresholds.binderCapacity}
              onChange={(e) => update("alertThresholds", { ...prefs.alertThresholds, binderCapacity: parseInt(e.target.value) || 90 })}
              sx={{ maxWidth: 250 }} />
          </Section>

          {/* 6. Profondeur historique */}
          <Section title="Profondeur de l'historique" desc="Nombre d'archives récentes affichées dans la section activité.">
            <Box maxWidth={300}>
              <Slider value={prefs.recentCount} onChange={(_, v) => update("recentCount", v as number)}
                min={3} max={20} step={1} valueLabelDisplay="auto"
                marks={[{ value: 3, label: "3" }, { value: 10, label: "10" }, { value: 20, label: "20" }]} />
            </Box>
          </Section>

          {/* 7. Temps réel */}
          <Section title="Mise à jour en temps réel" desc="Le tableau de bord se rafraîchit automatiquement lors de modifications par d'autres utilisateurs.">
            <FormControlLabel
              control={<Switch checked={prefs.autoRefreshSeconds > 0} onChange={(e) => update("autoRefreshSeconds", e.target.checked ? 1 : 0)} />}
              label={prefs.autoRefreshSeconds > 0 ? "Activé" : "Désactivé"} />
          </Section>

        </Stack>
      </Box>
    </Box>
  );
}

// ── Ligne carte triable (active) ─────────────────────────────

function SortableCardRow({ card, onToggle }: { card: CardDef; onToggle: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  return (
    <Box
      ref={setNodeRef}
      sx={{
        display: "flex", alignItems: "center", gap: 1,
        px: 1, py: 0.75, borderRadius: 1,
        border: "1px solid", borderColor: "primary.main",
        bgcolor: isDragging ? "action.selected" : "background.paper",
        mb: 0.5,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 10 : 0,
      }}
    >
      <Box {...attributes} {...listeners} sx={{ cursor: isDragging ? "grabbing" : "grab", display: "flex", color: "text.disabled" }}>
        <DragIndicatorRoundedIcon fontSize="small" />
      </Box>
      <ListItemIcon sx={{ minWidth: 28, color: card.color }}>{card.icon}</ListItemIcon>
      <ListItemText primary={card.label} primaryTypographyProps={{ variant: "body2", fontWeight: 500 }} sx={{ flex: 1, my: 0 }} />
      <Switch size="small" checked onChange={() => onToggle(card.id)} />
    </Box>
  );
}

// ── Ligne carte inactive ─────────────────────────────────────

function CardRow({ card, disabled, onToggle }: { card: CardDef; disabled: boolean; onToggle: (id: string) => void }) {
  return (
    <Box sx={{
      display: "flex", alignItems: "center", gap: 1,
      px: 1, py: 0.75, borderRadius: 1,
      border: "1px solid", borderColor: "divider",
      bgcolor: "background.paper", mb: 0.5,
      opacity: disabled ? 0.5 : 1,
    }}>
      <Box sx={{ width: 24 }} />
      <ListItemIcon sx={{ minWidth: 28, color: "text.disabled" }}>{card.icon}</ListItemIcon>
      <ListItemText primary={card.label} primaryTypographyProps={{ variant: "body2" }} sx={{ flex: 1, my: 0 }} />
      <Switch size="small" checked={false} disabled={disabled} onChange={() => onToggle(card.id)} />
    </Box>
  );
}

// ── Section réutilisable ─────────────────────────────────────

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="body2" fontWeight="bold" color="primary.main" mb={0.25}>{title}</Typography>
      <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>{desc}</Typography>
      {children}
      <Divider sx={{ mt: 2 }} />
    </Box>
  );
}
