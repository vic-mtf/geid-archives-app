/**
 * DashboardContent — Tableau de bord principal GEID Archives.
 *
 * Toutes les cartes statistiques et les éléments de liste sont cliquables
 * pour naviguer directement vers la section concernée.
 */

import React, { useCallback, useEffect, useMemo } from "react";
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  LinearProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import StorageRoundedIcon        from "@mui/icons-material/StorageRounded";
import QrCodeRoundedIcon         from "@mui/icons-material/QrCodeRounded";
import ManageHistoryRoundedIcon  from "@mui/icons-material/ManageHistoryRounded";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import CheckCircleOutlineIcon    from "@mui/icons-material/CheckCircleOutline";
import HourglassTopOutlinedIcon  from "@mui/icons-material/HourglassTopOutlined";
import LayersOutlinedIcon        from "@mui/icons-material/LayersOutlined";
import WarningAmberRoundedIcon   from "@mui/icons-material/WarningAmberRounded";
import FolderOpenOutlinedIcon    from "@mui/icons-material/FolderOpenOutlined";
import ArchiveOutlinedIcon       from "@mui/icons-material/ArchiveOutlined";
import ArrowForwardRoundedIcon   from "@mui/icons-material/ArrowForwardRounded";
import AlarmRoundedIcon          from "@mui/icons-material/AlarmRounded";

import PeopleOutlineRoundedIcon from "@mui/icons-material/PeopleOutlineRounded";
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
import type { Archive, PhysicalRecord, Container, Binder } from "@/types";
import { STATUS_LABEL, STATUS_COLOR, normalizeStatus } from "@/constants/lifecycle";

// ── Helpers ──────────────────────────────────────────────────

function computeExpiresAt(start: Date, value: number, unit: string): Date {
  const d = new Date(start);
  if (unit === "days")   d.setDate(d.getDate() + value);
  if (unit === "months") d.setMonth(d.getMonth() + value);
  if (unit === "years")  d.setFullYear(d.getFullYear() + value);
  return d;
}

// ── Composant principal ───────────────────────────────────────

