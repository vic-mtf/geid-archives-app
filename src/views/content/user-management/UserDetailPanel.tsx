/**
 * UserDetailPanel — Panneau de détail d'un utilisateur avec actions.
 *
 * 5 fonctionnalités :
 * 1. Journal d'activité (dernières actions)
 * 2. Activer/Désactiver le compte
 * 3. Statistiques par utilisateur (archives, dossiers)
 * 4. Assigner une unité administrative
 * 5. Export CSV de la liste (dans le parent)
 */

import { useCallback, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import EditOutlinedIcon        from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon  from "@mui/icons-material/VisibilityOutlined";
import CreateOutlinedIcon      from "@mui/icons-material/CreateOutlined";
import PersonOutlinedIcon      from "@mui/icons-material/PersonOutlined";
import EmailOutlinedIcon       from "@mui/icons-material/EmailOutlined";
import BadgeOutlinedIcon       from "@mui/icons-material/BadgeOutlined";
import WorkOutlineRoundedIcon  from "@mui/icons-material/WorkOutlineRounded";
import VerifiedOutlinedIcon    from "@mui/icons-material/VerifiedOutlined";
import ArrowBackRoundedIcon    from "@mui/icons-material/ArrowBackRounded";
import AdminPanelSettingsIcon  from "@mui/icons-material/AdminPanelSettings";
import BlockOutlinedIcon       from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import SwapHorizRoundedIcon    from "@mui/icons-material/SwapHorizRounded";
import HistoryRoundedIcon      from "@mui/icons-material/HistoryRounded";
import BarChartRoundedIcon     from "@mui/icons-material/BarChartRounded";
import { PieChart } from "@mui/x-charts/PieChart";
import useAxios from "@/hooks/useAxios";
import scrollBarSx from "@/utils/scrollBarSx";
import { STATUS_LABEL } from "@/constants/lifecycle";
import { useSnackbar } from "notistack";

// ── Types ────────────────────────────────────────────────────

interface UserItem {
  _id: string;
  fname: string;
  lname: string;
  mname?: string;
  email: string;
  phoneCell?: string;
  grade?: { grade?: string; role?: string };
  auth?: {
    _id: string;
    name: string;
    privileges?: Array<{ app: string; permissions: Array<{ struct: string; access: string }> }>;
  };
  imageUrl?: string;
  isValid?: boolean;
  joinedAt?: string;
}

interface RoleItem { _id: string; name: string }

interface UserStats {
  archives: { total: number; pending: number; active: number; semiActive: number };
  physical: { records: number; documents: number };
  lastActivity: { archive?: { updatedAt: string; designation: string }; record?: { createdAt: string; internalNumber: string } };
}

interface ActivityItem {
  type: string;
  action: string;
  target: string;
  targetId: string;
  date: string;
  note?: string;
}

// ── Helpers ──────────────────────────────────────────────────

function avatarUrl(user: UserItem): string | undefined {
  if (!user.imageUrl) return undefined;
  return `${(import.meta.env.VITE_SERVER_BASE_URL as string) ?? ""}/${user.imageUrl}`;
}

function getArchivePerms(user: UserItem) {
  return user.auth?.privileges?.find((p) => p.app === "archives")?.permissions ?? [];
}

function getPermLevel(user: UserItem): "admin" | "write" | "read" | "none" {
  const perms = getArchivePerms(user);
  if (perms.length === 0) return "none";
  if (perms.some((p) => p.struct === "all" && p.access === "write")) return "admin";
  if (perms.some((p) => p.access === "write")) return "write";
  return "read";
}

const PERM_CONFIG = {
  admin: { label: "Administrateur", color: "primary" as const },
  write: { label: "Écriture", color: "success" as const },
  read:  { label: "Lecture seule", color: "info" as const },
  none:  { label: "Aucun droit", color: "default" as const },
};

// ── Props ────────────────────────────────────────────────────

interface Props {
  user: UserItem;
  headers: Record<string, string>;
  isAdmin: boolean;
  isMobile: boolean;
  roles: RoleItem[] | null;
  onBack: () => void;
  onRefresh: () => void;
  onEditPerms: (user: UserItem) => void;
}

// ── Composant ────────────────────────────────────────────────

export default function UserDetailPanel({ user, headers, isAdmin, isMobile, roles, onBack, onRefresh, onEditPerms }: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const level = getPermLevel(user);
  const perms = getArchivePerms(user);

  // ── Stats ──────────────────────────────────────────────────
  const [{ data: stats, loading: statsLoading }] = useAxios<UserStats>(
    { url: `/api/stuff/archives/users/${user._id}/stats`, headers },
  );

  // ── Activité ───────────────────────────────────────────────
  const [{ data: activityData, loading: actLoading }] = useAxios<{ activities: ActivityItem[] }>(
    { url: `/api/stuff/archives/users/${user._id}/activity?limit=10`, headers },
  );

  // ── Toggle actif ───────────────────────────────────────────
  const [, execToggle] = useAxios({ method: "PATCH", headers }, { manual: true });
  const handleToggle = useCallback(async () => {
    try {
      const res = await execToggle({ url: `/api/stuff/archives/users/${user._id}/toggle` });
      enqueueSnackbar(
        (res.data as { message: string }).message,
        { variant: (res.data as { isValid: boolean }).isValid ? "success" : "warning" }
      );
      onRefresh();
    } catch {
      enqueueSnackbar("Erreur lors du changement de statut.", { variant: "error" });
    }
  }, [user._id, execToggle, enqueueSnackbar, onRefresh]);

  // ── Assigner rôle ──────────────────────────────────────────
  const [roleDialog, setRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState(user.grade?.role ?? "");
  const [, execRole] = useAxios({ method: "PUT", headers }, { manual: true });

  const handleAssignRole = useCallback(async () => {
    try {
      await execRole({ url: `/api/stuff/archives/users/${user._id}/role`, data: { role: newRole } });
      enqueueSnackbar(`Rôle assigné : ${newRole}`, { variant: "success" });
      setRoleDialog(false);
      onRefresh();
    } catch {
      enqueueSnackbar("Erreur lors de l'assignation du rôle.", { variant: "error" });
    }
  }, [user._id, newRole, execRole, enqueueSnackbar, onRefresh]);

  // ── Pie chart data ─────────────────────────────────────────
  const pieData = useMemo(() => {
    if (!stats) return [];
    return [
      { id: 0, value: stats.archives.active, label: "Actives", color: "#4caf50" },
      { id: 1, value: stats.archives.pending, label: "En attente", color: "#ff9800" },
      { id: 2, value: stats.archives.semiActive, label: "Intermédiaires", color: "#2196f3" },
    ].filter((d) => d.value > 0);
  }, [stats]);

  return (
    <Box display="flex" flexDirection="column" height="100%" overflow="auto" sx={{ ...scrollBarSx }}>
      {/* Header utilisateur */}
      <Box px={{ xs: 2, sm: 3 }} py={2.5} display="flex" alignItems="center" gap={2} borderBottom={1} borderColor="divider">
        {isMobile && (
          <IconButton onClick={onBack} size="small"><ArrowBackRoundedIcon /></IconButton>
        )}
        <Avatar
          src={avatarUrl(user)}
          sx={{ width: { xs: 52, sm: 68 }, height: { xs: 52, sm: 68 }, fontSize: "1.3rem", fontWeight: 700, bgcolor: "primary.main", border: "3px solid", borderColor: "primary.light" }}>
          {user.fname?.[0]?.toUpperCase()}{user.lname?.[0]?.toUpperCase()}
        </Avatar>
        <Box flex={1} minWidth={0}>
          <Typography fontWeight="bold" noWrap sx={{ fontSize: { xs: "1rem", sm: "1.2rem" } }}>
            {user.fname} {user.mname ?? ""} {user.lname}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>{user.email}</Typography>
          <Box display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
            <Chip label={PERM_CONFIG[level].label} color={PERM_CONFIG[level].color} size="small" sx={{ height: 22, fontSize: "0.7rem" }} />
            <Chip label={user.isValid ? "Actif" : "Inactif"} color={user.isValid ? "success" : "error"} variant="outlined" size="small" sx={{ height: 22, fontSize: "0.7rem" }} />
          </Box>
        </Box>
      </Box>

      {/* Actions rapides — admin uniquement */}
      {isAdmin && (
        <Box px={2} py={1} display="flex" gap={0.75} flexWrap="wrap" borderBottom={1} borderColor="divider">
          <Tooltip title={user.isValid ? "Désactiver le compte" : "Activer le compte"}>
            <IconButton size="small" color={user.isValid ? "warning" : "success"} onClick={handleToggle}
              sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
              {user.isValid ? <BlockOutlinedIcon fontSize="small" /> : <CheckCircleOutlinedIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Modifier les permissions">
            <IconButton size="small" color="primary" onClick={() => onEditPerms(user)}
              sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Changer l'unité administrative">
            <IconButton size="small" onClick={() => { setNewRole(user.grade?.role ?? ""); setRoleDialog(true); }}
              sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
              <SwapHorizRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Statistiques avec chart */}
      <Box px={{ xs: 2, sm: 3 }} py={2}>
        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
          <BarChartRoundedIcon fontSize="small" color="action" />
          <Typography variant="caption" fontWeight="bold" color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
            Statistiques
          </Typography>
        </Box>
        {statsLoading ? (
          <Stack spacing={1}>{[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={28} />)}</Stack>
        ) : stats ? (
          <Box>
            <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
              <StatCard label="Archives" value={stats.archives.total} color="#1565C0" />
              <StatCard label="En attente" value={stats.archives.pending} color="#ff9800" />
              <StatCard label="Dossiers" value={stats.physical.records} color="#AB47BC" />
              <StatCard label="Documents" value={stats.physical.documents} color="#78909C" />
            </Box>
            {pieData.length > 0 && (
              <Box sx={{ height: 160, width: "100%" }}>
                <PieChart
                  series={[{ data: pieData, innerRadius: 30, outerRadius: 60, paddingAngle: 2, cornerRadius: 4 }]}
                  height={160}
                />
              </Box>
            )}
          </Box>
        ) : null}
      </Box>

      <Divider />

      {/* Informations */}
      <Box px={{ xs: 2, sm: 3 }} py={2}>
        <Typography variant="caption" fontWeight="bold" color="text.secondary" textTransform="uppercase" letterSpacing={0.5} display="block" mb={1.5}>
          Informations
        </Typography>
        <Stack spacing={1.5}>
          <DetailField icon={<BadgeOutlinedIcon fontSize="small" />} label="Rôle" value={user.grade?.role ?? "—"} />
          <DetailField icon={<WorkOutlineRoundedIcon fontSize="small" />} label="Grade" value={user.grade?.grade ?? "—"} />
          <DetailField icon={<EmailOutlinedIcon fontSize="small" />} label="Email" value={user.email} />
          {user.phoneCell && <DetailField icon={<PersonOutlinedIcon fontSize="small" />} label="Téléphone" value={user.phoneCell} />}
          <DetailField icon={<VerifiedOutlinedIcon fontSize="small" />} label="Profil auth" value={user.auth?.name ?? "—"} />
        </Stack>
      </Box>

      <Divider />

      {/* Permissions archives */}
      <Box px={{ xs: 2, sm: 3 }} py={2}>
        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
          <AdminPanelSettingsIcon fontSize="small" color="action" />
          <Typography variant="caption" fontWeight="bold" color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
            Permissions
          </Typography>
        </Box>
        {perms.length === 0 ? (
          <Typography variant="body2" color="text.disabled" fontStyle="italic">Aucune permission archives</Typography>
        ) : (
          <Stack spacing={0.75}>
            {perms.map((p, i) => (
              <Box key={i} display="flex" alignItems="center" gap={1.5} px={1.5} py={0.75} borderRadius={1} bgcolor="action.hover">
                {p.access === "write" ? <CreateOutlinedIcon fontSize="small" color="success" /> : <VisibilityOutlinedIcon fontSize="small" color="info" />}
                <Typography variant="body2" flex={1}>{p.struct === "all" ? "Toutes les unités" : p.struct}</Typography>
                <Chip label={p.access === "write" ? "Écriture" : "Lecture"} size="small" color={p.access === "write" ? "success" : "info"} variant="outlined" sx={{ height: 22, fontSize: "0.65rem" }} />
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      <Divider />

      {/* Journal d'activité */}
      <Box px={{ xs: 2, sm: 3 }} py={2}>
        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
          <HistoryRoundedIcon fontSize="small" color="action" />
          <Typography variant="caption" fontWeight="bold" color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
            Activité récente
          </Typography>
        </Box>
        {actLoading ? (
          <Stack spacing={0.75}>{[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={36} />)}</Stack>
        ) : (activityData?.activities ?? []).length === 0 ? (
          <Typography variant="body2" color="text.disabled" fontStyle="italic">Aucune activité enregistrée</Typography>
        ) : (
          <Stack spacing={0.5}>
            {(activityData?.activities ?? []).slice(0, 8).map((a, i) => (
              <Box key={i} display="flex" alignItems="center" gap={1} px={1} py={0.5} borderRadius={1} bgcolor="action.hover">
                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: a.type === "lifecycle" ? "info.main" : "success.main", flexShrink: 0 }} />
                <Typography variant="caption" flex={1} noWrap>
                  {a.type === "lifecycle" ? (STATUS_LABEL[a.action] ?? a.action) : a.action} — {a.target}
                </Typography>
                <Typography variant="caption" color="text.disabled" flexShrink={0}>
                  {new Date(a.date).toLocaleDateString("fr-FR")}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      {/* Dialog assignation rôle */}
      <Dialog open={roleDialog} onClose={() => setRoleDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle component="div" fontWeight="bold">Changer l&apos;unité administrative</DialogTitle>
        <DialogContent>
          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel>Rôle / Unité</InputLabel>
            <Select value={newRole} label="Rôle / Unité" onChange={(e) => setNewRole(e.target.value)}>
              {roles?.map((r) => <MenuItem key={r._id} value={r.name}>{r.name}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialog(false)} color="inherit">Annuler</Button>
          <Button onClick={handleAssignRole} variant="contained" disabled={!newRole}>Assigner</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ── Sous-composants ──────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Box sx={{ px: 1.5, py: 1, borderRadius: 1, bgcolor: "action.hover", minWidth: 80, flex: "1 1 80px" }}>
      <Typography variant="h6" fontWeight="bold" color={color}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Box>
  );
}

function DetailField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Box display="flex" alignItems="center" gap={1.5}>
      <Box sx={{ color: "text.secondary", display: "flex", flexShrink: 0 }}>{icon}</Box>
      <Typography variant="body2" color="text.secondary" sx={{ width: { xs: 80, sm: 100 }, flexShrink: 0 }}>{label}</Typography>
      <Typography variant="body2" fontWeight={500} noWrap flex={1}>{value}</Typography>
    </Box>
  );
}
