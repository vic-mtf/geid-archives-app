/**
 * SettingsContent — Page de paramètres.
 *
 * Sous-navigation gauche identique au style de la navigation Archives.
 * Chaque catégorie a un titre simple (pas de description dans la nav).
 */

import { useMemo, useState } from "react";
import {
  Box,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  useMediaQuery,
  useTheme,
  Button,
} from "@mui/material";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import SearchRoundedIcon     from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon      from "@mui/icons-material/CloseRounded";
import ArrowBackRoundedIcon  from "@mui/icons-material/ArrowBackRounded";
import scrollBarSx from "@/utils/scrollBarSx";
import DashboardSettings from "./DashboardSettings";

// ── Catégories ───────────────────────────────────────────────

interface SettingsCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType | null;
}

const CATEGORIES: SettingsCategory[] = [
  { id: "dashboard", label: "Tableau de bord", icon: <DashboardOutlinedIcon fontSize="small" />, component: DashboardSettings },
];

// ── Composant ────────────────────────────────────────────────

export default function SettingsContent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [activeId, setActiveId] = useState("dashboard");
  const [search, setSearch] = useState("");

  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return CATEGORIES;
    return CATEGORIES.filter((c) => c.label.toLowerCase().includes(q));
  }, [search]);

  const active = CATEGORIES.find((c) => c.id === activeId);
  const ActiveComponent = active?.component;

  return (
    <Box display="flex" height="100%" width="100%" overflow="hidden">

      {/* Sous-navigation — même style que la nav Archives */}
      <Box
        sx={{
          width: { xs: "100%", md: 200 },
          flexShrink: 0,
          display: isMobile && activeId ? "none" : "flex",
          flexDirection: "column",
          borderRight: { md: "1px solid" },
          borderColor: "divider",
          overflow: "hidden",
        }}>
        <Box px={1} py={0.75} borderBottom={1} borderColor="divider">
          <TextField
            size="small"
            fullWidth
            placeholder="Rechercher un paramètre…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" color="action" /></InputAdornment>,
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch("")}><CloseRoundedIcon fontSize="small" /></IconButton>
                </InputAdornment>
              ) : null,
              sx: { fontSize: "0.85rem" },
            }}
          />
        </Box>

        <Box flex={1} overflow="auto" sx={{ ...scrollBarSx }}>
          <List dense disablePadding sx={{ px: 0.5, py: 0.5 }}>
            {filteredCategories.map((cat) => (
              <ListItemButton
                key={cat.id}
                selected={activeId === cat.id}
                onClick={() => setActiveId(cat.id)}
                sx={{ borderRadius: 1, py: 0.75, my: 0.25 }}>
                <ListItemIcon sx={{ minWidth: 28, color: activeId === cat.id ? "primary.main" : "text.secondary" }}>
                  {cat.icon}
                </ListItemIcon>
                <ListItemText
                  primary={cat.label}
                  primaryTypographyProps={{ variant: "body2", fontWeight: activeId === cat.id ? 600 : 400, noWrap: true }}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Box>

      {/* Contenu */}
      <Box flex={1} overflow="hidden" display="flex" flexDirection="column">
        {isMobile && (
          <Box px={1.5} py={0.75} borderBottom={1} borderColor="divider">
            <Button size="small" startIcon={<ArrowBackRoundedIcon />} onClick={() => setActiveId("")}>Retour</Button>
          </Box>
        )}
        {ActiveComponent ? <ActiveComponent /> : null}
      </Box>
    </Box>
  );
}
