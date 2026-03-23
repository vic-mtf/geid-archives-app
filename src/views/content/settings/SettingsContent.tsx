/**
 * SettingsContent — Paramètres de l'application.
 *
 * Première section : configuration du tableau de bord (10 options).
 * Les préférences sont sauvegardées côté serveur par utilisateur.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
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
import DashboardOutlinedIcon    from "@mui/icons-material/DashboardOutlined";
import RestoreOutlinedIcon      from "@mui/icons-material/RestoreOutlined";
import SaveOutlinedIcon         from "@mui/icons-material/SaveOutlined";
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

// ── Widgets disponibles ──────────────────────────────────────

const WIDGETS = [
  { id: "stats",        label: "Cartes statistiques",     desc: "Total, en attente, actives, intermédiaires, physique" },
  { id: "recent",       label: "Activité récente",        desc: "Dernières archives soumises ou modifiées" },
  { id: "distribution", label: "Répartition par statut",  desc: "Graphique de répartition des archives" },
  { id: "dua",          label: "Alertes DUA",             desc: "DUA expirées et bientôt expirées" },
  { id: "binders",      label: "Capacité des classeurs",  desc: "Taux de remplissage des classeurs physiques" },
  { id: "inventory",    label: "Inventaire physique",     desc: "Compteurs conteneurs, classeurs, dossiers" },
  { id: "users",        label: "Utilisateurs",            desc: "Stats des comptes et permissions" },
  { id: "quickAccess",  label: "Accès rapide",            desc: "Liens directs vers les sections" },
];

const CHART_TYPES = [
  { value: "donut",  label: "Donut (anneau)" },
  { value: "pie",    label: "Camembert plein" },
  { value: "bar",    label: "Barres horizontales" },
  { value: "list",   label: "Liste simple" },
];

const PALETTES = [
  { value: "default",      label: "Par défaut" },
  { value: "accessible",   label: "Accessible (daltonien)" },
  { value: "monochrome",   label: "Monochrome" },
  { value: "warm",         label: "Tons chauds" },
  { value: "cool",         label: "Tons froids" },
];

// ── Composant ────────────────────────────────────────────────

export default function SettingsContent() {
  const Authorization = useToken();
  const headers = useMemo(() => ({ Authorization: Authorization ?? "" }), [Authorization]);
  const { enqueueSnackbar } = useSnackbar();

  const [prefs, setPrefs] = useState<DashboardPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [, execute] = useAxios({ headers }, { manual: true });

  // ── Charger les préférences ────────────────────────────────
  useEffect(() => {
    execute({ url: "/api/stuff/archives/prefs/dashboard" })
      .then((res) => setPrefs(res.data as DashboardPrefs))
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sauvegarder ────────────────────────────────────────────
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

  // ── Réinitialiser ──────────────────────────────────────────
  const handleReset = useCallback(async () => {
    try {
      const res = await execute({ url: "/api/stuff/archives/prefs/dashboard", method: "DELETE" });
      setPrefs((res.data as { prefs: DashboardPrefs }).prefs);
      enqueueSnackbar("Préférences réinitialisées.", { variant: "info" });
    } catch {
      enqueueSnackbar("Erreur.", { variant: "error" });
    }
  }, [execute, enqueueSnackbar]);

  // ── Helpers de mise à jour ─────────────────────────────────
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
      <Box sx={{ p: 3, width: "100%", height: "100%", overflow: "auto" }}>
        <Stack spacing={2}>{[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="rounded" height={120} />)}</Stack>
      </Box>
    );
  }

  if (!prefs) return null;

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, overflowY: "auto", height: "100%", width: "100%", ...scrollBarSx }}>
      {/* En-tête */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <DashboardOutlinedIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">Paramètres du tableau de bord</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button size="small" variant="outlined" color="inherit" startIcon={<RestoreOutlinedIcon />} onClick={handleReset}>
            Réinitialiser
          </Button>
          <Button size="small" variant="contained" startIcon={<SaveOutlinedIcon />} onClick={handleSave} disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </Box>
      </Box>

      <Stack spacing={2.5}>
        {/* 1. Widgets visibles */}
        <SettingCard title="1. Widgets visibles" desc="Choisissez les éléments à afficher sur le tableau de bord.">
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
        </SettingCard>

        {/* 2. Ordre des widgets (simplifié — liste réordonnée plus tard en drag&drop) */}
        <SettingCard title="2. Priorité d'affichage" desc="Les widgets activés apparaissent dans l'ordre ci-dessus. Désactivez ceux que vous ne voulez pas voir.">
          <Typography variant="caption" color="text.secondary">
            Ordre actuel : {prefs.visibleWidgets.map((id) => WIDGETS.find((w) => w.id === id)?.label ?? id).join(" → ")}
          </Typography>
        </SettingCard>

        {/* 3. Type de chart */}
        <SettingCard title="3. Type de graphique" desc="Choisissez comment afficher la répartition des archives par statut.">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Type de graphique</InputLabel>
            <Select value={prefs.chartType} label="Type de graphique" onChange={(e) => update("chartType", e.target.value as DashboardPrefs["chartType"])}>
              {CHART_TYPES.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
            </Select>
          </FormControl>
        </SettingCard>

        {/* 4. Nombre d'éléments récents */}
        <SettingCard title="4. Archives récentes" desc="Nombre d'archives à afficher dans la section activité récente.">
          <Box px={1} maxWidth={300}>
            <Slider
              value={prefs.recentCount}
              onChange={(_, v) => update("recentCount", v as number)}
              min={3} max={20} step={1}
              marks={[{ value: 3, label: "3" }, { value: 8, label: "8" }, { value: 15, label: "15" }, { value: 20, label: "20" }]}
              valueLabelDisplay="auto"
            />
          </Box>
        </SettingCard>

        {/* 5. Seuils d'alertes */}
        <SettingCard title="5. Seuils d'alertes" desc="Personnalisez la sensibilité des alertes du tableau de bord.">
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              size="small"
              type="number"
              label="Alerte DUA (jours avant expiration)"
              value={prefs.alertThresholds.duaDays}
              onChange={(e) => update("alertThresholds", { ...prefs.alertThresholds, duaDays: parseInt(e.target.value) || 30 })}
              sx={{ width: 250 }}
            />
            <TextField
              size="small"
              type="number"
              label="Alerte classeur (% capacité)"
              value={prefs.alertThresholds.binderCapacity}
              onChange={(e) => update("alertThresholds", { ...prefs.alertThresholds, binderCapacity: parseInt(e.target.value) || 90 })}
              sx={{ width: 250 }}
            />
          </Stack>
        </SettingCard>

        {/* 6. Rafraîchissement temps réel (Socket.IO) */}
        <SettingCard title="6. Rafraîchissement en temps réel" desc="Le tableau de bord se met à jour automatiquement via Socket.IO quand un autre utilisateur modifie les données.">
          <FormControlLabel
            control={<Switch checked={prefs.autoRefreshSeconds > 0} onChange={(e) => update("autoRefreshSeconds", e.target.checked ? 1 : 0)} />}
            label={prefs.autoRefreshSeconds > 0 ? "Activé (via Socket.IO)" : "Désactivé"}
          />
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
            Quand activé, les archives, l&apos;inventaire physique et les statistiques se mettent à jour instantanément sans recharger la page.
          </Typography>
        </SettingCard>

        {/* 7. Palette de couleurs */}
        <SettingCard title="7. Palette de couleurs" desc="Changez les couleurs des statuts sur le tableau de bord.">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Palette</InputLabel>
            <Select value={prefs.colorPalette} label="Palette" onChange={(e) => update("colorPalette", e.target.value)}>
              {PALETTES.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
            </Select>
          </FormControl>
        </SettingCard>

        {/* 8. Unité administrative par défaut */}
        <SettingCard title="8. Unité administrative" desc="Filtrer le tableau de bord sur une unité administrative spécifique.">
          <TextField
            size="small"
            label="Unité (vide = toutes)"
            value={prefs.defaultUnit}
            onChange={(e) => update("defaultUnit", e.target.value)}
            placeholder="Ex: DRH, FINANCE..."
            sx={{ width: 250 }}
          />
        </SettingCard>

        {/* 9. Notifications sonores */}
        <SettingCard title="9. Notifications sonores" desc="Émettre un son quand une alerte DUA apparaît ou qu'un classeur est plein.">
          <FormControlLabel
            control={<Switch checked={prefs.soundNotifications} onChange={(e) => update("soundNotifications", e.target.checked)} />}
            label={prefs.soundNotifications ? "Activées" : "Désactivées"}
          />
        </SettingCard>

        {/* 10. Personnalisation complète */}
        <SettingCard title="10. Personnalisation avancée" desc="Choisissez le contenu, la position et le type de visualisation de chaque zone du tableau de bord.">
          <Typography variant="body2" color="text.secondary">
            La personnalisation avancée permet de réorganiser librement les widgets, choisir leur taille
            et le type de visualisation (graphique, liste, nombre) pour chaque zone.
          </Typography>
          <Box mt={1}>
            <Chip label="Bientôt disponible" color="info" variant="outlined" size="small" />
          </Box>
        </SettingCard>
      </Stack>
    </Box>
  );
}

// ── Sous-composant : carte de paramètre ──────────────────────

function SettingCard({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="body1" fontWeight="bold" mb={0.25}>{title}</Typography>
        <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>{desc}</Typography>
        <Divider sx={{ mb: 1.5 }} />
        {children}
      </CardContent>
    </Card>
  );
}
