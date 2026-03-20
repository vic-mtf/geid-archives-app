import React from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import InventoryRoundedIcon from "@mui/icons-material/InventoryRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import QrCodeRoundedIcon from "@mui/icons-material/QrCodeRounded";
import ManageHistoryRoundedIcon from "@mui/icons-material/ManageHistoryRounded";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import useAxios from "../../../hooks/useAxios";
import useToken from "../../../hooks/useToken";
import { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../redux/store";
import formatDate from "../../../utils/formatTime";
import type { Archive, PhysicalRecord, Container, Binder } from "../../../types";
import { STATUS_LABEL } from "../archive-management-content/ArchiveManagementContent";

// Map normalized status to MUI chip color
const STATUS_COLOR_MAP: Record<string, "default" | "warning" | "success" | "info" | "secondary" | "error"> = {
  PENDING:    "warning",
  ACTIVE:     "success",
  SEMI_ACTIVE:"info",
  PERMANENT:  "secondary",
  DESTROYED:  "error",
};

function resolveStatus(doc: Archive): string {
  if (doc.status) return doc.status as string;
  return (doc as unknown as Record<string, unknown>).validated ? "ACTIVE" : "PENDING";
}

function normalizeKey(status: string): string {
  const map: Record<string, string> = {
    pending: "PENDING", validated: "ACTIVE", archived: "SEMI_ACTIVE",
    disposed: "DESTROYED", actif: "ACTIVE", "intermédiaire": "SEMI_ACTIVE",
    historique: "PERMANENT", détruit: "DESTROYED",
  };
  return map[status] ?? status;
}

export default function DashboardContent() {
  const Authorization = useToken();
  const headers = useMemo(() => ({ Authorization }), [Authorization]);
  const dataVersion = useSelector((store: RootState) => store.data.dataVersion);

  const [{ data: archives, loading: archivesLoading }, refetchArchives] = useAxios<Archive[]>({
    url: "/api/stuff/archives/archived",
    headers,
  });

  const [{ data: containers, loading: containersLoading }, refetchContainers] = useAxios<Container[]>({
    url: "/api/stuff/archives/physical/containers",
    headers,
  });

  const [{ data: binders, loading: bindersLoading }, refetchBinders] = useAxios<Binder[]>({
    url: "/api/stuff/archives/physical/binders",
    headers,
  });

  const [{ data: records, loading: recordsLoading }, refetchRecords] = useAxios<PhysicalRecord[]>({
    url: "/api/stuff/archives/physical/records",
    headers,
  });

  useEffect(() => {
    if (dataVersion > 0) {
      refetchArchives();
      refetchContainers();
      refetchBinders();
      refetchRecords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVersion]);

  const archiveList = useMemo(() => (archives as Archive[]) ?? [], [archives]);
  const containerList = useMemo(() => (containers as Container[]) ?? [], [containers]);
  const binderList = useMemo(() => (binders as Binder[]) ?? [], [binders]);
  const recordList = useMemo(() => (records as PhysicalRecord[]) ?? [], [records]);

  // Per-status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      PENDING: 0, ACTIVE: 0, SEMI_ACTIVE: 0, PERMANENT: 0, DESTROYED: 0,
    };
    archiveList.forEach((doc) => {
      const key = normalizeKey(resolveStatus(doc));
      if (key in counts) counts[key]++;
    });
    return counts;
  }, [archiveList]);

  const recentArchives = useMemo(
    () =>
      [...archiveList]
        .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
        .slice(0, 8),
    [archiveList]
  );

  return (
    <Box sx={{ p: 2, overflowY: "auto", height: "100%" }}>
      {/* Statistiques lifecycle */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Total archives"
            value={archiveList.length}
            loading={archivesLoading}
            icon={<ManageHistoryRoundedIcon />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="En attente"
            value={statusCounts.PENDING}
            loading={archivesLoading}
            icon={<InventoryRoundedIcon />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Conteneurs"
            value={containerList.length}
            loading={containersLoading}
            icon={<StorageRoundedIcon />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Dossiers physiques"
            value={recordList.length}
            loading={recordsLoading}
            icon={<QrCodeRoundedIcon />}
            color="info.main"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Activité récente */}
        <Grid item xs={12} md={7}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body1" fontWeight="bold" mb={1}>
                Activité récente
              </Typography>
              <Divider sx={{ mb: 1 }} />
              {archivesLoading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress size={24} />
                </Box>
              ) : recentArchives.length === 0 ? (
                <EmptyPlaceholder label="Aucune archive trouvée" />
              ) : (
                <List disablePadding dense>
                  {recentArchives.map((doc) => {
                    const rawStatus = resolveStatus(doc);
                    const normKey = normalizeKey(rawStatus);
                    return (
                      <ListItem
                        key={doc._id}
                        disablePadding
                        sx={{ py: 0.5 }}
                        secondaryAction={
                          <Chip
                            size="small"
                            label={STATUS_LABEL[rawStatus] ?? STATUS_LABEL[normKey] ?? rawStatus}
                            color={STATUS_COLOR_MAP[normKey] ?? "default"}
                            variant="outlined"
                          />
                        }>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <InsertDriveFileOutlinedIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={doc.designation ?? doc.title ?? "—"}
                          secondary={formatDate(doc.createdAt as string)}
                          primaryTypographyProps={{ noWrap: true, maxWidth: 280 }}
                          secondaryTypographyProps={{ variant: "caption" }}
                        />
                      </ListItem>
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
              <Divider sx={{ mb: 1 }} />
              {archivesLoading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress size={24} />
                </Box>
              ) : archiveList.length === 0 ? (
                <EmptyPlaceholder label="Aucune archive trouvée" />
              ) : (
                <Stack spacing={1.5}>
                  {(["PENDING", "ACTIVE", "SEMI_ACTIVE", "PERMANENT", "DESTROYED"] as const).map((key) => {
                    const count = statusCounts[key] ?? 0;
                    const pct = archiveList.length > 0
                      ? Math.round((count / archiveList.length) * 100)
                      : 0;
                    const colorMap: Record<string, "warning" | "success" | "info" | "secondary" | "error"> = {
                      PENDING: "warning", ACTIVE: "success", SEMI_ACTIVE: "info",
                      PERMANENT: "secondary", DESTROYED: "error",
                    };
                    return (
                      <Box key={key}>
                        <Box display="flex" justifyContent="space-between" mb={0.3}>
                          <Typography variant="body2">
                            {STATUS_LABEL[key]}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {count} ({pct}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          color={colorMap[key]}
                          sx={{ borderRadius: 1, height: 6 }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              )}

              {/* Classeurs */}
              {!bindersLoading && binderList.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" fontWeight="bold" mb={1}>
                    Capacité des classeurs
                  </Typography>
                  <Stack spacing={1}>
                    {binderList.slice(0, 5).map((binder) => {
                      const pct = binder.maxCapacity
                        ? Math.min(100, Math.round(((binder.currentCount ?? 0) / binder.maxCapacity) * 100))
                        : 0;
                      return (
                        <Box key={binder._id}>
                          <Box display="flex" justifyContent="space-between" mb={0.3}>
                            <Tooltip title={binder.name} placement="top">
                              <Typography noWrap sx={{ maxWidth: 140 }} variant="body2">
                                {binder.name}
                              </Typography>
                            </Tooltip>
                            <Typography color="text.secondary" variant="body2">
                              {binder.currentCount ?? 0} / {binder.maxCapacity}
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
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

// ── Composants internes ────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  loading: boolean;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, loading, icon, color }: StatCardProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography color="text.secondary">{label}</Typography>
          <Box sx={{ color }}>{icon}</Box>
        </Stack>
        {loading ? (
          <CircularProgress size={20} />
        ) : (
          <Typography variant="h4" fontWeight="bold" color={color}>
            {value}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyPlaceholder({ label }: { label: string }) {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" p={3}>
      <Typography color="text.secondary">{label}</Typography>
    </Box>
  );
}
