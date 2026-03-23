/**
 * SettingsContent — Paramètres de l'application.
 *
 * Sous-navigation à gauche avec sections, contenu à droite.
 * Chaque section a un titre et une mini description.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Skeleton,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import DashboardOutlinedIcon    from "@mui/icons-material/DashboardOutlined";
import RestoreOutlinedIcon      from "@mui/icons-material/RestoreOutlined";
import SaveOutlinedIcon         from "@mui/icons-material/SaveOutlined";
import WidgetsOutlinedIcon      from "@mui/icons-material/WidgetsOutlined";
import BarChartOutlinedIcon     from "@mui/icons-material/BarChartOutlined";
import HistoryOutlinedIcon      from "@mui/icons-material/HistoryOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import PaletteOutlinedIcon      from "@mui/icons-material/PaletteOutlined";
import TuneOutlinedIcon         from "@mui/icons-material/TuneOutlined";
import WifiOutlinedIcon         from "@mui/icons-material/WifiOutlined";
import BusinessOutlinedIcon     from "@mui/icons-material/BusinessOutlined";
import VolumeUpOutlinedIcon     from "@mui/icons-material/VolumeUpOutlined";
import DashboardCustomizeOutlinedIcon from "@mui/icons-material/DashboardCustomizeOutlined";
import useAxios from "@/hooks/useAxios";
import useToken from "@/hooks/useToken";
import { useSnackbar } from "notistack";
import scrollBarSx from "@/utils/scrollBarSx";

// ── Types ────────────────────────────────────────────────────

interface DashboardPrefs {
  visibleWidgets: string[];
  widgetOrder: string[];
  chartType: "pie" | "bar" | "donut" | "list";
  recentCount: number;
  alertThresholds: { duaDays: number; binderCapacity: number };
  autoRefreshSeconds: number;
  colorPalette: string;
  defaultUnit: string;
  soundNotifications: boolean;
  customLayout: unknown;
}

// ── Sections de navigation ───────────────────────────────────

interface SettingSection {
  id: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
}

const SECTIONS: SettingSection[] = [
  { id: "widgets",       label: "Widgets visibles",          desc: "Choisir les éléments affichés",            icon: <WidgetsOutlinedIcon fontSize="small" /> },
  { id: "order",         label: "Priorité d'affichage",      desc: "Ordre des widgets sur le dashboard",       icon: <DashboardOutlinedIcon fontSize="small" /> },
  { id: "chart",         label: "Type de graphique",         desc: "Donut, camembert, barres ou liste",        icon: <BarChartOutlinedIcon fontSize="small" /> },
  { id: "recent",        label: "Archives récentes",         desc: "Nombre d'éléments dans l'activité",        icon: <HistoryOutlinedIcon fontSize="small" /> },
  { id: "alerts",        label: "Seuils d'alertes",          desc: "Sensibilité DUA et classeurs",             icon: <NotificationsOutlinedIcon fontSize="small" /> },
  { id: "realtime",      label: "Temps réel",                desc: "Socket.IO — mise à jour instantanée",      icon: <WifiOutlinedIcon fontSize="small" /> },
  { id: "palette",       label: "Palette de couleurs",       desc: "Couleurs des statuts et graphiques",       icon: <PaletteOutlinedIcon fontSize="small" /> },
  { id: "unit",          label: "Unité administrative",      desc: "Filtrer le dashboard par défaut",          icon: <BusinessOutlinedIcon fontSize="small" /> },
  { id: "sound",         label: "Notifications sonores",     desc: "Alertes audio pour les DUA",               icon: <VolumeUpOutlinedIcon fontSize="small" /> },
  { id: "advanced",      label: "Personnalisation avancée",  desc: "Layout, taille et visu par zone",          icon: <DashboardCustomizeOutlinedIcon fontSize="small" /> },
];

// ── Widgets disponibles ──────────────────────────────────────

const WIDGETS = [
  { id: "stats",        label: "Cartes statistiques" },
  { id: "recent",       label: "Activité récente" },
  { id: "distribution", label: "Répartition par statut" },
  { id: "dua",          label: "Alertes DUA" },
  { id: "binders",      label: "Capacité des classeurs" },
  { id: "inventory",    label: "Inventaire physique" },
  { id: "users",        label: "Utilisateurs" },
  { id: "quickAccess",  label: "Accès rapide" },
];

const CHART_TYPES = [
  { value: "donut", label: "Donut (anneau)" },
  { value: "pie",   label: "Camembert plein" },
  { value: "bar",   label: "Barres horizontales" },
  { value: "list",  label: "Liste simple" },
];

const PALETTES = [
  { value: "default",    label: "Par défaut" },
  { value: "accessible", label: "Accessible (daltonien)" },
  { value: "monochrome", label: "Monochrome" },
  { value: "warm",       label: "Tons chauds" },
  { value: "cool",       label: "Tons froids" },
];

// ── Composant principal ──────────────────────────────────────

export default function SettingsContent() {
  const Authorization = useToken();
  const headers = useMemo(() => ({ Authorization: Authorization ?? "" }), [Authorization]);
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [prefs, setPrefs] = useState<DashboardPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("widgets");

  const [, execute] = useAxios({ headers }, { manual: true });

  useEffect(() => {
    execute({ url: "/api/stuff/archives/prefs/dashboard" })
      .then((res) => setPrefs(res.data as DashboardPrefs))
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = useCallback(async () => {
    if (!prefs) return;
    setSaving(true);
    try {
      await execute({ url: "/api/stuff/archives/prefs/dashboard", method: "PUT", data: prefs });
      enqueueSnackbar("Préférences sauvegardées.", { variant: "success" });
    } catch {
      enqueueSnackbar("Erreur lors de la sauvegarde.", { variant: "error" });
    } finally {
      setSaving(false);
    }
  }, [prefs, execute, enqueueSnackbar]);

  const handleReset = useCallback(async () => {
    try {
      const res = await execute({ url: "/api/stuff/archives/prefs/dashboard", method: "DELETE" });
      setPrefs((res.data as { prefs: DashboardPrefs }).prefs);
      enqueueSnackbar("Préférences réinitialisées.", { variant: "info" });
    } catch {
      enqueueSnackbar("Erreur.", { variant: "error" });
    }
  }, [execute, enqueueSnackbar]);

  const update = useCallback(<K extends keyof DashboardPrefs>(key: K, value: DashboardPrefs[K]) => {
    setPrefs((prev) => prev ? { ...prev, [key]: value } : prev);
  }, []);

  const toggleWidget = useCallback((id: string) => {
    setPrefs((prev) => {
      if (!prev) return prev;
      const visible = prev.visibleWidgets.includes(id)
        ? prev.visibleWidgets.filter((w) => w !== id)
        : [...prev.visibleWidgets, id];
      return { ...prev, visibleWidgets: visible };
    });
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 3, width: "100%", height: "100%" }}>
        <Stack spacing={2}>{[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={100} />)}</Stack>
      </Box>
    );
  }

  if (!prefs) return null;

  return (
    <Box display="flex" height="100%" width="100%" overflow="hidden">

      {/* ── Sous-navigation gauche ──────────────────────────── */}
      <Box
        sx={{
          width: { xs: "100%", md: 280 },
          flexShrink: 0,
          display: isMobile && activeSection ? "none" : "flex",
          flexDirection: "column",
          borderRight: { md: "1px solid" },
          borderColor: "divider",
          overflow: "hidden",
        }}>
        {/* En-tête */}
        <Box px={2} display="flex" alignItems="center" gap={1} borderBottom={1} borderColor="divider" bgcolor="action.hover" minHeight={42}>
          <TuneOutlinedIcon fontSize="small" color="action" />
          <Typography variant="caption" fontWeight="bold" color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
            Paramètres
          </Typography>
        </Box>

        {/* Liste des sections */}
        <Box flex={1} overflow="auto" sx={{ ...scrollBarSx }}>
          <List disablePadding>
            {SECTIONS.map((s) => (
              <ListItemButton
                key={s.id}
                selected={activeSection === s.id}
                onClick={() => setActiveSection(s.id)}
                sx={{ py: 1.25, px: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                <ListItemIcon sx={{ minWidth: 32, color: activeSection === s.id ? "primary.main" : "text.secondary" }}>
                  {s.icon}
                </ListItemIcon>
                <ListItemText
                  primary={s.label}
                  secondary={s.desc}
                  primaryTypographyProps={{ variant: "body2", fontWeight: activeSection === s.id ? 600 : 400, noWrap: true }}
                  secondaryTypographyProps={{ variant: "caption", noWrap: true, color: "text.disabled" }}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>

        {/* Boutons bas */}
        <Box px={2} py={1.5} borderTop={1} borderColor="divider" display="flex" gap={1}>
          <Button size="small" variant="outlined" color="inherit" startIcon={<RestoreOutlinedIcon />} onClick={handleReset} fullWidth>
            Réinitialiser
          </Button>
          <Button size="small" variant="contained" startIcon={<SaveOutlinedIcon />} onClick={handleSave} disabled={saving} fullWidth>
            {saving ? "…" : "Enregistrer"}
          </Button>
        </Box>
      </Box>

      {/* ── Contenu de la section active ────────────────────── */}
      <Box flex={1} overflow="auto" sx={{ p: { xs: 2, md: 3 }, ...scrollBarSx }}>
        {isMobile && (
          <Button size="small" onClick={() => setActiveSection("")} sx={{ mb: 1 }}>← Retour</Button>
        )}

        {activeSection === "widgets" && (
          <SectionWrapper title="Widgets visibles" desc="Activez ou désactivez les éléments affichés sur votre tableau de bord. Chaque widget peut être masqué sans perdre les données.">
            <Box display="flex" flexWrap="wrap" gap={1}>
              {WIDGETS.map((w) => (
                <Chip
                  key={w.id}
                  label={w.label}
                  variant={prefs.visibleWidgets.includes(w.id) ? "filled" : "outlined"}
                  color={prefs.visibleWidgets.includes(w.id) ? "primary" : "default"}
                  onClick={() => toggleWidget(w.id)}
                  sx={{ cursor: "pointer" }}
                />
              ))}
            </Box>
          </SectionWrapper>
        )}

        {activeSection === "order" && (
          <SectionWrapper title="Priorité d'affichage" desc="Les widgets activés apparaissent dans cet ordre sur le tableau de bord. Désactivez ceux que vous ne souhaitez pas voir.">
            <Stack spacing={0.5}>
              {prefs.visibleWidgets.map((id, i) => (
                <Box key={id} display="flex" alignItems="center" gap={1} px={1.5} py={0.75} borderRadius={1} bgcolor="action.hover">
                  <Typography variant="caption" color="text.disabled" sx={{ width: 20 }}>{i + 1}.</Typography>
                  <Typography variant="body2">{WIDGETS.find((w) => w.id === id)?.label ?? id}</Typography>
                </Box>
              ))}
            </Stack>
          </SectionWrapper>
        )}

        {activeSection === "chart" && (
          <SectionWrapper title="Type de graphique" desc="Choisissez le type de visualisation pour la répartition des archives par statut sur le tableau de bord.">
            <FormControl size="small" sx={{ minWidth: 250 }}>
              <InputLabel>Type</InputLabel>
              <Select value={prefs.chartType} label="Type" onChange={(e) => update("chartType", e.target.value as DashboardPrefs["chartType"])}>
                {CHART_TYPES.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
              </Select>
            </FormControl>
          </SectionWrapper>
        )}

        {activeSection === "recent" && (
          <SectionWrapper title="Archives récentes" desc="Définissez le nombre d'archives affichées dans la section activité récente du tableau de bord.">
            <Box maxWidth={350} px={1}>
              <Slider
                value={prefs.recentCount}
                onChange={(_, v) => update("recentCount", v as number)}
                min={3} max={20} step={1}
                marks={[{ value: 3, label: "3" }, { value: 8, label: "8" }, { value: 15, label: "15" }, { value: 20, label: "20" }]}
                valueLabelDisplay="auto"
              />
            </Box>
          </SectionWrapper>
        )}

        {activeSection === "alerts" && (
          <SectionWrapper title="Seuils d'alertes" desc="Personnalisez la sensibilité des alertes affichées en haut du tableau de bord. Les alertes vous avertissent des situations nécessitant une attention.">
            <Stack spacing={2}>
              <TextField
                size="small" type="number"
                label="Jours avant expiration DUA"
                value={prefs.alertThresholds.duaDays}
                onChange={(e) => update("alertThresholds", { ...prefs.alertThresholds, duaDays: parseInt(e.target.value) || 30 })}
                helperText="Une alerte apparaîtra quand une DUA est à moins de ce nombre de jours de l'expiration."
                sx={{ maxWidth: 300 }}
              />
              <TextField
                size="small" type="number"
                label="Seuil de capacité des classeurs (%)"
                value={prefs.alertThresholds.binderCapacity}
                onChange={(e) => update("alertThresholds", { ...prefs.alertThresholds, binderCapacity: parseInt(e.target.value) || 90 })}
                helperText="Les classeurs remplis au-delà de ce pourcentage déclenchent une alerte."
                sx={{ maxWidth: 300 }}
              />
            </Stack>
          </SectionWrapper>
        )}

        {activeSection === "realtime" && (
          <SectionWrapper title="Rafraîchissement en temps réel" desc="Le tableau de bord se met à jour automatiquement via Socket.IO quand un autre utilisateur modifie les données du système.">
            <FormControlLabel
              control={<Switch checked={prefs.autoRefreshSeconds > 0} onChange={(e) => update("autoRefreshSeconds", e.target.checked ? 1 : 0)} />}
              label={prefs.autoRefreshSeconds > 0 ? "Activé — mise à jour instantanée" : "Désactivé — mise à jour manuelle"}
            />
          </SectionWrapper>
        )}

        {activeSection === "palette" && (
          <SectionWrapper title="Palette de couleurs" desc="Changez les couleurs utilisées pour les statuts et les graphiques du tableau de bord. La palette accessible est conçue pour les personnes daltoniennes.">
            <FormControl size="small" sx={{ minWidth: 250 }}>
              <InputLabel>Palette</InputLabel>
              <Select value={prefs.colorPalette} label="Palette" onChange={(e) => update("colorPalette", e.target.value)}>
                {PALETTES.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
              </Select>
            </FormControl>
          </SectionWrapper>
        )}

        {activeSection === "unit" && (
          <SectionWrapper title="Unité administrative par défaut" desc="Filtrez le tableau de bord pour n'afficher que les données d'une unité administrative spécifique. Laissez vide pour voir toutes les unités.">
            <TextField
              size="small"
              label="Unité administrative"
              value={prefs.defaultUnit}
              onChange={(e) => update("defaultUnit", e.target.value)}
              placeholder="Ex : DRH, FINANCE, JURIDIQUE…"
              helperText="Seules les archives de cette unité seront affichées sur le dashboard."
              sx={{ maxWidth: 300 }}
            />
          </SectionWrapper>
        )}

        {activeSection === "sound" && (
          <SectionWrapper title="Notifications sonores" desc="Activez un signal sonore quand une alerte DUA apparaît ou qu'un classeur atteint sa capacité maximale. Utile pour les postes de veille.">
            <FormControlLabel
              control={<Switch checked={prefs.soundNotifications} onChange={(e) => update("soundNotifications", e.target.checked)} />}
              label={prefs.soundNotifications ? "Sons activés" : "Sons désactivés"}
            />
          </SectionWrapper>
        )}

        {activeSection === "advanced" && (
          <SectionWrapper title="Personnalisation avancée" desc="Réorganisez librement les widgets, choisissez leur taille et le type de visualisation pour chaque zone du tableau de bord.">
            <Chip label="Bientôt disponible" color="info" variant="outlined" />
            <Typography variant="body2" color="text.secondary" mt={1}>
              Cette fonctionnalité permettra de glisser-déposer les widgets, de redimensionner les zones
              et de choisir le type de données et de graphique pour chaque emplacement.
            </Typography>
          </SectionWrapper>
        )}
      </Box>
    </Box>
  );
}

// ── Sous-composant : wrapper de section ──────────────────────

function SectionWrapper({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" mb={0.5}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" mb={2.5}>{desc}</Typography>
      <Divider sx={{ mb: 2.5 }} />
      {children}
    </Box>
  );
}
