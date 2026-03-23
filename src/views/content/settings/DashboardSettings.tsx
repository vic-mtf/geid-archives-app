/**
 * DashboardSettings — Options de configuration du tableau de bord.
 *
 * Sous-navigation interne avec les 10 options :
 * widgets, ordre, chart, récents, alertes, temps réel, palette, unité, sons, avancé.
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
} from "@mui/material";
import RestoreOutlinedIcon      from "@mui/icons-material/RestoreOutlined";
import SaveOutlinedIcon         from "@mui/icons-material/SaveOutlined";
import WidgetsOutlinedIcon      from "@mui/icons-material/WidgetsOutlined";
import DashboardOutlinedIcon    from "@mui/icons-material/DashboardOutlined";
import BarChartOutlinedIcon     from "@mui/icons-material/BarChartOutlined";
import HistoryOutlinedIcon      from "@mui/icons-material/HistoryOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import PaletteOutlinedIcon      from "@mui/icons-material/PaletteOutlined";
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

// ── Sous-sections ────────────────────────────────────────────

const SUB_SECTIONS = [
  { id: "widgets",  label: "Widgets visibles",         icon: <WidgetsOutlinedIcon fontSize="small" /> },
  { id: "order",    label: "Priorité d'affichage",     icon: <DashboardOutlinedIcon fontSize="small" /> },
  { id: "chart",    label: "Type de graphique",         icon: <BarChartOutlinedIcon fontSize="small" /> },
  { id: "recent",   label: "Archives récentes",         icon: <HistoryOutlinedIcon fontSize="small" /> },
  { id: "alerts",   label: "Seuils d'alertes",          icon: <NotificationsOutlinedIcon fontSize="small" /> },
  { id: "realtime", label: "Temps réel",                icon: <WifiOutlinedIcon fontSize="small" /> },
  { id: "palette",  label: "Palette de couleurs",       icon: <PaletteOutlinedIcon fontSize="small" /> },
  { id: "unit",     label: "Unité administrative",      icon: <BusinessOutlinedIcon fontSize="small" /> },
  { id: "sound",    label: "Notifications sonores",     icon: <VolumeUpOutlinedIcon fontSize="small" /> },
  { id: "advanced", label: "Personnalisation avancée",  icon: <DashboardCustomizeOutlinedIcon fontSize="small" /> },
];

const WIDGETS = [
  { id: "stats", label: "Cartes statistiques" }, { id: "recent", label: "Activité récente" },
  { id: "distribution", label: "Répartition statut" }, { id: "dua", label: "Alertes DUA" },
  { id: "binders", label: "Classeurs" }, { id: "inventory", label: "Inventaire physique" },
  { id: "users", label: "Utilisateurs" }, { id: "quickAccess", label: "Accès rapide" },
];

const CHART_TYPES = [
  { value: "donut", label: "Donut" }, { value: "pie", label: "Camembert" },
  { value: "bar", label: "Barres" }, { value: "list", label: "Liste" },
];

const PALETTES = [
  { value: "default", label: "Par défaut" }, { value: "accessible", label: "Accessible" },
  { value: "monochrome", label: "Monochrome" }, { value: "warm", label: "Tons chauds" }, { value: "cool", label: "Tons froids" },
];

// ── Composant ────────────────────────────────────────────────

export default function DashboardSettings() {
  const Authorization = useToken();
  const headers = useMemo(() => ({ Authorization: Authorization ?? "" }), [Authorization]);
  const { enqueueSnackbar } = useSnackbar();

  const [prefs, setPrefs] = useState<DashboardPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sub, setSub] = useState("widgets");

  const [, execute] = useAxios({ headers }, { manual: true });

  useEffect(() => {
    execute({ url: "/api/stuff/archives/prefs/dashboard" })
      .then((res) => setPrefs(res.data as DashboardPrefs))
      .catch(() => {}).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = useCallback(async () => {
    if (!prefs) return;
    setSaving(true);
    try {
      await execute({ url: "/api/stuff/archives/prefs/dashboard", method: "PUT", data: prefs });
      enqueueSnackbar("Préférences sauvegardées.", { variant: "success" });
    } catch { enqueueSnackbar("Erreur.", { variant: "error" }); }
    finally { setSaving(false); }
  }, [prefs, execute, enqueueSnackbar]);

  const handleReset = useCallback(async () => {
    try {
      const res = await execute({ url: "/api/stuff/archives/prefs/dashboard", method: "DELETE" });
      setPrefs((res.data as { prefs: DashboardPrefs }).prefs);
      enqueueSnackbar("Réinitialisé.", { variant: "info" });
    } catch { enqueueSnackbar("Erreur.", { variant: "error" }); }
  }, [execute, enqueueSnackbar]);

  const update = useCallback(<K extends keyof DashboardPrefs>(key: K, val: DashboardPrefs[K]) => {
    setPrefs((p) => p ? { ...p, [key]: val } : p);
  }, []);

  const toggleWidget = useCallback((id: string) => {
    setPrefs((p) => {
      if (!p) return p;
      const v = p.visibleWidgets.includes(id) ? p.visibleWidgets.filter((w) => w !== id) : [...p.visibleWidgets, id];
      return { ...p, visibleWidgets: v };
    });
  }, []);

  if (loading) return <Box p={3}><Stack spacing={2}>{[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={60} />)}</Stack></Box>;
  if (!prefs) return null;

  return (
    <Box display="flex" height="100%" overflow="hidden">
      {/* Sous-nav des 10 options */}
      <Box sx={{ width: 220, flexShrink: 0, borderRight: "1px solid", borderColor: "divider", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Box flex={1} overflow="auto" sx={{ ...scrollBarSx }}>
          <List disablePadding dense>
            {SUB_SECTIONS.map((s) => (
              <ListItemButton key={s.id} selected={sub === s.id} onClick={() => setSub(s.id)} sx={{ py: 0.75, px: 1.5 }}>
                <ListItemIcon sx={{ minWidth: 28, color: sub === s.id ? "primary.main" : "text.secondary" }}>{s.icon}</ListItemIcon>
                <ListItemText primary={s.label} primaryTypographyProps={{ variant: "caption", fontWeight: sub === s.id ? 600 : 400, noWrap: true }} />
              </ListItemButton>
            ))}
          </List>
        </Box>
        <Box px={1} py={1} borderTop={1} borderColor="divider" display="flex" gap={0.5}>
          <Button size="small" variant="outlined" color="inherit" onClick={handleReset} fullWidth sx={{ fontSize: "0.7rem" }}>
            <RestoreOutlinedIcon sx={{ fontSize: 14, mr: 0.5 }} /> Réinit.
          </Button>
          <Button size="small" variant="contained" onClick={handleSave} disabled={saving} fullWidth sx={{ fontSize: "0.7rem" }}>
            <SaveOutlinedIcon sx={{ fontSize: 14, mr: 0.5 }} /> {saving ? "…" : "Sauver"}
          </Button>
        </Box>
      </Box>

      {/* Contenu de l'option */}
      <Box flex={1} overflow="auto" p={{ xs: 2, md: 3 }} sx={{ ...scrollBarSx }}>
        {sub === "widgets" && <Section title="Widgets visibles" desc="Activez ou désactivez les blocs affichés sur votre tableau de bord.">
          <Box display="flex" flexWrap="wrap" gap={1}>
            {WIDGETS.map((w) => <Chip key={w.id} label={w.label} variant={prefs.visibleWidgets.includes(w.id) ? "filled" : "outlined"} color={prefs.visibleWidgets.includes(w.id) ? "primary" : "default"} onClick={() => toggleWidget(w.id)} sx={{ cursor: "pointer" }} />)}
          </Box>
        </Section>}

        {sub === "order" && <Section title="Priorité d'affichage" desc="Les widgets s'affichent dans cet ordre.">
          <Stack spacing={0.5}>{prefs.visibleWidgets.map((id, i) => (
            <Box key={id} display="flex" alignItems="center" gap={1} px={1.5} py={0.5} borderRadius={1} bgcolor="action.hover">
              <Typography variant="caption" color="text.disabled" width={20}>{i + 1}.</Typography>
              <Typography variant="body2">{WIDGETS.find((w) => w.id === id)?.label ?? id}</Typography>
            </Box>
          ))}</Stack>
        </Section>}

        {sub === "chart" && <Section title="Type de graphique" desc="Visualisation de la répartition des archives.">
          <FormControl size="small" sx={{ minWidth: 250 }}><InputLabel>Type</InputLabel>
            <Select value={prefs.chartType} label="Type" onChange={(e) => update("chartType", e.target.value as DashboardPrefs["chartType"])}>
              {CHART_TYPES.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Section>}

        {sub === "recent" && <Section title="Archives récentes" desc="Nombre d'archives dans l'activité récente.">
          <Box maxWidth={350} px={1}>
            <Slider value={prefs.recentCount} onChange={(_, v) => update("recentCount", v as number)} min={3} max={20} step={1}
              marks={[{ value: 3, label: "3" }, { value: 8, label: "8" }, { value: 15, label: "15" }, { value: 20, label: "20" }]} valueLabelDisplay="auto" />
          </Box>
        </Section>}

        {sub === "alerts" && <Section title="Seuils d'alertes" desc="Sensibilité des alertes DUA et capacité classeurs.">
          <Stack spacing={2}>
            <TextField size="small" type="number" label="Jours avant expiration DUA" value={prefs.alertThresholds.duaDays}
              onChange={(e) => update("alertThresholds", { ...prefs.alertThresholds, duaDays: parseInt(e.target.value) || 30 })}
              helperText="Alerte quand une DUA est à moins de X jours." sx={{ maxWidth: 300 }} />
            <TextField size="small" type="number" label="Seuil classeur (%)" value={prefs.alertThresholds.binderCapacity}
              onChange={(e) => update("alertThresholds", { ...prefs.alertThresholds, binderCapacity: parseInt(e.target.value) || 90 })}
              helperText="Alerte quand un classeur dépasse ce pourcentage." sx={{ maxWidth: 300 }} />
          </Stack>
        </Section>}

        {sub === "realtime" && <Section title="Temps réel (Socket.IO)" desc="Mise à jour instantanée quand d'autres utilisateurs modifient les données.">
          <FormControlLabel control={<Switch checked={prefs.autoRefreshSeconds > 0} onChange={(e) => update("autoRefreshSeconds", e.target.checked ? 1 : 0)} />}
            label={prefs.autoRefreshSeconds > 0 ? "Activé — temps réel" : "Désactivé"} />
        </Section>}

        {sub === "palette" && <Section title="Palette de couleurs" desc="Couleurs des statuts et graphiques. La palette accessible est pour les daltoniens.">
          <FormControl size="small" sx={{ minWidth: 250 }}><InputLabel>Palette</InputLabel>
            <Select value={prefs.colorPalette} label="Palette" onChange={(e) => update("colorPalette", e.target.value)}>
              {PALETTES.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Section>}

        {sub === "unit" && <Section title="Unité administrative" desc="Filtrer le dashboard par défaut sur une unité. Vide = toutes.">
          <TextField size="small" label="Unité" value={prefs.defaultUnit} onChange={(e) => update("defaultUnit", e.target.value)}
            placeholder="DRH, FINANCE…" sx={{ maxWidth: 300 }} />
        </Section>}

        {sub === "sound" && <Section title="Notifications sonores" desc="Signal audio pour les alertes DUA et classeurs pleins.">
          <FormControlLabel control={<Switch checked={prefs.soundNotifications} onChange={(e) => update("soundNotifications", e.target.checked)} />}
            label={prefs.soundNotifications ? "Sons activés" : "Sons désactivés"} />
        </Section>}

        {sub === "advanced" && <Section title="Personnalisation avancée" desc="Glisser-déposer, redimensionner, choisir la visualisation par zone.">
          <Chip label="Bientôt disponible" color="info" variant="outlined" />
        </Section>}
      </Box>
    </Box>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return <Box><Typography variant="h6" fontWeight="bold" mb={0.5}>{title}</Typography>
    <Typography variant="body2" color="text.secondary" mb={2}>{desc}</Typography>
    <Divider sx={{ mb: 2 }} />{children}</Box>;
}
