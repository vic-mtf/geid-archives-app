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
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import QrCodeRoundedIcon from "@mui/icons-material/QrCodeRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import useAxios from "../../../hooks/useAxios";
import useToken from "../../../hooks/useToken";
import { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../redux/store";
import formatDate from "../../../utils/formatTime";
import type { Archive, PhysicalRecord, Container, Binder } from "../../../types";

export default function DashboardContent() {
  const Authorization = useToken();
  const headers = useMemo(() => ({ Authorization }), [Authorization]);
  const dataVersion = useSelector((store: RootState) => store.data.dataVersion);

  const [{ data: archives, loading: archivesLoading }, refetchArchives] = useAxios<Archive[]>({
    url: "/api/stuff/validate",
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

  // Refetch toutes les stats après une mutation
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

  const recentArchives = useMemo(
    () =>
      [...archiveList]
        .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
        .slice(0, 8),
    [archiveList]
  );

  return (
    <Box sx={{ p: 2, overflowY: "auto", height: "100%" }}>
      {/* Statistiques */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="En attente de validation"
            value={archiveList.length}
            loading={archivesLoading}
            icon={<InventoryRoundedIcon />}
            color="primary.main"
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
            label="Classeurs"
            value={binderList.length}
            loading={bindersLoading}
            icon={<FolderOpenRoundedIcon />}
            color="warning.main"
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
                  {recentArchives.map((doc) => (
                    <ListItem
                      key={doc._id}
                      disablePadding
                      sx={{ py: 0.5 }}
                      secondaryAction={
                        <Chip
                          size="small"
                          icon={
                            doc.validated ? (
                              <CheckCircleOutlineRoundedIcon />
                            ) : (
                              <PendingActionsRoundedIcon />
                            )
                          }
                          label={doc.validated ? "Validé" : "En attente"}
                          color={doc.validated ? "success" : "warning"}
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
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Capacité des classeurs */}
        <Grid item xs={12} md={5}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="body1" fontWeight="bold" mb={1}>
                Capacité des classeurs
              </Typography>
              <Divider sx={{ mb: 1 }} />
              {bindersLoading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress size={24} />
                </Box>
              ) : binderList.length === 0 ? (
                <EmptyPlaceholder label="Aucun classeur trouvé" />
              ) : (
                <Stack spacing={1.5}>
                  {binderList.slice(0, 8).map((binder) => {
                    const pct = binder.maxCapacity
                      ? Math.min(100, Math.round(((binder.currentCount ?? 0) / binder.maxCapacity) * 100))
                      : 0;
                    return (
                      <Box key={binder._id}>
                        <Box display="flex" justifyContent="space-between" mb={0.3}>
                          <Tooltip title={binder.name} placement="top">
                            <Typography noWrap sx={{ maxWidth: 160 }}>
                              {binder.name}
                            </Typography>
                          </Tooltip>
                          <Typography color="text.secondary">
                            {binder.currentCount ?? 0} / {binder.maxCapacity}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          color={pct >= 90 ? "error" : pct >= 70 ? "warning" : "success"}
                          sx={{ borderRadius: 1, height: 6 }}
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
