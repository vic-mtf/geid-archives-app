/**
 * DashboardContent — Tableau de bord principal GEID Archives.
 *
 * Toutes les cartes statistiques et les éléments de liste sont cliquables
 * pour naviguer directement vers la section concernée.
 */

import React, { useEffect, useMemo } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import WarehouseOutlinedIcon     from "@mui/icons-material/WarehouseOutlined";
import MenuBookOutlinedIcon       from "@mui/icons-material/MenuBookOutlined";
import ManageHistoryOutlinedIcon  from "@mui/icons-material/ManageHistoryOutlined";
import getFileIcon from "@/utils/getFileIcon";
import CheckCircleOutlineIcon    from "@mui/icons-material/CheckCircleOutline";
import HourglassTopOutlinedIcon  from "@mui/icons-material/HourglassTopOutlined";
import WarningAmberOutlinedIcon   from "@mui/icons-material/WarningAmberOutlined";
import ArchiveOutlinedIcon        from "@mui/icons-material/ArchiveOutlined";
import ArrowForwardOutlinedIcon   from "@mui/icons-material/ArrowForwardOutlined";
import AlarmOutlinedIcon          from "@mui/icons-material/AlarmOutlined";
import DeleteOutlineOutlinedIcon  from "@mui/icons-material/DeleteOutlineOutlined";
import GavelOutlinedIcon          from "@mui/icons-material/GavelOutlined";
import FolderOpenOutlinedIcon    from "@mui/icons-material/FolderOpenOutlined";
import TopicOutlinedIcon         from "@mui/icons-material/TopicOutlined";
import PeopleOutlineOutlinedIcon  from "@mui/icons-material/PeopleOutlineOutlined";

import useToken  from "@/hooks/useToken";
import useNavigateSetState from "@/hooks/useNavigateSetState";
import useArchivePermissions from "@/hooks/useArchivePermissions";
import deepNavigate from "@/utils/deepNavigate";
import useRealtimeRefresh from "@/hooks/useRealtimeRefresh";
import useApiCache from "@/hooks/useApiCache";
import { invalidateCache as invalidateCacheAction } from "@/redux/data";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import formatDate from "@/utils/formatTime";
import scrollBarSx from "@/utils/scrollBarSx";
import type { Archive, PhysicalRecord, Container, Binder } from "@/types";
import { STATUS_LABEL, STATUS_COLOR, normalizeStatus } from "@/constants/lifecycle";

import { useTranslation } from "react-i18next";
import StatCard from "./StatCard";
import { EmptyPlaceholder } from "./StatCard";
import DashboardBottomRow from "./DashboardBottomRow";
import {
  resolveDua,
  phaseExpiresAt,
  currentPhase,
} from "@/views/content/archive-management-content/duaDefaults";

// ── Helpers ──────────────────────────────────────────────────

/** Date d'expiration de la DUA de la phase courante (null si pas en phase). */
function currentPhaseExpiresAt(doc: Record<string, unknown>): Date | null {
  const status = doc.status as string | undefined;
  const norm = normalizeStatus(status, doc.validated as boolean | undefined);
  const phase = currentPhase(status, norm);
  if (!phase) return null;
  const dua = resolveDua(doc.dua);
  return phaseExpiresAt(dua[phase]);
}

// ── Composant principal ───────────────────────────────────────

