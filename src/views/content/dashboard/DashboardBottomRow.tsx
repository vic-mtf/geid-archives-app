/**
 * DashboardBottomRow — Rangée 3 du tableau de bord :
 * Alertes DUA, classeurs, inventaire physique, utilisateurs, accès rapide.
 */

import React from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Divider,
  Grid,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import AlarmRoundedIcon from "@mui/icons-material/AlarmRounded";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import PeopleOutlineRoundedIcon from "@mui/icons-material/PeopleOutlineRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

import { useTranslation } from "react-i18next";
import type { Archive, PhysicalRecord, Container, Binder } from "@/types";
import deepNavigate from "@/utils/deepNavigate";
import useNavigateSetState from "@/hooks/useNavigateSetState";

interface DashboardBottomRowProps {
  visible: Set<string>;
  duaExpired: Archive[];
  duaSoon: Archive[];
  binderList: Binder[];
  bindersLoading: boolean;
  containerList: Container[];
  containersLoading: boolean;
  recordList: PhysicalRecord[];
  recordsLoading: boolean;
  archiveList: Archive[];
  canWrite: boolean;
  statsLoading: boolean;
  globalStats: {
    users: { total: number; active: number; inactive: number; withArchiveAccess: number; admins: number; writers: number; readers: number };
    archives: { total: number; pending: number };
    physical: { records: number; documents: number };
  } | null;
}

const DashboardBottomRow = React.memo(function DashboardBottomRow({
  visible,
  duaExpired,
  duaSoon,
  binderList,
  bindersLoading,
  containerList,
  containersLoading,
  recordList,
  recordsLoading,
  archiveList,
  canWrite,
  statsLoading,
  globalStats,
}: DashboardBottomRowProps) {
  const theme = useTheme();
  const navigateTo = useNavigateSetState();
  const { t } = useTranslation();

  return (
    <Grid container spacing={2}>
      {/* DUA alertes */}
      {visible.has("dua") && (duaExpired.length > 0 || duaSoon.length > 0) && (
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined" sx={{ height: "100%", borderColor: duaExpired.length > 0 ? "error.main" : "warning.main" }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <AlarmRoundedIcon color={duaExpired.length > 0 ? "error" : "warning"} fontSize="small" />
                <Typography variant="body2" fontWeight="bold">{t("dashboard.conservationAlerts")}</Typography>
              </Stack>
              <Divider sx={{ mb: 1 }} />
              {duaExpired.length > 0 && (
                <Box mb={1}>
                  <Typography variant="caption" color="error.main" fontWeight="bold" display="block" mb={0.5}>
                    {t("dashboard.expired", { count: duaExpired.length })}
                  </Typography>
                  <List dense disablePadding>
                    {duaExpired.slice(0, 3).map((doc) => (
                      <ListItemButton key={doc._id} dense sx={{ borderRadius: 1, py: 0.25 }} onClick={() => deepNavigate(navigateTo, { tab: "archiveManager", archiveId: doc._id })}>
                        <ListItemText primary={doc.designation ?? "—"} primaryTypographyProps={{ noWrap: true, variant: "caption" }} />
                      </ListItemButton>
                    ))}
                  </List>
                </Box>
              )}
              {duaSoon.length > 0 && (
                <Box>
                  <Typography variant="caption" color="warning.main" fontWeight="bold" display="block" mb={0.5}>
                    {t("dashboard.soon", { count: duaSoon.length })}
                  </Typography>
                  <List dense disablePadding>
                    {duaSoon.slice(0, 3).map((doc) => (
                      <ListItemButton key={doc._id} dense sx={{ borderRadius: 1, py: 0.25 }} onClick={() => deepNavigate(navigateTo, { tab: "archiveManager", archiveId: doc._id })}>
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
      {visible.has("binders") && !bindersLoading && binderList.length > 0 && (
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <FolderOpenOutlinedIcon fontSize="small" color="action" />
                <Typography variant="body2" fontWeight="bold">{t("dashboard.binders")}</Typography>
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
      {visible.has("inventory") && <Grid item xs={12} sm={6} md={3}>
        <Card variant="outlined" sx={{ height: "100%" }}>
          <CardActionArea sx={{ height: "100%" }} onClick={() => deepNavigate(navigateTo, { tab: "physicalArchive" })}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <LayersOutlinedIcon fontSize="small" color="action" />
                <Typography variant="body2" fontWeight="bold">{t("dashboard.physicalInventory")}</Typography>
              </Stack>
              <Divider sx={{ mb: 1 }} />
              {containersLoading || bindersLoading || recordsLoading ? (
                <Stack spacing={0.75}>{[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="rounded" height={18} />)}</Stack>
              ) : (
                <Stack spacing={0.75}>
                  {[
                    { label: t("dashboard.containers"), value: containerList.length, color: theme.palette.primary.main },
                    { label: t("dashboard.binders"), value: binderList.length, color: theme.palette.warning.main },
                    { label: t("dashboard.folders"), value: recordList.length, color: theme.palette.info.main },
                    { label: t("dashboard.linkedArchives"), value: archiveList.filter(a => (a as Record<string, unknown>).record).length, color: theme.palette.success.main },
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
                  {t("common.manage")} <ArrowForwardRoundedIcon sx={{ fontSize: 12 }} />
                </Typography>
              </Box>
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid>}

      {/* Utilisateurs */}
      {visible.has("users") && canWrite && (
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardActionArea sx={{ height: "100%" }} onClick={() => deepNavigate(navigateTo, { tab: "userManagement" })}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <PeopleOutlineRoundedIcon fontSize="small" color="action" />
                  <Typography variant="body2" fontWeight="bold">{t("dashboard.users")}</Typography>
                </Stack>
                <Divider sx={{ mb: 1 }} />
                {statsLoading ? (
                  <Stack spacing={0.75}>{[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="rounded" height={18} />)}</Stack>
                ) : globalStats ? (
                  <Stack spacing={0.75}>
                    {[
                      { label: t("dashboard.usersTotal"), value: globalStats.users.total, color: theme.palette.primary.main },
                      { label: t("dashboard.usersActive"), value: globalStats.users.active, color: theme.palette.success.main },
                      { label: t("dashboard.usersInactive"), value: globalStats.users.inactive, color: theme.palette.error.main },
                      { label: t("dashboard.usersArchiveAccess"), value: globalStats.users.withArchiveAccess, color: theme.palette.info.main },
                      { label: t("dashboard.usersAdmins"), value: globalStats.users.admins, color: theme.palette.warning.main },
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
                    {t("common.manage")} <ArrowForwardRoundedIcon sx={{ fontSize: 12 }} />
                  </Typography>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      )}

      {/* Accès rapide */}
      {visible.has("quickAccess") && (
        <Grid item xs={12} sm={6} md={canWrite ? 3 : 6}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="body2" fontWeight="bold" mb={1}>{t("dashboard.quickAccess")}</Typography>
              <Divider sx={{ mb: 1 }} />
              <Stack spacing={0.75}>
                {[
                  { label: t("dashboard.digitalArchives"), desc: t("dashboard.digitalArchivesDesc"), tab: "archiveManager" },
                  { label: t("dashboard.physicalArchiving"), desc: t("dashboard.physicalArchivingDesc"), tab: "physicalArchive" },
                  { label: t("dashboard.documentation"), desc: t("dashboard.documentationDesc"), tab: "help" },
                ].map(({ label, tab, desc }) => (
                  <Box key={tab} onClick={() => deepNavigate(navigateTo, { tab })}
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
  );
});

export default DashboardBottomRow;
