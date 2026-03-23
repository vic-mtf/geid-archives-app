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
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
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
import useAxios  from "@/hooks/useAxios";
import useToken  from "@/hooks/useToken";
import useNavigateSetState from "@/hooks/useNavigateSetState";
import useArchivePermissions from "@/hooks/useArchivePermissions";
import { useSelector }   from "react-redux";
import type { RootState } from "@/redux/store";
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
  const headers       = useMemo(() => ({ Authorization }), [Authorization]);
  const dataVersion   = useSelector((store: RootState) => store.data.dataVersion);
  const navigateTo    = useNavigateSetState();
  const theme         = useTheme();

  const { canWrite } = useArchivePermissions();

  const goTo = useCallback(
    (tab: string) => navigateTo({ state: { navigation: { tabs: { option: tab } } } }),
    [navigateTo]
  );

  // ── API ──────────────────────────────────────────────────────

  // Stats globales (utilisateurs + répartition)
  const [{ data: globalStats, loading: statsLoading }] = useAxios<{
    users: { total: number; active: number; inactive: number; withArchiveAccess: number; admins: number; writers: number; readers: number };
    archives: { total: number; pending: number };
    physical: { records: number; documents: number };
  }>({ url: "/api/stuff/archives/stats/global", headers });
  const [{ data: archives, loading: archivesLoading }, refetchArchives] =
    useAxios<Archive[]>({ url: "/api/stuff/archives/archived", headers });

  const [{ data: containers, loading: containersLoading }, refetchContainers] =
    useAxios<Container[]>({ url: "/api/stuff/archives/physical/containers", headers });

  const [{ data: binders, loading: bindersLoading }, refetchBinders] =
    useAxios<Binder[]>({ url: "/api/stuff/archives/physical/binders", headers });

  const [{ data: records, loading: recordsLoading }, refetchRecords] =
    useAxios<PhysicalRecord[]>({ url: "/api/stuff/archives/physical/records", headers });

  useEffect(() => {
    if (dataVersion > 0) {
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
    const in30 = Date.now() + 30 * 24 * 60 * 60 * 1000;
    return archiveList.filter((doc) => {
      if (normalizeStatus(doc.status as string | undefined, doc.validated as boolean | undefined) !== "SEMI_ACTIVE") return false;
      const dua = doc.dua as { value?: number; unit?: string; startDate?: string } | undefined;
      if (!dua?.value || !dua?.unit || !dua?.startDate) return false;
      const exp = computeExpiresAt(new Date(dua.startDate), dua.value, dua.unit).getTime();
      return exp > Date.now() && exp <= in30;
    });
  }, [archiveList]);

  const criticalBinders = useMemo(
    () => binderList.filter((b) => b.maxCapacity && ((b.currentCount ?? 0) / b.maxCapacity) >= 0.9),
    [binderList]
  );

  const recentArchives = useMemo(() =>
    [...fullList]
      .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
      .slice(0, 8),
    [fullList]
  );

  const totalCount  = fullList.length;
  const anyLoading  = archivesLoading;

  // ── Rendu ─────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 1.5, sm: 2 }, overflowY: "auto", height: "100%" }}>

      {/* ── Alertes prioritaires ──────────────────────────── */}
      {(statusCounts.PENDING > 0 || duaExpired.length > 0 || criticalBinders.length > 0) && (
        <Stack spacing={1} mb={2}>
          {statusCounts.PENDING > 0 && (
            <Alert
              severity="warning"
              icon={<HourglassTopOutlinedIcon fontSize="inherit" />}
              action={
                <Chip
                  label="Consulter"
                  size="small"
                  onClick={() => goTo("archiveManager")}
                  icon={<ArrowForwardRoundedIcon fontSize="small" />}
                  clickable
                />
              }>
              <strong>{statusCounts.PENDING}</strong> archive{statusCounts.PENDING > 1 ? "s sont" : " est"} en attente de validation et nécessite{statusCounts.PENDING > 1 ? "nt" : ""} une action.
            </Alert>
          )}
          {duaExpired.length > 0 && (
            <Alert
              severity="error"
              icon={<AlarmRoundedIcon fontSize="inherit" />}
              action={
                <Chip
                  label="Voir"
                  size="small"
                  onClick={() => goTo("archiveManager")}
                  icon={<ArrowForwardRoundedIcon fontSize="small" />}
                  clickable
                />
              }>
              <strong>{duaExpired.length}</strong> DUA expirée{duaExpired.length > 1 ? "s" : ""} — ces archives ont dépassé leur durée d&apos;utilité administrative.
            </Alert>
          )}
          {criticalBinders.length > 0 && (
            <Alert
              severity="warning"
              icon={<WarningAmberRoundedIcon fontSize="inherit" />}
              action={
                <Chip
                  label="Archivage physique"
                  size="small"
                  onClick={() => goTo("physicalArchive")}
                  icon={<ArrowForwardRoundedIcon fontSize="small" />}
                  clickable
                />
              }>
              <strong>{criticalBinders.length}</strong> classeur{criticalBinders.length > 1 ? "s sont" : " est"} à plus de 90 % de sa capacité.
            </Alert>
          )}
        </Stack>
      )}

      {/* ── Cartes statistiques ───────────────────────────── */}
      <Grid container spacing={2} mb={2.5}>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            label="Total archives"
            value={totalCount}
            loading={anyLoading}
            icon={<ManageHistoryRoundedIcon />}
            color="primary.main"
            onClick={() => goTo("archiveManager")}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            label="En attente"
            value={statusCounts.PENDING}
            loading={anyLoading}
            icon={<HourglassTopOutlinedIcon />}
            color="warning.main"
            onClick={() => goTo("archiveManager")}
            highlight={statusCounts.PENDING > 0}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            label="Actives"
            value={statusCounts.ACTIVE}
            loading={anyLoading}
            icon={<CheckCircleOutlineIcon />}
            color="success.main"
            onClick={() => goTo("archiveManager")}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            label="Intermédiaires"
            value={statusCounts.SEMI_ACTIVE}
            loading={anyLoading}
            icon={<ArchiveOutlinedIcon />}
            color="info.main"
            onClick={() => goTo("archiveManager")}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            label="Locaux physiques"
            value={containerList.length}
            loading={containersLoading}
            icon={<StorageRoundedIcon />}
            color="secondary.main"
            onClick={() => goTo("physicalArchive")}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            label="Documents"
            value={recordList.length}
            loading={recordsLoading}
            icon={<QrCodeRoundedIcon />}
            color="text.primary"
            onClick={() => goTo("physicalArchive")}
          />
        </Grid>
      </Grid>

      {/* ── Rangée principale ─────────────────────────────── */}
      <Grid container spacing={2} mb={2}>

        {/* Activité récente */}
        <Grid item xs={12} md={7}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent sx={{ pb: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="body1" fontWeight="bold">
                  Activité récente
                </Typography>
                <Chip
                  label="Tout voir"
                  size="small"
                  onClick={() => goTo("archiveManager")}
                  icon={<ArrowForwardRoundedIcon fontSize="small" />}
                  clickable
                  variant="outlined"
                />
              </Stack>
              <Divider sx={{ mb: 1 }} />
              {anyLoading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress size={24} />
                </Box>
              ) : recentArchives.length === 0 ? (
                <EmptyPlaceholder label="Aucune archive trouvée" />
              ) : (
                <List disablePadding dense>
                  {recentArchives.map((doc) => {
                    const norm = normalizeStatus(doc.status as string | undefined, doc.validated as boolean | undefined);
                    return (
                      <ListItemButton
                        key={doc._id}
                        dense
                        sx={{ borderRadius: 1, py: 0.4 }}
                        onClick={() => goTo("archiveManager")}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                          <InsertDriveFileOutlinedIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={doc.designation ?? (doc as Record<string, unknown>).title as string ?? "—"}
                          secondary={formatDate(doc.createdAt as string)}
                          primaryTypographyProps={{ noWrap: true, variant: "body2", sx: { maxWidth: { xs: 120, sm: 200, md: 260 } } }}
                          secondaryTypographyProps={{ variant: "caption" }}
                        />
                        <Chip
                          size="small"
                          label={STATUS_LABEL[norm] ?? norm}
                          color={STATUS_COLOR[norm] ?? "default"}
                          variant="outlined"
                          sx={{ ml: 1, flexShrink: 0 }}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Répartition par statut */}
        <Grid item xs={12} md={5}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="body1" fontWeight="bold" mb={1}>
                Répartition par statut
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              {anyLoading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress size={24} />
                </Box>
              ) : fullList.length === 0 ? (
                <EmptyPlaceholder label="Aucune archive trouvée" />
              ) : (
                <Stack spacing={1.25}>
                  {(["PENDING", "ACTIVE", "SEMI_ACTIVE", "PERMANENT", "DESTROYED"] as const).map((key) => {
                    const count = statusCounts[key] ?? 0;
                    const pct   = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                    return (
                      <Box
                        key={key}
                        sx={{ cursor: "pointer", "&:hover .bar": { opacity: 0.8 } }}
                        onClick={() => goTo("archiveManager")}>
                        <Box display="flex" justifyContent="space-between" mb={0.25}>
                          <Typography variant="body2">{STATUS_LABEL[key]}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {count} ({pct}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          className="bar"
                          variant="determinate"
                          value={pct}
                          color={(STATUS_COLOR[key] === "default" ? "inherit" : STATUS_COLOR[key]) ?? "inherit"}
                          sx={{ borderRadius: 1, height: 6, transition: "opacity 0.2s" }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Rangée secondaire ─────────────────────────────── */}
      <Grid container spacing={2}>

        {/* DUA bientôt expirées */}
        {(duaExpired.length > 0 || duaSoon.length > 0) && (
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ borderColor: duaExpired.length > 0 ? "error.main" : "warning.main" }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <AlarmRoundedIcon color={duaExpired.length > 0 ? "error" : "warning"} fontSize="small" />
                  <Typography variant="body1" fontWeight="bold">
                    Alertes DUA
                  </Typography>
                </Stack>
                <Divider sx={{ mb: 1 }} />
                {duaExpired.length > 0 && (
                  <Box mb={1}>
                    <Typography variant="caption" color="error.main" fontWeight="bold" display="block" mb={0.5}>
                      Expirées ({duaExpired.length})
                    </Typography>
                    <List dense disablePadding>
                      {duaExpired.slice(0, 3).map((doc) => (
                        <ListItemButton
                          key={doc._id}
                          dense
                          sx={{ borderRadius: 1, py: 0.25 }}
                          onClick={() => goTo("archiveManager")}>
                          <ListItemText
                            primary={doc.designation ?? "—"}
                            primaryTypographyProps={{ noWrap: true, variant: "caption" }}
                          />
                        </ListItemButton>
                      ))}
                      {duaExpired.length > 3 && (
                        <Typography variant="caption" color="text.disabled" pl={1}>
                          +{duaExpired.length - 3} autre{duaExpired.length - 3 > 1 ? "s" : ""}…
                        </Typography>
                      )}
                    </List>
                  </Box>
                )}
                {duaSoon.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="warning.main" fontWeight="bold" display="block" mb={0.5}>
                      Expirent dans 30 jours ({duaSoon.length})
                    </Typography>
                    <List dense disablePadding>
                      {duaSoon.slice(0, 3).map((doc) => (
                        <ListItemButton
                          key={doc._id}
                          dense
                          sx={{ borderRadius: 1, py: 0.25 }}
                          onClick={() => goTo("archiveManager")}>
                          <ListItemText
                            primary={doc.designation ?? "—"}
                            primaryTypographyProps={{ noWrap: true, variant: "caption" }}
                          />
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
          <Grid item xs={12} md={duaExpired.length > 0 || duaSoon.length > 0 ? 4 : 6}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <FolderOpenOutlinedIcon fontSize="small" color="action" />
                    <Typography variant="body1" fontWeight="bold">Capacité des classeurs</Typography>
                  </Stack>
                  <Chip
                    label="Archivage physique"
                    size="small"
                    onClick={() => goTo("physicalArchive")}
                    icon={<ArrowForwardRoundedIcon fontSize="small" />}
                    clickable
                    variant="outlined"
                  />
                </Stack>
                <Divider sx={{ mb: 1.5 }} />
                <Stack spacing={1}>
                  {binderList.slice(0, 5).map((binder) => {
                    const pct = binder.maxCapacity
                      ? Math.min(100, Math.round(((binder.currentCount ?? 0) / binder.maxCapacity) * 100))
                      : 0;
                    return (
                      <Box key={binder._id}>
                        <Box display="flex" justifyContent="space-between" mb={0.25}>
                          <Tooltip title={binder.name} placement="top">
                            <Typography noWrap sx={{ maxWidth: { xs: 100, sm: 130, md: 160 } }} variant="body2">
                              {binder.name}
                            </Typography>
                          </Tooltip>
                          <Typography color="text.secondary" variant="body2">
                            {binder.currentCount ?? 0}&thinsp;/&thinsp;{binder.maxCapacity}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          color={pct >= 90 ? "error" : pct >= 70 ? "warning" : "success"}
                          sx={{ borderRadius: 1, height: 5 }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Synthèse de l'inventaire physique */}
        <Grid item xs={12} md={duaExpired.length > 0 || duaSoon.length > 0 ? 4 : 6}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardActionArea sx={{ height: "100%" }} onClick={() => goTo("physicalArchive")}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <LayersOutlinedIcon fontSize="small" color="action" />
                  <Typography variant="body1" fontWeight="bold">
                    Inventaire physique
                  </Typography>
                </Stack>
                <Divider sx={{ mb: 1.5 }} />
                {containersLoading || bindersLoading || recordsLoading ? (
                  <Box display="flex" justifyContent="center" p={2}>
                    <CircularProgress size={20} />
                  </Box>
                ) : (
                  <Stack spacing={0.75}>
                    {[
                      { label: "Locaux / emplacements", value: containerList.length, color: theme.palette.primary.main },
                      { label: "Classeurs",              value: binderList.length,    color: theme.palette.warning.main },
                      { label: "Documents physiques",    value: recordList.length,    color: theme.palette.info.main },
                      { label: "Archives rattachées",    value: archiveList.filter(a => (a as Record<string,unknown>).record).length, color: theme.palette.success.main },
                    ].map(({ label, value, color }) => (
                      <Stack key={label} direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color, flexShrink: 0 }} />
                          <Typography variant="body2" color="text.secondary">{label}</Typography>
                        </Stack>
                        <Typography variant="body2" fontWeight="bold">{value}</Typography>
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

        {/* Carte utilisateurs — visible si canWrite */}
        {canWrite && (
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardActionArea sx={{ height: "100%" }} onClick={() => goTo("userManagement")}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <PeopleOutlineRoundedIcon fontSize="small" color="action" />
                    <Typography variant="body1" fontWeight="bold">
                      Utilisateurs
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 1.5 }} />
                  {statsLoading ? (
                    <Box display="flex" justifyContent="center" p={2}>
                      <CircularProgress size={20} />
                    </Box>
                  ) : globalStats ? (
                    <Stack spacing={0.75}>
                      {[
                        { label: "Total utilisateurs",    value: globalStats.users.total,             color: theme.palette.primary.main },
                        { label: "Comptes actifs",         value: globalStats.users.active,            color: theme.palette.success.main },
                        { label: "Comptes inactifs",       value: globalStats.users.inactive,          color: theme.palette.error.main },
                        { label: "Accès archives",         value: globalStats.users.withArchiveAccess, color: theme.palette.info.main },
                        { label: "Administrateurs",        value: globalStats.users.admins,            color: theme.palette.warning.main },
                        { label: "Écriture",               value: globalStats.users.writers,           color: theme.palette.success.main },
                        { label: "Lecture seule",          value: globalStats.users.readers,           color: theme.palette.info.main },
                      ].map(({ label, value, color }) => (
                        <Stack key={label} direction="row" alignItems="center" justifyContent="space-between">
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color, flexShrink: 0 }} />
                            <Typography variant="body2" color="text.secondary">{label}</Typography>
                          </Stack>
                          <Typography variant="body2" fontWeight="bold">{value}</Typography>
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
