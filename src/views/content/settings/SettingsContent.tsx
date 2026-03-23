/**
 * SettingsContent — Page de paramètres avec catégories de navigation.
 *
 * La sous-navigation gauche liste les CATÉGORIES de paramètres.
 * Chaque catégorie a son titre et sa description.
 * Le contenu de chaque catégorie est un composant séparé.
 */

import { useState } from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme,
  Button,
} from "@mui/material";
import DashboardOutlinedIcon          from "@mui/icons-material/DashboardOutlined";
import TuneOutlinedIcon               from "@mui/icons-material/TuneOutlined";
import ArrowBackRoundedIcon           from "@mui/icons-material/ArrowBackRounded";
import scrollBarSx from "@/utils/scrollBarSx";
import DashboardSettings from "./DashboardSettings";

// ── Catégories de paramètres ─────────────────────────────────

interface SettingsCategory {
  id: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  /** Le composant de contenu (null = bientôt disponible) */
  component: React.ComponentType | null;
}

const CATEGORIES: SettingsCategory[] = [
  {
    id: "dashboard",
    label: "Tableau de bord",
    desc: "Personnalisez les widgets, graphiques et alertes de votre vue principale.",
    icon: <DashboardOutlinedIcon fontSize="small" />,
    component: DashboardSettings,
  },
  // D'autres catégories seront ajoutées ici au fur et à mesure
];

// ── Composant principal ──────────────────────────────────────

export default function SettingsContent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [activeId, setActiveId] = useState("dashboard");

  const active = CATEGORIES.find((c) => c.id === activeId);
  const ActiveComponent = active?.component;

  return (
    <Box display="flex" height="100%" width="100%" overflow="hidden">

      {/* ── Sous-navigation : catégories ────────────────────── */}
      <Box
        sx={{
          width: { xs: "100%", md: 280 },
          flexShrink: 0,
          display: isMobile && activeId ? "none" : "flex",
          flexDirection: "column",
          borderRight: { md: "1px solid" },
          borderColor: "divider",
          overflow: "hidden",
        }}>

        <Box px={2} display="flex" alignItems="center" gap={1} borderBottom={1} borderColor="divider" bgcolor="action.hover" minHeight={42}>
          <TuneOutlinedIcon fontSize="small" color="action" />
          <Typography variant="caption" fontWeight="bold" color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
            Paramètres
          </Typography>
        </Box>

        <Box flex={1} overflow="auto" sx={{ ...scrollBarSx }}>
          <List disablePadding>
            {CATEGORIES.map((cat) => (
              <ListItemButton
                key={cat.id}
                selected={activeId === cat.id}
                onClick={() => setActiveId(cat.id)}
                sx={{ py: 1.5, px: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                <ListItemIcon sx={{ minWidth: 36, color: activeId === cat.id ? "primary.main" : "text.secondary" }}>
                  {cat.icon}
                </ListItemIcon>
                <ListItemText
                  primary={cat.label}
                  secondary={cat.desc}
                  primaryTypographyProps={{ variant: "body2", fontWeight: activeId === cat.id ? 600 : 400 }}
                  secondaryTypographyProps={{ variant: "caption", color: "text.disabled", sx: { mt: 0.25 } }}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Box>

      {/* ── Contenu de la catégorie active ───────────────────── */}
      <Box flex={1} overflow="auto" sx={{ ...scrollBarSx }}>
        {isMobile && (
          <Box px={2} py={1} borderBottom={1} borderColor="divider">
            <Button size="small" startIcon={<ArrowBackRoundedIcon />} onClick={() => setActiveId("")}>
              Retour
            </Button>
          </Box>
        )}

        {ActiveComponent ? (
          <ActiveComponent />
        ) : (
          <Box display="flex" flex={1} justifyContent="center" alignItems="center" height="100%">
            <Box textAlign="center" p={3}>
              {active?.icon && <Box sx={{ color: "text.disabled", mb: 1, "& > *": { fontSize: 48 } }}>{active.icon}</Box>}
              <Typography variant="h6" fontWeight="bold" mb={0.5}>{active?.label ?? "Paramètres"}</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>{active?.desc}</Typography>
              <Typography variant="caption" color="text.disabled">Bientôt disponible</Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
