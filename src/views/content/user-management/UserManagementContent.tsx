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
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SearchRoundedIcon       from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon        from "@mui/icons-material/CloseRounded";
import SecurityOutlinedIcon    from "@mui/icons-material/SecurityOutlined";
import AdminPanelSettingsIcon  from "@mui/icons-material/AdminPanelSettings";
import EditOutlinedIcon        from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon  from "@mui/icons-material/VisibilityOutlined";
import CreateOutlinedIcon      from "@mui/icons-material/CreateOutlined";
import PersonOutlinedIcon      from "@mui/icons-material/PersonOutlined";
import EmailOutlinedIcon       from "@mui/icons-material/EmailOutlined";
import BadgeOutlinedIcon       from "@mui/icons-material/BadgeOutlined";
import WorkOutlineRoundedIcon  from "@mui/icons-material/WorkOutlineRounded";
import VerifiedOutlinedIcon    from "@mui/icons-material/VerifiedOutlined";
import ArrowBackRoundedIcon    from "@mui/icons-material/ArrowBackRounded";
// Liste avec scroll natif — performant jusqu'à ~1000 utilisateurs

import useAxios from "@/hooks/useAxios";
import useToken from "@/hooks/useToken";
import useArchivePermissions from "@/hooks/useArchivePermissions";
import scrollBarSx from "@/utils/scrollBarSx";
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

const PERM_CONFIG = {
  admin: { label: "Administrateur", color: "primary" as const, short: "Admin" },
  write: { label: "Écriture", color: "success" as const, short: "Écriture" },
  read:  { label: "Lecture seule", color: "info" as const, short: "Lecture" },
  none:  { label: "Aucun droit", color: "default" as const, short: "Aucun" },
};

// ── Composant principal ──────────────────────────────────────