export default function DashboardContent() {
  const Authorization = useToken();
  const headers       = useMemo(() => ({ Authorization: Authorization ?? "" }), [Authorization]);
  const dispatch      = useDispatch<AppDispatch>();
  const dataVersion   = useSelector((store: RootState) => store.data.dataVersion);
  const navigateTo    = useNavigateSetState();
  const { canWrite } = useArchivePermissions();
  const { t } = useTranslation();

  // ── Préférences utilisateur du dashboard ────────────────────
  const { data: prefs } = useApiCache<{
    visibleWidgets: string[];
    visibleStats: string[];
    chartType: string;
    recentCount: number;
    alertThresholds: { duaDays: number; binderCapacity: number };
    autoRefreshSeconds: number;
  }>("/api/stuff/archives/prefs/dashboard", headers);

  // Raccourcis pour les préférences (avec valeurs par défaut)
  const visible  = useMemo(() => new Set(prefs?.visibleWidgets ?? ["alerts", "stats", "recent", "distribution", "dua", "binders", "inventory", "users", "quickAccess"]), [prefs]);
  const recentMax       = prefs?.recentCount ?? 8;
  const duaThreshold    = prefs?.alertThresholds?.duaDays ?? 30;
  const binderThreshold = prefs?.alertThresholds?.binderCapacity ?? 90;
  // Option 6 — mises à jour automatiques
  useRealtimeRefresh();

  // ── API avec cache (stale-while-revalidate) ─────────────────

  const { data: globalStats, loading: statsLoading } = useApiCache<{
    users: { total: number; active: number; inactive: number; withArchiveAccess: number; admins: number; writers: number; readers: number };
    archives: { total: number; pending: number };
    physical: { records: number; documents: number };
  }>("/api/stuff/archives/stats/global", headers);

  const { data: archives, loading: archivesLoading, refetch: refetchArchives } =
    useApiCache<Archive[]>("/api/stuff/archives/archived", headers);

  const { data: containers, loading: containersLoading, refetch: refetchContainers } =
    useApiCache<Container[]>("/api/stuff/archives/physical/containers", headers);

  const { data: binders, loading: bindersLoading, refetch: refetchBinders } =
    useApiCache<Binder[]>("/api/stuff/archives/physical/binders", headers);

  const { data: records, loading: recordsLoading, refetch: refetchRecords } =
    useApiCache<PhysicalRecord[]>("/api/stuff/archives/physical/records", headers);

  // Quand dataVersion change, invalider le cache et refetch en arrière-plan
  useEffect(() => {
    if (dataVersion > 0) {
      dispatch(invalidateCacheAction("/api/stuff/archives"));
      refetchArchives();
      refetchContainers();
      refetchBinders();
      refetchRecords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVersion]);

  // ── Données dérivées ─────────────────────────────────────────
  const archiveList   = useMemo(() => (archives  as Archive[]       ) ?? [], [archives]);
  const containerList = useMemo(() => (containers as Container[]    ) ?? [], [containers]);
  const binderList    = useMemo(() => (binders    as Binder[]       ) ?? [], [binders]);
  const recordList    = useMemo(() => (records    as PhysicalRecord[]) ?? [], [records]);

  const fullList = archiveList;

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {
      PENDING: 0, ACTIVE: 0, SEMI_ACTIVE: 0, PROPOSED_ELIMINATION: 0, PERMANENT: 0, DESTROYED: 0,
    };
    fullList.forEach((doc) => {
      const k = normalizeStatus(doc.status as string | undefined, doc.validated as boolean | undefined);
      if (k in c) c[k]++;
    });
    return c;
  }, [fullList]);

  const duaExpired = useMemo(
    () =>
      archiveList.filter((doc) => {
        const exp = currentPhaseExpiresAt(doc as Record<string, unknown>);
        return exp !== null && Date.now() >= exp.getTime();
      }),
    [archiveList],
  );

  const duaSoon = useMemo(() => {
    const in30 = Date.now() + duaThreshold * 24 * 60 * 60 * 1000;
    return archiveList.filter((doc) => {
      const exp = currentPhaseExpiresAt(doc as Record<string, unknown>);
      if (!exp) return false;
      const t = exp.getTime();
      return t > Date.now() && t <= in30;
    });
  }, [archiveList, duaThreshold]);

  const criticalBinders = useMemo(
    () => binderList.filter((b) => b.maxCapacity && ((b.currentCount ?? 0) / b.maxCapacity) >= binderThreshold / 100),
    [binderList]
  );

  const recentArchives = useMemo(() =>
    [...fullList]
      .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
      .slice(0, recentMax),
    [fullList, recentMax]
  );

  const totalCount  = fullList.length;
  const anyLoading  = archivesLoading;

  // ── Cartes de synthèse dynamiques ─────────────────────────
  const DEFAULT_STATS = ["totalArchives", "pending", "active", "semiActive", "permanent", "containers"];
  const statCardDefs: Record<string, { label: string; value: number; icon: React.ReactNode; color: string; tab: string; statusFilter?: string; highlight?: boolean }> = {
    totalArchives:       { label: t("dashboard.totalArchives"), value: totalCount,                        icon: <ManageHistoryOutlinedIcon />,  color: "primary.main", tab: "archiveManager", statusFilter: "ALL" },
    pending:             { label: t("dashboard.pending"),       value: statusCounts.PENDING,              icon: <HourglassTopOutlinedIcon />,  color: "warning.main", tab: "archiveManager", statusFilter: "PENDING", highlight: statusCounts.PENDING > 0 },
    active:              { label: t("dashboard.active"),        value: statusCounts.ACTIVE,               icon: <CheckCircleOutlineIcon />,    color: "success.main", tab: "archiveManager", statusFilter: "ACTIVE" },
    semiActive:          { label: t("dashboard.semiActive"),    value: statusCounts.SEMI_ACTIVE,          icon: <ArchiveOutlinedIcon />,        color: "info.main",    tab: "archiveManager", statusFilter: "SEMI_ACTIVE" },
    permanent:           { label: t("dashboard.historic"),      value: statusCounts.PERMANENT ?? 0,       icon: <MenuBookOutlinedIcon />,       color: "#9c27b0",      tab: "archiveManager", statusFilter: "PERMANENT" },
    destroyed:           { label: t("status.destroyedFemPlural"), value: statusCounts.DESTROYED ?? 0,     icon: <DeleteOutlineOutlinedIcon />,  color: "error.main",   tab: "archiveManager", statusFilter: "DESTROYED" },
    proposedElimination: { label: t("status.proposedEliminationPlural"), value: statusCounts.PROPOSED_ELIMINATION ?? 0, icon: <GavelOutlinedIcon />, color: "#c62828", tab: "archiveManager", statusFilter: "PROPOSED_ELIMINATION" },
    containers:          { label: t("dashboard.containers"),    value: containerList.length,              icon: <WarehouseOutlinedIcon />,     color: "#5C6BC0",      tab: "physicalArchive" },
    binders:             { label: t("dashboard.binders"),       value: binderList.length,                 icon: <FolderOpenOutlinedIcon />,    color: "#795548",      tab: "physicalArchive" },
    records:             { label: t("dashboard.folders"),       value: recordList.length,                 icon: <TopicOutlinedIcon />,         color: "#00897b",      tab: "physicalArchive" },
    duaExpired:          { label: t("dua.expired"),             value: duaExpired.length,                 icon: <AlarmOutlinedIcon />,          color: "error.main",   tab: "archiveManager", highlight: duaExpired.length > 0 },
    users:               { label: t("dashboard.users"),         value: globalStats?.users?.active ?? 0,   icon: <PeopleOutlineOutlinedIcon />,  color: "#546e7a",      tab: "userManagement" },
    eliminationPvs:      { label: t("elimination.pvList"),      value: 0,                                 icon: <GavelOutlinedIcon />,          color: "#c62828",      tab: "elimination" },
  };

  const activeStats = useMemo(() =>
    (prefs?.visibleStats ?? DEFAULT_STATS).map((id) => statCardDefs[id]).filter(Boolean),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prefs?.visibleStats, statusCounts, totalCount, containerList.length, binderList.length, recordList.length, duaExpired.length, globalStats, t]
  );

  // ── Données PieChart ────────────────────────────────────────
  const pieData = useMemo(() => [
    { id: 0, value: statusCounts.ACTIVE,      label: t("status.activesFemPlural"),   color: "#4caf50" },
    { id: 1, value: statusCounts.PENDING,     label: t("status.pendingPlural"),      color: "#ff9800" },
    { id: 2, value: statusCounts.SEMI_ACTIVE, label: t("status.semiActivePlural"),   color: "#2196f3" },
    { id: 3, value: statusCounts.PROPOSED_ELIMINATION, label: t("status.proposedEliminationPlural"), color: "#c62828" },
    { id: 4, value: statusCounts.PERMANENT,   label: t("status.permanentPlural"),    color: "#9c27b0" },
    { id: 5, value: statusCounts.DESTROYED,   label: t("status.destroyedFemPlural"), color: "#f44336" },
  ].filter((d) => d.value > 0), [statusCounts, t]);

  // ── Rendu ─────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, overflowY: "auto", height: "100%", width: "100%", ...scrollBarSx }}>

      {/* ── Alertes prioritaires ──────────────────────────── */}
      {visible.has("alerts") && (statusCounts.PENDING > 0 || duaExpired.length > 0 || criticalBinders.length > 0) && (
        <Stack spacing={1} mb={2}>
          {statusCounts.PENDING > 0 && (
            <Alert severity="warning" icon={<HourglassTopOutlinedIcon fontSize="inherit" />}
              action={<Chip label={t("common.consult")} size="small" onClick={() => deepNavigate(navigateTo, { tab: "archiveManager", statusFilter: "PENDING" })} icon={<ArrowForwardOutlinedIcon fontSize="small" />} clickable />}>
              <span dangerouslySetInnerHTML={{ __html: t("dashboard.alertPendingValidation", { count: statusCounts.PENDING }) }} />
            </Alert>
          )}
          {duaExpired.length > 0 && (
            <Alert severity="error" icon={<AlarmOutlinedIcon fontSize="inherit" />}
              action={<Chip label={t("common.see")} size="small" onClick={() => deepNavigate(navigateTo, { tab: "archiveManager", quickFilter: "dua_expired" })} icon={<ArrowForwardOutlinedIcon fontSize="small" />} clickable />}>
              <span dangerouslySetInnerHTML={{ __html: t("dashboard.alertDuaExpired", { count: duaExpired.length }) }} />
            </Alert>
          )}
          {criticalBinders.length > 0 && (
            <Alert severity="warning" icon={<WarningAmberOutlinedIcon fontSize="inherit" />}
              action={<Chip label={t("nav.physicalArchive")} size="small" onClick={() => deepNavigate(navigateTo, { tab: "physicalArchive" })} icon={<ArrowForwardOutlinedIcon fontSize="small" />} clickable />}>
              <span dangerouslySetInnerHTML={{ __html: t("dashboard.alertCriticalBinders", { count: criticalBinders.length }) }} />
            </Alert>
          )}
        </Stack>
      )}

      {/* ── Rangée 1 : Cartes stats dynamiques (max 6) ──── */}
      {visible.has("stats") && activeStats.length > 0 && <Grid container spacing={2} mb={2.5}>
        {activeStats.map((s) => (
          <Grid item xs={6} sm={4} md={12 / Math.min(activeStats.length, 6)} key={s.label}>
            <StatCard
              label={s.label}
              value={s.value}
              loading={anyLoading}
              icon={s.icon}
              color={s.color}
              onClick={() => deepNavigate(navigateTo, { tab: s.tab, ...(s.statusFilter ? { statusFilter: s.statusFilter } : {}) })}
              highlight={s.highlight}
            />
          </Grid>
        ))}
      </Grid>
      }

      {/* ── Rangée 2 : Activité + Répartition — même hauteur ── */}
      <Grid container spacing={2} mb={2.5} sx={{ minHeight: { md: 420 } }}>

        {/* Activité récente — scroll si le contenu dépasse */}
        {visible.has("recent") && <Grid item xs={12} md={visible.has("distribution") ? 7 : 12}>
          <Card variant="outlined" sx={{ height: { xs: "auto", md: 420 } }}>
            <CardContent sx={{ pb: 1, height: "100%", display: "flex", flexDirection: "column" }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="body1" fontWeight="bold">{t("dashboard.recentActivity")}</Typography>
                <Chip label={t("common.seeAll")} size="small" variant="outlined" onClick={() => deepNavigate(navigateTo, { tab: "archiveManager" })} clickable />
              </Stack>
              <Divider sx={{ mb: 1 }} />
              {anyLoading ? (
                <Stack spacing={0.5} flex={1}>{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} variant="rounded" height={36} />)}</Stack>
              ) : recentArchives.length === 0 ? (
                <EmptyPlaceholder label={t("dashboard.noRecentArchive")} />
              ) : (
                <List dense disablePadding sx={{ flex: 1, overflow: "auto", ...scrollBarSx }}>
                  {recentArchives.map((doc) => {
                    const norm = normalizeStatus(doc.status as string | undefined, doc.validated as boolean | undefined);
                    const fi = getFileIcon((doc.fileUrl as string) ?? (doc.designation as string));
                    return (
                      <ListItemButton key={doc._id} dense sx={{ borderRadius: 1, py: 0.5 }} onClick={() => deepNavigate(navigateTo, { tab: "archiveManager", archiveId: doc._id })}>
                        <ListItemIcon sx={{ minWidth: 28, color: fi.color }}>
                          {React.cloneElement(fi.icon, { fontSize: "small" })}
                        </ListItemIcon>
                        <ListItemText
                          primary={doc.designation ?? "—"}
                          secondary={formatDate(doc.createdAt as string)}
                          primaryTypographyProps={{ noWrap: true, variant: "body2", sx: { maxWidth: { xs: 140, sm: 200, md: 260 } } }}
                          secondaryTypographyProps={{ variant: "caption" }}
                        />
                        <Chip
                          size="small"
                          label={STATUS_LABEL[norm] ?? norm}
                          color={STATUS_COLOR[norm] ?? "default"}
                          variant="outlined"
                          sx={{ height: 20, fontSize: "0.65rem", flexShrink: 0 }}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
        }

        {/* Répartition par statut — PieChart */}
        {visible.has("distribution") && <Grid item xs={12} md={visible.has("recent") ? 5 : 12}>
          <Card variant="outlined" sx={{ height: { xs: "auto", md: 420 } }}>
            <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <Typography variant="body1" fontWeight="bold" mb={1}>{t("dashboard.distributionByStatus")}</Typography>
              <Divider sx={{ mb: 1.5 }} />
              {anyLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" flex={1} minHeight={260}>
                  <Skeleton variant="circular" width={190} height={190} />
                </Box>
              ) : pieData.length === 0 ? (
                <EmptyPlaceholder label={t("dashboard.noArchive")} />
              ) : (
                <Box flex={1} display="flex" flexDirection="column">
                  {prefs?.chartType !== "list" && <Box sx={{ height: { xs: 200, md: 240 }, width: "100%", mb: 1.5 }}>
                    {(prefs?.chartType === "bar") ? (
                      <BarChart
                        series={[{ data: pieData.map((d) => d.value) }]}
                        xAxis={[{
                          scaleType: "band" as const,
                          data: pieData.map((d) => d.label),
                          colorMap: {
                            type: "ordinal" as const,
                            colors: pieData.map((d) => d.color),
                          },
                          tickLabelStyle: { angle: -35, textAnchor: "end" as const, fontSize: 11 },
                        }]}
                        height={240}
                        margin={{ bottom: 60 }}
                        hideLegend
                      />
                    ) : (
                      <PieChart
                        series={[{
                          data: pieData,
                          innerRadius: prefs?.chartType === "pie" ? 0 : 50,
                          outerRadius: 95,
                          paddingAngle: 3,
                          cornerRadius: 5,
                        }]}
                        height={240}
                      />
                    )}
                  </Box>}
                  <Stack spacing={0.75}>
                    {(["PENDING", "ACTIVE", "SEMI_ACTIVE", "PROPOSED_ELIMINATION", "PERMANENT", "DESTROYED"] as const).map((key) => {
                      const count = statusCounts[key] ?? 0;
                      const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                      return (
                        <Box key={key} display="flex" alignItems="center" gap={1} sx={{ cursor: "pointer", "&:hover": { bgcolor: "action.hover" }, borderRadius: 0.5, px: 0.5 }}
                          onClick={() => deepNavigate(navigateTo, { tab: "archiveManager", statusFilter: key })}>
                          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: `${STATUS_COLOR[key]}.main`, flexShrink: 0 }} />
                          <Typography variant="caption" flex={1}>{STATUS_LABEL[key]}</Typography>
                          <Typography variant="caption" fontWeight="bold">{count}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ width: 35, textAlign: "right" }}>{pct}%</Typography>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        }
      </Grid>

      {/* ── Rangée 3 : DUA + Classeurs + Inventaire + Users ─ */}
      <DashboardBottomRow
        visible={visible}
        duaExpired={duaExpired}
        duaSoon={duaSoon}
        binderList={binderList}
        bindersLoading={bindersLoading}
        containerList={containerList}
        containersLoading={containersLoading}
        recordList={recordList}
        recordsLoading={recordsLoading}
        archiveList={archiveList}
        canWrite={canWrite}
        statsLoading={statsLoading}
        globalStats={globalStats ?? null}
      />
    </Box>
  );
}
