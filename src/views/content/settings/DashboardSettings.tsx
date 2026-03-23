/**
 * DashboardSettings — Options indispensables pour le tableau de bord d'archivage.
 *
 * Options essentielles pour un système d'archivage robuste :
 * 1. Widgets visibles — choisir quoi afficher
 * 2. Seuils DUA — personnaliser la sensibilité des alertes de conservation
 * 3. Capacité classeurs — seuil d'alerte de remplissage
 * 4. Archives récentes — profondeur de l'historique visible
 * 5. Temps réel — Socket.IO pour le multi-utilisateur
 * 6. Unité par défaut — filtrer par structure organique
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
  MenuItem,
  Select,
  Skeleton,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import RestoreOutlinedIcon       from "@mui/icons-material/RestoreOutlined";
import SaveOutlinedIcon          from "@mui/icons-material/SaveOutlined";
import useAxios from "@/hooks/useAxios";
import useToken from "@/hooks/useToken";
import { useSnackbar } from "notistack";
import scrollBarSx from "@/utils/scrollBarSx";

// ── Types ────────────────────────────────────────────────────

interface DashboardPrefs {
  visibleWidgets: string[];
  chartType: "pie" | "bar" | "donut" | "list";
  recentCount: number;
  alertThresholds: { duaDays: number; binderCapacity: number };
  autoRefreshSeconds: number;
  defaultUnit: string;
  soundNotifications: boolean;
  [key: string]: unknown;
}

const WIDGETS = [
  { id: "stats",        label: "Statistiques" },
  { id: "recent",       label: "Activité récente" },
  { id: "distribution", label: "Répartition par statut" },
  { id: "dua",          label: "Alertes DUA" },
  { id: "binders",      label: "Capacité classeurs" },
  { id: "inventory",    label: "Inventaire physique" },
  { id: "users",        label: "Utilisateurs" },
  { id: "quickAccess",  label: "Accès rapide" },
];

const CHART_TYPES = [
  { value: "donut", label: "Donut" },
  { value: "pie",   label: "Camembert" },
  { value: "bar",   label: "Barres" },
  { value: "list",  label: "Liste" },
];

// ── Composant ────────────────────────────────────────────────

export default function DashboardSettings() {
  const Authorization = useToken();
  const headers = useMemo(() => ({ Authorization: Authorization ?? "" }), [Authorization]);
  const { enqueueSnackbar } = useSnackbar();

  const [prefs, setPrefs] = useState<DashboardPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  if (loading) return <Box p={3}><Stack spacing={2}>{[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={50} />)}</Stack></Box>;
  if (!prefs) return null;

  return (
    <Box height="100%" overflow="auto" sx={{ ...scrollBarSx }}>
      {/* Header avec boutons */}
      <Box px={2.5} py={1.5} display="flex" alignItems="center" justifyContent="space-between" borderBottom={1} borderColor="divider" bgcolor="action.hover">
        <Typography variant="body1" fontWeight="bold">Tableau de bord</Typography>
        <Box display="flex" gap={1}>
          <Button size="small" variant="outlined" color="inherit" startIcon={<RestoreOutlinedIcon />} onClick={handleReset}>Réinitialiser</Button>
          <Button size="small" variant="contained" startIcon={<SaveOutlinedIcon />} onClick={handleSave} disabled={saving}>
            {saving ? "…" : "Enregistrer"}
          </Button>
        </Box>
      </Box>

      <Box p={2.5}>
        <Stack spacing={3}>

          {/* 1. Widgets visibles */}
          <Option title="Éléments affichés" desc="Choisissez les blocs d'information à afficher sur votre tableau de bord.">
            <Box display="flex" flexWrap="wrap" gap={1}>
              {WIDGETS.map((w) => (
                <Chip key={w.id} label={w.label}
                  variant={prefs.visibleWidgets.includes(w.id) ? "filled" : "outlined"}
                  color={prefs.visibleWidgets.includes(w.id) ? "primary" : "default"}
                  onClick={() => toggleWidget(w.id)} sx={{ cursor: "pointer" }} />
              ))}
            </Box>
          </Option>

          {/* 2. Seuil DUA */}
          <Option title="Alerte de conservation (DUA)" desc="Nombre de jours avant l'expiration d'une DUA pour déclencher une alerte. Permet d'anticiper les décisions de sort final.">
            <TextField size="small" type="number" label="Jours avant expiration" value={prefs.alertThresholds.duaDays}
              onChange={(e) => update("alertThresholds", { ...prefs.alertThresholds, duaDays: parseInt(e.target.value) || 30 })}
              sx={{ maxWidth: 250 }} />
          </Option>

          {/* 3. Seuil classeurs */}
          <Option title="Alerte de capacité physique" desc="Pourcentage de remplissage des classeurs au-delà duquel une alerte apparaît. Permet de planifier l'acquisition de nouveaux supports.">
            <TextField size="small" type="number" label="Seuil (%)" value={prefs.alertThresholds.binderCapacity}
              onChange={(e) => update("alertThresholds", { ...prefs.alertThresholds, binderCapacity: parseInt(e.target.value) || 90 })}
              sx={{ maxWidth: 250 }} />
          </Option>

          {/* 4. Profondeur historique */}
          <Option title="Profondeur de l'historique" desc="Nombre d'archives récentes affichées dans la section activité du tableau de bord.">
            <Box maxWidth={300}>
              <Slider value={prefs.recentCount} onChange={(_, v) => update("recentCount", v as number)}
                min={3} max={20} step={1} valueLabelDisplay="auto"
                marks={[{ value: 3, label: "3" }, { value: 10, label: "10" }, { value: 20, label: "20" }]} />
            </Box>
          </Option>

          {/* 5. Type de visualisation */}
          <Option title="Visualisation de la répartition" desc="Type de graphique pour la répartition des archives par statut.">
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Type</InputLabel>
              <Select value={prefs.chartType} label="Type" onChange={(e) => update("chartType", e.target.value as DashboardPrefs["chartType"])}>
                {CHART_TYPES.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Option>

          {/* 6. Temps réel */}
          <Option title="Mise à jour en temps réel" desc="Quand activé, le tableau de bord se met à jour instantanément via Socket.IO lorsqu'un autre utilisateur modifie les données.">
            <FormControlLabel
              control={<Switch checked={prefs.autoRefreshSeconds > 0} onChange={(e) => update("autoRefreshSeconds", e.target.checked ? 1 : 0)} />}
              label={prefs.autoRefreshSeconds > 0 ? "Activé" : "Désactivé"} />
          </Option>

          {/* 7. Unité administrative */}
          <Option title="Unité administrative par défaut" desc="Restreindre les données du tableau de bord à une unité du cadre organique. Laissez vide pour voir toutes les unités.">
            <TextField size="small" label="Unité" value={prefs.defaultUnit}
              onChange={(e) => update("defaultUnit", e.target.value)}
              placeholder="DRH, FINANCE…" sx={{ maxWidth: 250 }} />
          </Option>

        </Stack>
      </Box>
    </Box>
  );
}

function Option({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="body2" fontWeight="bold" mb={0.25}>{title}</Typography>
      <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>{desc}</Typography>
      {children}
      <Divider sx={{ mt: 2 }} />
    </Box>
  );
}
