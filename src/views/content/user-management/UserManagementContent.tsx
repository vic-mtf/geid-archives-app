/**
 * UserManagementContent — Gestion des utilisateurs du module Archives.
 *
 * Affiche les utilisateurs visibles selon le cadre organique :
 *   - Admin (struct='all') : voit tout le monde
 *   - Responsable : voit son unité + subordonnées
 *   - Agent : voit sa propre unité
 *
 * Permet de modifier les permissions archives de chaque utilisateur.
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
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
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
import SecurityOutlinedIcon    from "@mui/icons-material/SecurityOutlined";
import AdminPanelSettingsIcon  from "@mui/icons-material/AdminPanelSettings";
import EditOutlinedIcon        from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon  from "@mui/icons-material/VisibilityOutlined";
import CreateOutlinedIcon      from "@mui/icons-material/CreateOutlined";
import PersonOutlinedIcon      from "@mui/icons-material/PersonOutlined";

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
}

interface RoleItem {
  _id: string;
  name: string;
  parent?: string;
  children?: string[];
}

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

  // ── Recherche et sélection ─────────────────────────────────
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // ── Dialog permissions ─────────────────────────────────────
  const [permDialog, setPermDialog] = useState(false);
  const [editPerms, setEditPerms] = useState<Array<{ struct: string; access: string }>>([]);

  const [, executePut] = useAxios({ method: "PUT", headers }, { manual: true });

  // ── Liste filtrée ──────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter((u) =>
      `${u.fname} ${u.lname} ${u.email} ${u.grade?.role ?? ""}`.toLowerCase().includes(q)
    );
  }, [users, search]);

  // ── Extraire les permissions archives d'un utilisateur ─────
  const getArchivePerms = useCallback((user: UserItem) => {
    const priv = user.auth?.privileges?.find((p) => p.app === "archives");
    return priv?.permissions ?? [];
  }, []);

  // ── Ouvrir le dialog de modification ───────────────────────
  const openPermDialog = useCallback((user: UserItem) => {
    setSelectedUser(user);
    setEditPerms([...getArchivePerms(user)]);
    setPermDialog(true);
  }, [getArchivePerms]);

  // ── Sauvegarder les permissions ────────────────────────────
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

  // ── Ajouter une permission ─────────────────────────────────
  const addPerm = useCallback(() => {
    setEditPerms((prev) => [...prev, { struct: "", access: "read" }]);
  }, []);

  const removePerm = useCallback((index: number) => {
    setEditPerms((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updatePerm = useCallback((index: number, field: "struct" | "access", value: string) => {
    setEditPerms((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  }, []);

  // ── Rendu ──────────────────────────────────────────────────
  return (
    <Box display="flex" flex={1} height="100%" overflow="hidden">
      {/* ── Liste des utilisateurs ──────────────────────────── */}
      <Box
        sx={{
          width: { xs: "100%", md: selectedUser && !isMobile ? "45%" : "100%" },
          display: isMobile && selectedUser ? "none" : "flex",
          flexDirection: "column",
          borderRight: selectedUser ? { md: "1px solid" } : "none",
          borderColor: "divider",
          overflow: "hidden",
        }}>

        {/* Header */}
        <Box px={2} display="flex" alignItems="center" gap={1} borderBottom={1} borderColor="divider" bgcolor="action.hover" minHeight={42}>
          <SecurityOutlinedIcon fontSize="small" color="action" />
          <Typography variant="caption" fontWeight="bold" color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
            Utilisateurs
          </Typography>
          {!usersLoading && <Chip label={filteredUsers.length} size="small" sx={{ height: 20, fontSize: "0.7rem" }} />}
        </Box>

        {/* Recherche */}
        <Box px={1.5} py={0.75} borderBottom={1} borderColor="divider">
          <TextField
            size="small"
            fullWidth
            placeholder="Rechercher un utilisateur…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <SearchRoundedIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />,
              sx: { fontSize: "0.85rem" },
            }}
          />
        </Box>

        {/* Liste */}
        <Box flex={1} overflow="auto" sx={{ ...scrollBarSx }}>
          {usersLoading ? (
            <Stack spacing={0}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Box key={i} px={2} py={1} display="flex" alignItems="center" gap={1.5} borderBottom="1px solid" borderColor="divider">
                  <Skeleton variant="circular" width={36} height={36} />
                  <Box flex={1}>
                    <Skeleton variant="text" width="50%" height={18} />
                    <Skeleton variant="text" width="70%" height={14} />
                  </Box>
                </Box>
              ))}
            </Stack>
          ) : filteredUsers.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={6}>
              <Typography color="text.secondary" variant="body2">Aucun utilisateur trouvé</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {filteredUsers.map((user) => {
                const perms = getArchivePerms(user);
                const hasWrite = perms.some((p) => p.access === "write");
                const hasAll = perms.some((p) => p.struct === "all");
                const isSelected = selectedUser?._id === user._id;
                return (
                  <ListItemButton
                    key={user._id}
                    selected={isSelected}
                    onClick={() => setSelectedUser(user)}
                    sx={{ borderBottom: "1px solid", borderColor: "divider", py: 1 }}>
                    <ListItemAvatar sx={{ minWidth: 44 }}>
                      <Avatar sx={{ width: 36, height: 36, fontSize: "0.85rem", bgcolor: hasAll ? "primary.main" : hasWrite ? "success.main" : "grey.400" }}>
                        {user.fname?.[0]}{user.lname?.[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${user.fname} ${user.lname}`}
                      secondary={
                        <Box component="span" display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
                          <Typography variant="caption" color="text.secondary" component="span">{user.grade?.role ?? "—"}</Typography>
                          {hasAll && <Chip label="Admin" size="small" color="primary" sx={{ height: 16, fontSize: "0.6rem" }} />}
                          {hasWrite && !hasAll && <Chip label="Écriture" size="small" color="success" sx={{ height: 16, fontSize: "0.6rem" }} />}
                          {!hasWrite && perms.length > 0 && <Chip label="Lecture" size="small" sx={{ height: 16, fontSize: "0.6rem" }} />}
                          {perms.length === 0 && <Chip label="Aucun droit" size="small" color="default" sx={{ height: 16, fontSize: "0.6rem" }} />}
                        </Box>
                      }
                      primaryTypographyProps={{ variant: "body2", fontWeight: 500, noWrap: true }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </Box>
      </Box>

      {/* ── Panneau détail utilisateur ──────────────────────── */}
      <Box
        flex={1}
        overflow="auto"
        sx={{ ...scrollBarSx, display: !selectedUser && !isMobile ? "flex" : selectedUser ? "flex" : "none", flexDirection: "column" }}>
        {!selectedUser ? (
          <Box display="flex" flex={1} justifyContent="center" alignItems="center">
            <Stack alignItems="center" gap={1}>
              <PersonOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
              <Typography color="text.secondary" variant="body2">Sélectionnez un utilisateur</Typography>
            </Stack>
          </Box>
        ) : (
          <Box>
            {/* Header utilisateur */}
            <Box px={2} py={2} display="flex" alignItems="center" gap={2} borderBottom={1} borderColor="divider">
              {isMobile && (
                <Button size="small" onClick={() => setSelectedUser(null)} sx={{ mr: 1 }}>← Retour</Button>
              )}
              <Avatar sx={{ width: 48, height: 48, bgcolor: "primary.main" }}>
                {selectedUser.fname?.[0]}{selectedUser.lname?.[0]}
              </Avatar>
              <Box flex={1}>
                <Typography variant="h6" fontWeight="bold">
                  {selectedUser.fname} {selectedUser.mname ?? ""} {selectedUser.lname}
                </Typography>
                <Typography variant="body2" color="text.secondary">{selectedUser.email}</Typography>
              </Box>
              {isAdmin && (
                <Tooltip title="Modifier les permissions archives">
                  <IconButton onClick={() => openPermDialog(selectedUser)} color="primary">
                    <EditOutlinedIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {/* Infos */}
            <Box px={2} py={1.5}>
              <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={0.5} display="block" mb={1}>
                Informations
              </Typography>
              <Stack spacing={1}>
                <Box display="flex" gap={1}>
                  <Typography variant="body2" color="text.secondary" width={120}>Rôle</Typography>
                  <Typography variant="body2" fontWeight={500}>{selectedUser.grade?.role ?? "—"}</Typography>
                </Box>
                <Box display="flex" gap={1}>
                  <Typography variant="body2" color="text.secondary" width={120}>Grade</Typography>
                  <Typography variant="body2">{selectedUser.grade?.grade ?? "—"}</Typography>
                </Box>
                <Box display="flex" gap={1}>
                  <Typography variant="body2" color="text.secondary" width={120}>Profil auth</Typography>
                  <Typography variant="body2">{selectedUser.auth?.name ?? "—"}</Typography>
                </Box>
                <Box display="flex" gap={1}>
                  <Typography variant="body2" color="text.secondary" width={120}>Compte actif</Typography>
                  <Chip label={selectedUser.isValid ? "Oui" : "Non"} size="small" color={selectedUser.isValid ? "success" : "error"} sx={{ height: 20 }} />
                </Box>
              </Stack>
            </Box>

            <Divider />

            {/* Permissions archives */}
            <Box px={2} py={1.5}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <AdminPanelSettingsIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
                  Permissions Archives
                </Typography>
              </Box>
              {(() => {
                const perms = getArchivePerms(selectedUser);
                if (perms.length === 0) {
                  return <Typography variant="body2" color="text.disabled" fontStyle="italic">Aucune permission sur le module archives</Typography>;
                }
                return (
                  <Stack spacing={0.5}>
                    {perms.map((p, i) => (
                      <Box key={i} display="flex" alignItems="center" gap={1} px={1} py={0.5} borderRadius={1} bgcolor="action.hover">
                        {p.access === "write"
                          ? <CreateOutlinedIcon fontSize="small" color="success" />
                          : <VisibilityOutlinedIcon fontSize="small" color="info" />
                        }
                        <Typography variant="body2" flex={1}>
                          {p.struct === "all" ? "Toutes les unités" : p.struct}
                        </Typography>
                        <Chip
                          label={p.access === "write" ? "Écriture" : "Lecture"}
                          size="small"
                          color={p.access === "write" ? "success" : "info"}
                          sx={{ height: 20, fontSize: "0.65rem" }}
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
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} mt={1}>
            {editPerms.map((perm, i) => (
              <Box key={i} display="flex" gap={1} alignItems="center">
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Unité</InputLabel>
                  <Select
                    value={perm.struct}
                    label="Unité"
                    onChange={(e) => updatePerm(i, "struct", e.target.value)}>
                    <MenuItem value="all"><em>Toutes les unités (admin)</em></MenuItem>
                    {roles?.map((r) => (
                      <MenuItem key={r._id} value={r.name}>{r.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ width: 130 }}>
                  <InputLabel>Accès</InputLabel>
                  <Select
                    value={perm.access}
                    label="Accès"
                    onChange={(e) => updatePerm(i, "access", e.target.value)}>
                    <MenuItem value="read">Lecture</MenuItem>
                    <MenuItem value="write">Écriture</MenuItem>
                  </Select>
                </FormControl>
                <IconButton size="small" color="error" onClick={() => removePerm(i)}>×</IconButton>
              </Box>
            ))}
            <Button size="small" variant="outlined" onClick={addPerm}>+ Ajouter une permission</Button>
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
