/**
 * UserManagementContent — Gestion des utilisateurs du module Archives.
 *
 * Liste virtualisée (react-virtuoso) pour les grandes listes.
 * Photos de profil chargées depuis l'API.
 * Présentation homogène avec taille fixe par ligne.
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
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SearchOutlinedIcon       from "@mui/icons-material/SearchOutlined";
import CloseOutlinedIcon        from "@mui/icons-material/CloseOutlined";
import SecurityOutlinedIcon    from "@mui/icons-material/SecurityOutlined";
import PersonOutlinedIcon      from "@mui/icons-material/PersonOutlined";
// Liste avec scroll natif — performant jusqu'à ~1000 utilisateurs

import { useTranslation } from "react-i18next";
import useAxios from "@/hooks/useAxios";
import useToken from "@/hooks/useToken";
import useArchivePermissions from "@/hooks/useArchivePermissions";
import scrollBarSx from "@/utils/scrollBarSx";
import { useSnackbar } from "notistack";
import UserDetailPanel from "./UserDetailPanel";
import avatarColor from "@/utils/avatarColor";

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
    privileges?: Array<{
      app: string;
      permissions: Array<{ struct: string; access: string }>;
    }>;
  };
  imageUrl?: string;
  isValid?: boolean;
  joinedAt?: string;
}

interface RoleItem {
  _id: string;
  name: string;
  parent?: string;
  children?: string[];
}

// ── Helper : URL photo de profil ─────────────────────────────

function avatarUrl(user: UserItem): string | undefined {
  if (!user.imageUrl) return undefined;
  // imageUrl peut être une URL complète ou un chemin relatif
  if (user.imageUrl.startsWith("http")) return user.imageUrl;
  const base = (import.meta.env.VITE_SERVER_BASE_URL as string) ?? "";
  return `${base}/${user.imageUrl}`;
}

// ── Helper : permissions archives ────────────────────────────

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

import i18n from "@/i18n/i18n";
const PERM_CONFIG = {
  admin: { label: () => i18n.t("users.permAdmin"), color: "primary" as const, short: () => i18n.t("users.permAdminShort") },
  write: { label: () => i18n.t("users.permWrite"), color: "success" as const, short: () => i18n.t("users.permWriteShort") },
  read:  { label: () => i18n.t("users.permRead"), color: "info" as const, short: () => i18n.t("users.permReadShort") },
  none:  { label: () => i18n.t("users.permNone"), color: "default" as const, short: () => i18n.t("users.permNoneShort") },
};

// ── Composant principal ──────────────────────────────────────

export default function UserManagementContent() {
  const { t } = useTranslation();
  const Authorization = useToken();
  const headers = useMemo(() => ({ Authorization: Authorization ?? "" }), [Authorization]);
  const { isAdmin } = useArchivePermissions();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { enqueueSnackbar } = useSnackbar();

  // ── Données ────────────────────────────────────────────────
  const [{ data: users, loading: usersLoading }, refetchUsers] = useAxios<UserItem[]>(
    { url: "/api/stuff/archives/users", headers },
  );
  const [{ data: roles }] = useAxios<RoleItem[]>(
    { url: "/api/stuff/archives/roles", headers },
  );

  // ── État local ─────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [permDialog, setPermDialog] = useState(false);
  const [editPerms, setEditPerms] = useState<Array<{ struct: string; access: string }>>([]);

  const [, executePut] = useAxios({ method: "PUT", headers }, { manual: true });

  // ── Liste filtrée ──────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter((u) =>
      `${u.fname} ${u.lname} ${u.email} ${u.grade?.role ?? ""} ${u.grade?.grade ?? ""}`.toLowerCase().includes(q)
    );
  }, [users, search]);

  // ── Handlers permissions ───────────────────────────────────
  const openPermDialog = useCallback((user: UserItem) => {
    setSelectedUser(user);
    setEditPerms([...getArchivePerms(user)]);
    setPermDialog(true);
  }, []);

  const savePermissions = useCallback(async () => {
    if (!selectedUser) return;
    try {
      await executePut({
        url: `/api/stuff/archives/users/${selectedUser._id}/permissions`,
        data: { permissions: editPerms },
      });
      enqueueSnackbar(`Les droits d'accès de ${selectedUser.fname} ${selectedUser.lname} ont été modifiés avec succès. Les changements sont effectifs immédiatement.`, { variant: "success" });
      refetchUsers();
      setPermDialog(false);
    } catch {
      enqueueSnackbar(t("notifications.errorPermissionsFailed"), { variant: "error" });
    }
  }, [selectedUser, editPerms, executePut, enqueueSnackbar, refetchUsers]);

  // ── Rendu ligne utilisateur (pour Virtuoso) ────────────────
  const ROW_HEIGHT = 72;

  const renderUserRow = useCallback((index: number) => {
    const user = filteredUsers[index];
    if (!user) return null;
    const level = getPermLevel(user);
    const cfg = PERM_CONFIG[level];
    const isSelected = selectedUser?._id === user._id;

    return (
      <Box
        onClick={() => setSelectedUser(user)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          height: ROW_HEIGHT,
          cursor: "pointer",
          bgcolor: isSelected ? "action.selected" : "transparent",
          "&:hover": { bgcolor: isSelected ? "action.selected" : "action.hover" },
          borderBottom: "1px solid",
          borderColor: "divider",
        }}>
        {/* Avatar avec photo de profil ou couleur par ID */}
        <Avatar
          src={avatarUrl(user)}
          sx={{
            width: 44,
            height: 44,
            fontSize: "0.95rem",
            fontWeight: 600,
            ...avatarColor(user._id),
          }}>
          {user.fname?.[0]?.toUpperCase()}{user.lname?.[0]?.toUpperCase()}
        </Avatar>

        {/* Infos — nom + rôle sur 2 lignes, taille fixe */}
        <Box flex={1} minWidth={0}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {user.fname} {user.lname}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {user.grade?.role ?? "—"} {user.grade?.grade ? `· ${user.grade.grade}` : ""}
          </Typography>
        </Box>

        {/* Badge permission — taille fixe */}
        <Chip
          label={cfg.short()}
          color={cfg.color}
          size="small"
          variant="outlined"
          sx={{ height: 22, fontSize: "0.65rem", minWidth: 60, flexShrink: 0 }}
        />
      </Box>
    );
  }, [filteredUsers, selectedUser]);

  // ── Rendu ──────────────────────────────────────────────────
  return (
    <Box display="flex" flex={1} height="100%" overflow="hidden">
      {/* ── Liste des utilisateurs ──────────────────────────── */}
      <Box
        sx={{
          width: { xs: "100%", md: selectedUser ? 360 : "100%" },
          flexShrink: 0,
          display: isMobile && selectedUser ? "none" : "flex",
          flexDirection: "column",
          borderRight: selectedUser ? { md: "1px solid" } : "none",
          borderColor: "divider",
          overflow: "hidden",
        }}>

        {/* Header — homogène avec les autres sections */}
        <Box px={2} display="flex" alignItems="center" gap={1} borderBottom={1} borderColor="divider" bgcolor="action.hover" minHeight={42}>
          <SecurityOutlinedIcon fontSize="small" color="action" />
          <Typography variant="caption" fontWeight="bold" color="text.secondary" textTransform="uppercase" letterSpacing={0.5} flex={1}>
            Utilisateurs
          </Typography>
          {!usersLoading && (
            <Chip label={filteredUsers.length} size="small" sx={{ height: 20, fontSize: "0.7rem" }} />
          )}
          {usersLoading && <Skeleton variant="rounded" width={28} height={20} />}
        </Box>

        {/* Recherche */}
        <Box px={1} py={0.75} borderBottom={1} borderColor="divider">
          <TextField
            size="small"
            fullWidth
            placeholder="Rechercher par nom, email, rôle…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch("")}>
                    <CloseOutlinedIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
              sx: { fontSize: "0.85rem" },
            }}
          />
        </Box>

        {/* Liste virtualisée */}
        <Box flex={1} overflow="hidden">
          {usersLoading ? (
            <Stack spacing={0}>
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Box key={i} display="flex" alignItems="center" gap={1.5} px={2} height={ROW_HEIGHT} borderBottom="1px solid" borderColor="divider">
                  <Skeleton variant="circular" width={44} height={44} />
                  <Box flex={1}>
                    <Skeleton variant="text" width="55%" height={18} />
                    <Skeleton variant="text" width="35%" height={14} />
                  </Box>
                  <Skeleton variant="rounded" width={60} height={22} />
                </Box>
              ))}
            </Stack>
          ) : filteredUsers.length === 0 ? (
            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" py={6} gap={1}>
              <PersonOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
              <Typography color="text.secondary" variant="body2">{t("users.noUserFound")}</Typography>
            </Box>
          ) : (
            <Box sx={{ height: "100%", overflow: "auto", ...scrollBarSx }}>
              {filteredUsers.map((_, i) => renderUserRow(i))}
            </Box>
          )}
        </Box>
      </Box>

      {/* ── Panneau détail utilisateur (composant séparé) ───── */}
      <Box
        flex={1}
        overflow="hidden"
        sx={{
          display: !selectedUser && !isMobile ? "flex" : selectedUser ? "flex" : "none",
          flexDirection: "column",
        }}>
        {!selectedUser ? (
          <Box display="flex" flex={1} justifyContent="center" alignItems="center">
            <Stack alignItems="center" gap={1}>
              <PersonOutlinedIcon sx={{ fontSize: 48, color: "text.disabled" }} />
              <Typography color="text.secondary" variant="body2">{t("users.selectUser")}</Typography>
            </Stack>
          </Box>
        ) : (
          <UserDetailPanel
            user={selectedUser}
            headers={headers}
            isAdmin={isAdmin}
            isMobile={isMobile}
            roles={roles ?? null}
            onBack={() => setSelectedUser(null)}
            onRefresh={() => { refetchUsers(); }}
            onEditPerms={openPermDialog}
          />
        )}
      </Box>

      {/* ── Dialog modification permissions ─────────────────── */}
      <Dialog open={permDialog} onClose={() => setPermDialog(false)} maxWidth="sm" fullWidth fullScreen={isMobile} BackdropProps={{ sx: { bgcolor: (theme: any) => theme.palette.background.paper + theme.customOptions.opacity, backdropFilter: (theme: any) => `blur(${theme.customOptions.blur})` } }} PaperProps={{ sx: { border: 1, borderColor: "divider" } }}>
        <DialogTitle component="div">
          <Typography fontWeight="bold">
            {t("users.permissionsTitle", { name: `${selectedUser?.fname} ${selectedUser?.lname}` })}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} mt={1}>
            {editPerms.map((perm, i) => (
              <Box key={i} display="flex" gap={1} alignItems="center">
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>{t("users.unit")}</InputLabel>
                  <Select value={perm.struct} label={t("users.unit")} onChange={(e) => setEditPerms((prev) => prev.map((p, j) => j === i ? { ...p, struct: e.target.value } : p))}>
                    <MenuItem value="all"><em>{t("users.allAdmin")}</em></MenuItem>
                    {roles?.map((r) => <MenuItem key={r._id} value={r.name}>{r.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ width: 130 }}>
                  <InputLabel>{t("users.access")}</InputLabel>
                  <Select value={perm.access} label={t("users.access")} onChange={(e) => setEditPerms((prev) => prev.map((p, j) => j === i ? { ...p, access: e.target.value } : p))}>
                    <MenuItem value="read">{t("users.read")}</MenuItem>
                    <MenuItem value="write">{t("users.write")}</MenuItem>
                  </Select>
                </FormControl>
                <IconButton size="small" color="error" onClick={() => setEditPerms((prev) => prev.filter((_, j) => j !== i))}>
                  <CloseOutlinedIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <Button size="small" variant="outlined" onClick={() => setEditPerms((prev) => [...prev, { struct: "", access: "read" }])}>
              + {t("users.addPermission")}
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermDialog(false)} color="inherit">{t("common.cancel")}</Button>
          <Button onClick={savePermissions} variant="contained">{t("common.save")}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
