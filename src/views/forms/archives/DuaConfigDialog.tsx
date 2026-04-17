/**
 * DuaConfigDialog — Configure la DUA par phase (active + intermediaire).
 *
 * Declenche par CustomEvent "__configure_dua" { doc }.
 * PUT /api/stuff/archives/:id/dua avec body { active, semiActive, sortFinal }.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box as MuiBox,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";
import HistoryEduOutlinedIcon from "@mui/icons-material/HistoryEduOutlined";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/redux/store";
import { incrementVersion } from "@/redux/data";
import useAxios from "@/hooks/useAxios";
import useToken from "@/hooks/useToken";
import {
  resolveDua,
  DEFAULT_PHASE_YEARS,
  type DuaUnit,
  type DuaSortFinal,
} from "@/views/content/archive-management-content/duaDefaults";

interface DuaDoc {
  _id?: string;
  id?: string;
  designation?: string;
  dua?: unknown;
}

function addDuration(date: Date, value: number, unit: DuaUnit): Date {
  const d = new Date(date);
  if (unit === "years") d.setFullYear(d.getFullYear() + value);
  if (unit === "months") d.setMonth(d.getMonth() + value);
  return d;
}

export default function DuaConfigDialog() {
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(false);
  const [doc, setDoc] = useState<DuaDoc | null>(null);

  // Phase active
  const [activeValue, setActiveValue] = useState<number | "">(DEFAULT_PHASE_YEARS);
  const [activeUnit, setActiveUnit] = useState<DuaUnit>("years");

  // Phase intermediaire
  const [semiValue, setSemiValue] = useState<number | "">(DEFAULT_PHASE_YEARS);
  const [semiUnit, setSemiUnit] = useState<DuaUnit>("years");

  const [sortFinal, setSortFinal] = useState<DuaSortFinal>("conservation");

  const Authorization = useToken();
  const dispatch = useDispatch<AppDispatch>();
  const [{ loading }, execSave] = useAxios(
    { method: "PUT", headers: { Authorization } },
    { manual: true },
  );

  useEffect(() => {
    const root = document.getElementById("root");
    const handler = (e: Event) => {
      const { doc: d } = (e as CustomEvent).detail as { doc: DuaDoc };
      setDoc(d);
      const dua = resolveDua(d?.dua);
      setActiveValue(dua.active.value);
      setActiveUnit(dua.active.unit);
      setSemiValue(dua.semiActive.value);
      setSemiUnit(dua.semiActive.unit);
      setSortFinal(dua.sortFinal);
      setOpen(true);
    };
    root?.addEventListener("__configure_dua", handler);
    return () => root?.removeEventListener("__configure_dua", handler);
  }, []);

  const handleClose = () => setOpen(false);

  // Dates d'expiration previsionnelles (pour affichage)
  const activeStart = useMemo(() => {
    const dua = resolveDua(doc?.dua);
    return dua.active.startDate ? new Date(dua.active.startDate) : new Date();
  }, [doc]);

  const activeEnd = useMemo(() => {
    if (!activeValue || Number(activeValue) <= 0) return null;
    return addDuration(activeStart, Number(activeValue), activeUnit);
  }, [activeStart, activeValue, activeUnit]);

  const semiStart = useMemo(() => {
    const dua = resolveDua(doc?.dua);
    if (dua.semiActive.startDate) return new Date(dua.semiActive.startDate);
    return activeEnd ?? new Date(); // estimation si pas encore demarree
  }, [doc, activeEnd]);

  const semiEnd = useMemo(() => {
    if (!semiValue || Number(semiValue) <= 0) return null;
    return addDuration(semiStart, Number(semiValue), semiUnit);
  }, [semiStart, semiValue, semiUnit]);

  const canSave =
    !!activeValue && Number(activeValue) > 0 &&
    !!semiValue && Number(semiValue) > 0 &&
    !loading;

  const handleSave = async () => {
    const id = doc?._id || doc?.id;
    if (!id || !canSave) return;
    try {
      await execSave({
        url: `/api/stuff/archives/${id}/dua`,
        data: {
          active: { value: Number(activeValue), unit: activeUnit },
          semiActive: { value: Number(semiValue), unit: semiUnit },
          sortFinal,
        },
      });
      dispatch(incrementVersion());
      setOpen(false);
    } catch {
      /* error handled by notistack interceptor */
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen}
      BackdropProps={{
        sx: {
          bgcolor: (t: any) => t.palette.background.paper + t.customOptions.opacity,
          backdropFilter: (t: any) => `blur(${t.customOptions.blur})`,
        },
      }}
      PaperProps={{ sx: { border: 1, borderColor: "divider" } }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <AccessTimeOutlinedIcon color="info" />
        Durée de conservation (DUA)
        {doc?.designation && (
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1, fontWeight: 400 }}>
            — {doc.designation}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          La DUA se déroule en deux phases consécutives. À l'expiration de
          chaque phase, l'archive transite automatiquement vers l'étape
          suivante du cycle de vie.
        </Alert>

        {/* ── Phase active ── */}
        <MuiBox
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 1.5,
            p: 1.5,
            mb: 2,
          }}
        >
          <MuiBox display="flex" alignItems="center" gap={0.75} mb={1}>
            <Chip
              label="Phase active"
              size="small"
              color="info"
              sx={{ height: 20, fontSize: 11 }}
            />
            <Typography variant="caption" color="text.secondary">
              Compte à rebours : <strong>Active</strong> → Intermédiaire
            </Typography>
          </MuiBox>
          <MuiBox display="flex" gap={1.5} alignItems="center" flexWrap="wrap">
            <TextField
              label="Durée"
              type="number"
              size="small"
              value={activeValue}
              onChange={(e) =>
                setActiveValue(e.target.value === "" ? "" : Math.max(1, Number(e.target.value)))
              }
              inputProps={{ min: 1, max: 999 }}
              sx={{ width: 100 }}
            />
            <FormControl size="small" sx={{ width: 130 }}>
              <InputLabel>Unité</InputLabel>
              <Select
                value={activeUnit}
                label="Unité"
                onChange={(e) => setActiveUnit(e.target.value as DuaUnit)}
              >
                <MenuItem value="years">années</MenuItem>
                <MenuItem value="months">mois</MenuItem>
              </Select>
            </FormControl>
            {activeEnd && (
              <Typography variant="caption" color="text.secondary">
                Fin prévue :{" "}
                <strong>{activeEnd.toLocaleDateString("fr-FR")}</strong>
              </Typography>
            )}
          </MuiBox>
        </MuiBox>

        {/* ── Phase intermediaire ── */}
        <MuiBox
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 1.5,
            p: 1.5,
            mb: 2,
          }}
        >
          <MuiBox display="flex" alignItems="center" gap={0.75} mb={1}>
            <Chip
              label="Phase intermédiaire"
              size="small"
              color="secondary"
              sx={{ height: 20, fontSize: 11 }}
            />
            <Typography variant="caption" color="text.secondary">
              Compte à rebours : Intermédiaire → {sortFinal === "conservation" ? "Historique" : "Élimination"}
            </Typography>
          </MuiBox>
          <MuiBox display="flex" gap={1.5} alignItems="center" flexWrap="wrap">
            <TextField
              label="Durée"
              type="number"
              size="small"
              value={semiValue}
              onChange={(e) =>
                setSemiValue(e.target.value === "" ? "" : Math.max(1, Number(e.target.value)))
              }
              inputProps={{ min: 1, max: 999 }}
              sx={{ width: 100 }}
            />
            <FormControl size="small" sx={{ width: 130 }}>
              <InputLabel>Unité</InputLabel>
              <Select
                value={semiUnit}
                label="Unité"
                onChange={(e) => setSemiUnit(e.target.value as DuaUnit)}
              >
                <MenuItem value="years">années</MenuItem>
                <MenuItem value="months">mois</MenuItem>
              </Select>
            </FormControl>
            {semiEnd && (
              <Typography variant="caption" color="text.secondary">
                Fin prévue :{" "}
                <strong>{semiEnd.toLocaleDateString("fr-FR")}</strong>
              </Typography>
            )}
          </MuiBox>
        </MuiBox>

        {/* ── Sort final ── */}
        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend" sx={{ mb: 1, fontSize: 13 }}>
            Sort final — que faire à l'expiration de la phase intermédiaire ?
          </FormLabel>
          <RadioGroup
            value={sortFinal}
            onChange={(e) => setSortFinal(e.target.value as DuaSortFinal)}
          >
            <FormControlLabel
              value="conservation"
              control={<Radio size="small" color="secondary" />}
              label={
                <MuiBox display="flex" alignItems="center" gap={1}>
                  <HistoryEduOutlinedIcon fontSize="small" color="action" />
                  <MuiBox>
                    <Typography variant="body2" fontWeight={500}>
                      Conservation définitive
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      L'archive est versée en historique (permanent).
                    </Typography>
                  </MuiBox>
                </MuiBox>
              }
            />
            <FormControlLabel
              value="elimination"
              control={<Radio size="small" color="error" />}
              label={
                <MuiBox display="flex" alignItems="center" gap={1}>
                  <DeleteForeverOutlinedIcon fontSize="small" color="error" />
                  <MuiBox>
                    <Typography variant="body2" fontWeight={500}>
                      Élimination proposée
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Un procès-verbal d'élimination est requis pour la destruction.
                    </Typography>
                  </MuiBox>
                </MuiBox>
              }
            />
          </RadioGroup>
        </FormControl>

        <MuiBox mt={2} p={1.25} bgcolor="action.hover" borderRadius={1}>
          <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
            Cycle complet prévu
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Validation → Active ({activeValue}{" "}
            {activeUnit === "years" ? "an(s)" : "mois"}) → Intermédiaire ({semiValue}{" "}
            {semiUnit === "years" ? "an(s)" : "mois"}) →{" "}
            {sortFinal === "conservation" ? "Historique" : "Proposition d'élimination"}
          </Typography>
        </MuiBox>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit" disabled={loading}>
          {t("common.cancel")}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="info"
          disabled={!canSave}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          Enregistrer
        </Button>
      </DialogActions>
    </Dialog>
  );
}