export default function UserManagementContent() {
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
      enqueueSnackbar(`Permissions de ${selectedUser.fname} ${selectedUser.lname} mises à jour.`, { variant: "success" });
      refetchUsers();
      setPermDialog(false);
    } catch {
      enqueueSnackbar("Erreur lors de la mise à jour des permissions.", { variant: "error" });
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
        {/* Avatar avec photo de profil */}
        <Avatar
          src={avatarUrl(user)}
          sx={{
            width: 44,
            height: 44,
            fontSize: "0.95rem",
            fontWeight: 600,
            bgcolor: level === "admin" ? "primary.main" : level === "write" ? "success.main" : level === "read" ? "info.main" : "grey.400",
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
          label={cfg.short}
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
                  <SearchRoundedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch("")}>
                    <CloseRoundedIcon fontSize="small" />
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
              <Typography color="text.secondary" variant="body2">Aucun utilisateur trouvé</Typography>
            </Box>
          ) : (
            <Box sx={{ height: "100%", overflow: "auto", ...scrollBarSx }}>
              {filteredUsers.map((_, i) => renderUserRow(i))}
            </Box>
          )}
        </Box>
      </Box>

      {/* ── Panneau détail utilisateur ──────────────────────── */}
      <Box
        flex={1}
        overflow="auto"
        sx={{
          ...scrollBarSx,
          display: !selectedUser && !isMobile ? "flex" : selectedUser ? "flex" : "none",
          flexDirection: "column",
        }}>
        {!selectedUser ? (
          <Box display="flex" flex={1} justifyContent="center" alignItems="center">
            <Stack alignItems="center" gap={1}>
              <PersonOutlinedIcon sx={{ fontSize: 48, color: "text.disabled" }} />
              <Typography color="text.secondary" variant="body2">
                Sélectionnez un utilisateur pour voir ses détails
              </Typography>
            </Stack>
          </Box>
        ) : (
          <Box>
            {/* Header avec photo large */}
            <Box px={3} py={3} display="flex" alignItems="center" gap={2.5} borderBottom={1} borderColor="divider" bgcolor="background.paper">
              {isMobile && (
                <IconButton onClick={() => setSelectedUser(null)} size="small" sx={{ mr: -1 }}>
                  <ArrowBackRoundedIcon />
                </IconButton>
              )}
              <Avatar
                src={avatarUrl(selectedUser)}
                sx={{
                  width: { xs: 56, sm: 72 },
                  height: { xs: 56, sm: 72 },
                  fontSize: { xs: "1.2rem", sm: "1.5rem" },
                  fontWeight: 700,
                  bgcolor: "primary.main",
                  border: "3px solid",
                  borderColor: "primary.light",
                }}>
                {selectedUser.fname?.[0]?.toUpperCase()}{selectedUser.lname?.[0]?.toUpperCase()}
              </Avatar>
              <Box flex={1} minWidth={0}>
                <Typography variant="h6" fontWeight="bold" noWrap sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                  {selectedUser.fname} {selectedUser.mname ?? ""} {selectedUser.lname}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>{selectedUser.email}</Typography>
                <Box display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
                  <Chip
                    label={PERM_CONFIG[getPermLevel(selectedUser)].label}
                    color={PERM_CONFIG[getPermLevel(selectedUser)].color}
                    size="small"
                    sx={{ height: 22, fontSize: "0.7rem" }}
                  />
                  <Chip
                    label={selectedUser.isValid ? "Compte actif" : "Compte inactif"}
                    color={selectedUser.isValid ? "success" : "error"}
                    variant="outlined"
                    size="small"
                    sx={{ height: 22, fontSize: "0.7rem" }}
                  />
                </Box>
              </Box>
              {isAdmin && (
                <Tooltip title="Modifier les permissions archives">
                  <IconButton onClick={() => openPermDialog(selectedUser)} color="primary" sx={{ border: 1, borderColor: "divider" }}>
                    <EditOutlinedIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {/* Informations détaillées */}
            <Box px={3} py={2}>
              <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={0.5} fontWeight="bold" display="block" mb={1.5}>
                Informations
              </Typography>
              <Stack spacing={1.5}>
                <DetailField icon={<BadgeOutlinedIcon fontSize="small" />} label="Rôle" value={selectedUser.grade?.role ?? "—"} />
                <DetailField icon={<WorkOutlineRoundedIcon fontSize="small" />} label="Grade" value={selectedUser.grade?.grade ?? "—"} />
                <DetailField icon={<EmailOutlinedIcon fontSize="small" />} label="Email" value={selectedUser.email} />
                {selectedUser.phoneCell && (
                  <DetailField icon={<PersonOutlinedIcon fontSize="small" />} label="Téléphone" value={selectedUser.phoneCell} />
                )}
                <DetailField icon={<VerifiedOutlinedIcon fontSize="small" />} label="Profil d'autorisation" value={selectedUser.auth?.name ?? "—"} />
                {selectedUser.joinedAt && (
                  <DetailField icon={<PersonOutlinedIcon fontSize="small" />} label="Inscrit le" value={new Date(selectedUser.joinedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })} />
                )}
              </Stack>
            </Box>

            <Divider />

            {/* Permissions archives */}
            <Box px={3} py={2}>
              <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                <AdminPanelSettingsIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={0.5} fontWeight="bold">
                  Permissions Archives
                </Typography>
              </Box>
              {(() => {
                const perms = getArchivePerms(selectedUser);
                if (perms.length === 0) {
                  return (
                    <Box px={1.5} py={1.5} borderRadius={1} bgcolor="action.hover">
                      <Typography variant="body2" color="text.disabled" fontStyle="italic">
                        Aucune permission sur le module archives
                      </Typography>
                    </Box>
                  );
                }
                return (
                  <Stack spacing={0.75}>
                    {perms.map((p, i) => (
                      <Box key={i} display="flex" alignItems="center" gap={1.5} px={1.5} py={1} borderRadius={1} bgcolor="action.hover">
                        {p.access === "write"
                          ? <CreateOutlinedIcon fontSize="small" color="success" />
                          : <VisibilityOutlinedIcon fontSize="small" color="info" />
                        }
                        <Typography variant="body2" flex={1}>
                          {p.struct === "all" ? "Toutes les unités administratives" : p.struct}
                        </Typography>
                        <Chip
                          label={p.access === "write" ? "Écriture" : "Lecture"}
                          size="small"
                          color={p.access === "write" ? "success" : "info"}
                          variant="outlined"
                          sx={{ height: 22, fontSize: "0.65rem", minWidth: 70 }}
                        />
                      </Box>
                    ))}
                  </Stack>
                );
              })()}
            </Box>
          </Box>
        )}
      </Box>

      {/* ── Dialog modification permissions ─────────────────── */}
      <Dialog open={permDialog} onClose={() => setPermDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle component="div">
          <Typography fontWeight="bold">
            Permissions archives — {selectedUser?.fname} {selectedUser?.lname}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Définissez les unités administratives et le niveau d&apos;accès pour le module archives.
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} mt={1}>
            {editPerms.map((perm, i) => (
              <Box key={i} display="flex" gap={1} alignItems="center">
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Unité administrative</InputLabel>
                  <Select
                    value={perm.struct}
                    label="Unité administrative"
                    onChange={(e) => setEditPerms((prev) => prev.map((p, j) => j === i ? { ...p, struct: e.target.value } : p))}>
                    <MenuItem value="all"><em>Toutes (administrateur)</em></MenuItem>
                    {roles?.map((r) => (
                      <MenuItem key={r._id} value={r.name}>{r.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ width: 140 }}>
                  <InputLabel>Accès</InputLabel>
                  <Select
                    value={perm.access}
                    label="Accès"
                    onChange={(e) => setEditPerms((prev) => prev.map((p, j) => j === i ? { ...p, access: e.target.value } : p))}>
                    <MenuItem value="read">Lecture</MenuItem>
                    <MenuItem value="write">Écriture</MenuItem>
                  </Select>
                </FormControl>
                <IconButton size="small" color="error" onClick={() => setEditPerms((prev) => prev.filter((_, j) => j !== i))}>
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <Button size="small" variant="outlined" onClick={() => setEditPerms((prev) => [...prev, { struct: "", access: "read" }])}>
              + Ajouter une permission
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermDialog(false)} color="inherit">Annuler</Button>
          <Button onClick={savePermissions} variant="contained">Enregistrer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ── Sous-composant : ligne de détail ─────────────────────────

function DetailField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Box display="flex" alignItems="center" gap={1.5}>
      <Box sx={{ color: "text.secondary", display: "flex", flexShrink: 0 }}>{icon}</Box>
      <Typography variant="body2" color="text.secondary" sx={{ width: { xs: 80, sm: 120 }, flexShrink: 0 }}>{label}</Typography>
      <Typography variant="body2" fontWeight={500} noWrap flex={1}>{value}</Typography>
    </Box>
  );
}