export default function DashboardContent() {
  const Authorization = useToken();
  const headers       = useMemo(() => ({ Authorization: Authorization ?? "" }), [Authorization]);
  const dispatch      = useDispatch<AppDispatch>();
  const dataVersion   = useSelector((store: RootState) => store.data.dataVersion);
  const navigateTo    = useNavigateSetState();
  const theme         = useTheme();

  const { canWrite } = useArchivePermissions();
  useRealtimeRefresh();

  // ── Préférences utilisateur du dashboard ────────────────────
  const { data: prefs } = useApiCache<{
    visibleWidgets: string[];
    chartType: string;
    recentCount: number;
    alertThresholds: { duaDays: number; binderCapacity: number };
    autoRefreshSeconds: number;
    defaultUnit: string;
  }>("/api/stuff/archives/prefs/dashboard", headers);

  // Raccourcis pour les préférences (avec valeurs par défaut)
  const visible  = useMemo(() => new Set(prefs?.visibleWidgets ?? ["stats", "recent", "distribution", "dua", "binders", "inventory", "users", "quickAccess"]), [prefs]);
  const recentMax    = prefs?.recentCount ?? 8;
  const duaThreshold = prefs?.alertThresholds?.duaDays ?? 30;
  const binderThreshold = prefs?.alertThresholds?.binderCapacity ?? 90;

  const goTo = useCallback(
    (tab: string) => navigateTo({ state: { navigation: { tabs: { option: tab } } } }),
    [navigateTo]
  );

  // ── API avec cache (stale-while-revalidate) ─────────────────
  // Premier chargement visible, les suivants instantanés depuis le cache

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
      PENDING: 0, ACTIVE: 0, SEMI_ACTIVE: 0, PERMANENT: 0, DESTROYED: 0,
    };
    fullList.forEach((doc) => {
      const k = normalizeStatus(doc.status as string | undefined, doc.validated as boolean | undefined);
      if (k in c) c[k]++;
    });
    return c;
  }, [fullList]);

  const duaExpired = useMemo(() =>
    archiveList.filter((doc) => {
      if (normalizeStatus(doc.status as string | undefined, doc.validated as boolean | undefined) !== "SEMI_ACTIVE") return false;
      const dua = doc.dua as { value?: number; unit?: string; startDate?: string } | undefined;
      if (!dua?.value || !dua?.unit || !dua?.startDate) return false;
      return Date.now() >= computeExpiresAt(new Date(dua.startDate), dua.value, dua.unit).getTime();
    }),
    [archiveList]
  );

  const duaSoon = useMemo(() => {
    const in30 = Date.now() + duaThreshold * 24 * 60 * 60 * 1000;
    return archiveList.filter((doc) => {
      if (normalizeStatus(doc.status as string | undefined, doc.validated as boolean | undefined) !== "SEMI_ACTIVE") return false;
      const dua = doc.dua as { value?: number; unit?: string; startDate?: string } | undefined;
      if (!dua?.value || !dua?.unit || !dua?.startDate) return false;
      const exp = computeExpiresAt(new Date(dua.startDate), dua.value, dua.unit).getTime();
      return exp > Date.now() && exp <= in30;
    });
  }, [archiveList]);

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


  // ── Données PieChart ────────────────────────────────────────
  const pieData = useMemo(() => [
    { id: 0, value: statusCounts.ACTIVE,      label: "Actives",         color: "#4caf50" },
    { id: 1, value: statusCounts.PENDING,     label: "En attente",      color: "#ff9800" },
    { id: 2, value: statusCounts.SEMI_ACTIVE, label: "Intermédiaires",  color: "#2196f3" },
    { id: 3, value: statusCounts.PERMANENT,   label: "Historiques",     color: "#9c27b0" },
    { id: 4, value: statusCounts.DESTROYED,   label: "Détruites",       color: "#f44336" },
  ].filter((d) => d.value > 0), [statusCounts]);

  // ── Rendu ─────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, overflowY: "auto", height: "100%", width: "100%" }}>

      {/* ── Alertes prioritaires ──────────────────────────── */}
      {(statusCounts.PENDING > 0 || duaExpired.length > 0 || criticalBinders.length > 0) && (
        <Stack spacing={1} mb={2}>
          {statusCounts.PENDING > 0 && (
            <Alert severity="warning" icon={<HourglassTopOutlinedIcon fontSize="inherit" />}
              action={<Chip label="Consulter" size="small" onClick={() => deepNavigate(navigateTo, { tab: "archiveManager", statusFilter: "PENDING" })} icon={<ArrowForwardRoundedIcon fontSize="small" />} clickable />}>
              <strong>{statusCounts.PENDING}</strong> archive{statusCounts.PENDING > 1 ? "s" : ""} en attente de validation.
            </Alert>
          )}
          {duaExpired.length > 0 && (
            <Alert severity="error" icon={<AlarmRoundedIcon fontSize="inherit" />}
              action={<Chip label="Voir" size="small" onClick={() => goTo("archiveManager")} icon={<ArrowForwardRoundedIcon fontSize="small" />} clickable />}>
              <strong>{duaExpired.length}</strong> DUA expirée{duaExpired.length > 1 ? "s" : ""} nécessitent une action.
            </Alert>
          )}
          {criticalBinders.length > 0 && (
            <Alert severity="warning" icon={<WarningAmberRoundedIcon fontSize="inherit" />}
              action={<Chip label="Physique" size="small" onClick={() => goTo("physicalArchive")} icon={<ArrowForwardRoundedIcon fontSize="small" />} clickable />}>
              <strong>{criticalBinders.length}</strong> classeur{criticalBinders.length > 1 ? "s" : ""} à plus de 90% de capacité.
            </Alert>
          )}
        </Stack>
      )}

      {/* ── Rangée 1 : Cartes stats principales ──────────── */}
      {visible.has("stats") && <Grid container spacing={2} mb={2.5}>
        {[
          { label: "Total archives", value: totalCount, icon: <ManageHistoryRoundedIcon />, color: "primary.main", tab: "archiveManager" },
          { label: "En attente", value: statusCounts.PENDING, icon: <HourglassTopOutlinedIcon />, color: "warning.main", tab: "archiveManager", highlight: statusCounts.PENDING > 0 },
          { label: "Actives", value: statusCounts.ACTIVE, icon: <CheckCircleOutlineIcon />, color: "success.main", tab: "archiveManager" },
          { label: "Intermédiaires", value: statusCounts.SEMI_ACTIVE, icon: <ArchiveOutlinedIcon />, color: "info.main", tab: "archiveManager" },
          { label: "Locaux physiques", value: containerList.length, icon: <StorageRoundedIcon />, color: "secondary.main", tab: "physicalArchive" },
          { label: "Dossiers", value: recordList.length, icon: <QrCodeRoundedIcon />, color: "text.primary", tab: "physicalArchive" },
        ].map((s) => (
          <Grid item xs={6} sm={4} md={2} key={s.label}>
            <StatCard
              label={s.label}
              value={s.value}
              loading={anyLoading}
              icon={s.icon}
              color={s.color}
              onClick={() => goTo(s.tab)}
              highlight={s.highlight}
            />
          </Grid>
        ))}
      </Grid>

      }

      {/* ── Rangée 2 : Activité + Répartition PieChart ──── */}
      <Grid container spacing={2} mb={2.5}>

        {/* Activité récente */}
        {visible.has("recent") && <Grid item xs={12} md={visible.has("distribution") ? 7 : 12}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent sx={{ pb: 1, height: "100%", display: "flex", flexDirection: "column" }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="body1" fontWeight="bold">Activité récente</Typography>
                <Chip label="Tout voir" size="small" variant="outlined" onClick={() => goTo("archiveManager")} clickable />
              </Stack>
              <Divider sx={{ mb: 1 }} />
              {anyLoading ? (
                <Stack spacing={0.5}>{[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="rounded" height={40} />)}</Stack>
              ) : recentArchives.length === 0 ? (
                <EmptyPlaceholder label="Aucune archive récente" />
              ) : (
                <List dense disablePadding sx={{ flex: 1, overflow: "auto" }}>
                  {recentArchives.map((doc) => {
                    const norm = normalizeStatus(doc.status as string | undefined, doc.validated as boolean | undefined);
                    return (
                      <ListItemButton key={doc._id} dense sx={{ borderRadius: 1, py: 0.5 }} onClick={() => deepNavigate(navigateTo, { tab: "archiveManager", archiveId: doc._id })}>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <InsertDriveFileOutlinedIcon fontSize="small" sx={{ color: STATUS_COLOR[norm] ? `${STATUS_COLOR[norm]}.main` : "text.disabled" }} />
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
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <Typography variant="body1" fontWeight="bold" mb={1}>Répartition par statut</Typography>
              <Divider sx={{ mb: 1.5 }} />
              {anyLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
                  <Skeleton variant="circular" width={190} height={190} />
                </Box>
              ) : pieData.length === 0 ? (
                <EmptyPlaceholder label="Aucune archive" />
              ) : (
                <Box flex={1} display="flex" flexDirection="column">
                  {/* Chart */}
                  <Box sx={{ height: { xs: 200, md: 240 }, width: "100%", mb: 1.5 }}>
                    <PieChart
                      series={[{
                        data: pieData,
                        innerRadius: 50,
                        outerRadius: 95,
                        paddingAngle: 3,
                        cornerRadius: 5,
                      }]}
                      height={240}
                    />
                  </Box>
                  {/* Légende détaillée */}
                  <Stack spacing={0.75}>
                    {(["PENDING", "ACTIVE", "SEMI_ACTIVE", "PERMANENT", "DESTROYED"] as const).map((key) => {
                      const count = statusCounts[key] ?? 0;
                      const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                      return (
                        <Box key={key} display="flex" alignItems="center" gap={1} sx={{ cursor: "pointer", "&:hover": { bgcolor: "action.hover" }, borderRadius: 0.5, px: 0.5 }}
                          onClick={() => goTo("archiveManager")}>
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
      <Grid container spacing={2}>

        {/* DUA alertes */}
        {(duaExpired.length > 0 || duaSoon.length > 0) && (
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: "100%", borderColor: duaExpired.length > 0 ? "error.main" : "warning.main" }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <AlarmRoundedIcon color={duaExpired.length > 0 ? "error" : "warning"} fontSize="small" />
                  <Typography variant="body2" fontWeight="bold">Alertes DUA</Typography>
                </Stack>
                <Divider sx={{ mb: 1 }} />
                {duaExpired.length > 0 && (
                  <Box mb={1}>
                    <Typography variant="caption" color="error.main" fontWeight="bold" display="block" mb={0.5}>
                      Expirées ({duaExpired.length})
                    </Typography>
                    <List dense disablePadding>
                      {duaExpired.slice(0, 3).map((doc) => (
                        <ListItemButton key={doc._id} dense sx={{ borderRadius: 1, py: 0.25 }} onClick={() => goTo("archiveManager")}>
                          <ListItemText primary={doc.designation ?? "—"} primaryTypographyProps={{ noWrap: true, variant: "caption" }} />
                        </ListItemButton>
                      ))}
                    </List>
                  </Box>
                )}
                {duaSoon.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="warning.main" fontWeight="bold" display="block" mb={0.5}>
                      Bientôt ({duaSoon.length})
                    </Typography>
                    <List dense disablePadding>
                      {duaSoon.slice(0, 3).map((doc) => (
                        <ListItemButton key={doc._id} dense sx={{ borderRadius: 1, py: 0.25 }} onClick={() => goTo("archiveManager")}>
                          <ListItemText primary={doc.designation ?? "—"} primaryTypographyProps={{ noWrap: true, variant: "caption" }} />
                        </ListItemButton>
                      ))}
                    </List>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Capacité des classeurs */}
        {!bindersLoading && binderList.length > 0 && (
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <FolderOpenOutlinedIcon fontSize="small" color="action" />
                  <Typography variant="body2" fontWeight="bold">Classeurs</Typography>
                </Stack>
                <Divider sx={{ mb: 1 }} />
                <Stack spacing={0.75}>
                  {[...binderList]
                    .sort((a, b) => ((b.currentCount ?? 0) / b.maxCapacity) - ((a.currentCount ?? 0) / a.maxCapacity))
                    .slice(0, 5)
                    .map((binder) => {
                      const pct = Math.min(100, Math.round(((binder.currentCount ?? 0) / binder.maxCapacity) * 100));
                      return (
                        <Box key={binder._id}>
                          <Box display="flex" justifyContent="space-between" mb={0.25}>
                            <Tooltip title={binder.name} placement="top">
                              <Typography noWrap sx={{ maxWidth: { xs: 100, sm: 130, md: 160 } }} variant="caption">{binder.name}</Typography>
                            </Tooltip>
                            <Typography variant="caption" color={pct >= 90 ? "error.main" : "text.secondary"}>
                              {binder.currentCount ?? 0}/{binder.maxCapacity}
                            </Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={pct}
                            color={pct >= 90 ? "error" : pct >= 70 ? "warning" : "primary"}
                            sx={{ height: 5, borderRadius: 1 }} />
                        </Box>
                      );
                    })}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Inventaire physique */}
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardActionArea sx={{ height: "100%" }} onClick={() => goTo("physicalArchive")}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <LayersOutlinedIcon fontSize="small" color="action" />
                  <Typography variant="body2" fontWeight="bold">Inventaire physique</Typography>
                </Stack>
                <Divider sx={{ mb: 1 }} />
                {containersLoading || bindersLoading || recordsLoading ? (
                  <Stack spacing={0.75}>{[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="rounded" height={20} />)}</Stack>
                ) : (
                  <Stack spacing={0.75}>
                    {[
                      { label: "Conteneurs", value: containerList.length, color: theme.palette.primary.main },
                      { label: "Classeurs", value: binderList.length, color: theme.palette.warning.main },
                      { label: "Dossiers", value: recordList.length, color: theme.palette.info.main },
                      { label: "Archives liées", value: archiveList.filter(a => (a as Record<string, unknown>).record).length, color: theme.palette.success.main },
                    ].map(({ label, value, color }) => (
                      <Stack key={label} direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color, flexShrink: 0 }} />
                          <Typography variant="caption" color="text.secondary">{label}</Typography>
                        </Stack>
                        <Typography variant="caption" fontWeight="bold">{value}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                )}
                <Box mt={1.5} display="flex" justifyContent="flex-end">
                  <Typography variant="caption" color="primary.main" sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                    Gérer <ArrowForwardRoundedIcon sx={{ fontSize: 12 }} />
                  </Typography>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        {/* Utilisateurs */}
        {canWrite && (
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardActionArea sx={{ height: "100%" }} onClick={() => goTo("userManagement")}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <PeopleOutlineRoundedIcon fontSize="small" color="action" />
                    <Typography variant="body2" fontWeight="bold">Utilisateurs</Typography>
                  </Stack>
                  <Divider sx={{ mb: 1 }} />
                  {statsLoading ? (
                    <Stack spacing={0.75}>{[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={20} />)}</Stack>
                  ) : globalStats ? (
                    <Stack spacing={0.75}>
                      {[
                        { label: "Total", value: globalStats.users.total, color: theme.palette.primary.main },
                        { label: "Actifs", value: globalStats.users.active, color: theme.palette.success.main },
                        { label: "Inactifs", value: globalStats.users.inactive, color: theme.palette.error.main },
                        { label: "Accès archives", value: globalStats.users.withArchiveAccess, color: theme.palette.info.main },
                        { label: "Admins", value: globalStats.users.admins, color: theme.palette.warning.main },
                      ].map(({ label, value, color }) => (
                        <Stack key={label} direction="row" alignItems="center" justifyContent="space-between">
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color, flexShrink: 0 }} />
                            <Typography variant="caption" color="text.secondary">{label}</Typography>
                          </Stack>
                          <Typography variant="caption" fontWeight="bold">{value}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  ) : null}
                  <Box mt={1.5} display="flex" justifyContent="flex-end">
                    <Typography variant="caption" color="primary.main" sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                      Gérer <ArrowForwardRoundedIcon sx={{ fontSize: 12 }} />
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        )}

        {/* Accès rapide — quand il manque des cartes */}
        {!(duaExpired.length > 0 || duaSoon.length > 0) && (
          <Grid item xs={12} sm={6} md={canWrite ? 3 : 6}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="body2" fontWeight="bold" mb={1}>Accès rapide</Typography>
                <Divider sx={{ mb: 1 }} />
                <Stack spacing={0.75}>
                  {[
                    { label: "Archives numériques", desc: "Soumettre, valider, modifier", tab: "archiveManager" },
                    { label: "Archivage physique", desc: "Conteneurs, classeurs, dossiers", tab: "physicalArchive" },
                    { label: "Documentation", desc: "Manuel utilisateur", tab: "help" },
                  ].map(({ label, tab, desc }) => (
                    <Box key={tab} onClick={() => goTo(tab)}
                      sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 1, py: 0.75, borderRadius: 1, cursor: "pointer", "&:hover": { bgcolor: "action.hover" }, border: "1px solid", borderColor: "divider" }}>
                      <Box>
                        <Typography variant="caption" fontWeight={500}>{label}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">{desc}</Typography>
                      </Box>
                      <ArrowForwardRoundedIcon sx={{ fontSize: 14 }} color="action" />
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}

      </Grid>
    </Box>
  );
}
// ── Composants internes ────────────────────────────────────────

interface StatCardProps {
  label:     string;
  value:     number;
  loading:   boolean;
  icon:      React.ReactNode;
  color:     string;
  onClick:   () => void;
  highlight?: boolean;
}

function StatCard({ label, value, loading, icon, color, onClick, highlight }: StatCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: highlight ? "warning.main" : undefined,
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: 3 },
      }}>
      <CardActionArea onClick={onClick}>
        <CardContent sx={{ pb: "12px !important" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.75}>
            <Typography variant="caption" color="text.secondary" noWrap>
              {label}
            </Typography>
            <Box sx={{ color }}>{icon}</Box>
          </Stack>
          {loading ? (
            <CircularProgress size={20} />
          ) : (
            <Typography variant="h5" fontWeight="bold" color={color}>
              {value}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function EmptyPlaceholder({ label }: { label: string }) {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" p={3}>
      <Typography color="text.secondary" variant="body2">{label}</Typography>
    </Box>
  );
}
