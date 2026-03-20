/**
 * DuaConfigDialog — Configure the DUA (Durée d'Utilité Administrative) for a SEMI_ACTIVE archive.
 *
 * Triggered by the CustomEvent "__configure_dua" with detail { doc }.
 * On save, calls PUT /api/stuff/archives/:id/dua and dispatches incrementVersion.
 */

import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  RadioGroup,
  Radio,
  Typography,
  Box as MuiBox,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  FormLabel,
} from "@mui/material";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import HistoryEduOutlinedIcon from "@mui/icons-material/HistoryEduOutlined";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../../redux/store";
import { incrementVersion } from "../../../redux/data";
import useAxios from "../../../hooks/useAxios";
import useToken from "../../../hooks/useToken";

type DuaUnit = "years" | "months";
type SortFinal = "conservation" | "elimination";

interface DuaDoc {
  _id?: string;
  id?: string;
  designation?: string;
  dua?: {
    value?: number;
    unit?: DuaUnit;
    sortFinal?: SortFinal;
    startDate?: string;
  };
}

/** Adds value × unit to a date */
function addDuration(date: Date, value: number, unit: DuaUnit): Date {
  const d = new Date(date);
  if (unit === "years")  d.setFullYear(d.getFullYear() + value);
  if (unit === "months") d.setMonth(d.getMonth() + value);
  return d;
}

/** Human-readable remaining time */
function formatRemaining(expiresAt: Date): string {
  const now = new Date();
  const diffMs = expiresAt.getTime() - now.getTime();
  if (diffMs <= 0) return "Expirée";
  const days  = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 30);
  const years  = Math.floor(days / 365);
  if (years  >= 1) return `${years} an${years > 1 ? "s" : ""} restant${years > 1 ? "s" : ""}`;
  if (months >= 1) return `${months} mois restant${months > 1 ? "s" : ""}`;
  return `${days} jour${days > 1 ? "s" : ""} restant${days > 1 ? "s" : ""}`;
}

export default function DuaConfigDialog() {
  const [open, setOpen] = useState(false);
  const [doc, setDoc] = useState<DuaDoc | null>(null);
  const [value, setValue] = useState<number | "">("");
  const [unit, setUnit] = useState<DuaUnit>("years");
  const [sortFinal, setSortFinal] = useState<SortFinal>("conservation");

  const Authorization = useToken();
  const dispatch = useDispatch<AppDispatch>();
  const [{ loading }, execSave] = useAxios(
    { method: "PUT", headers: { Authorization } },
    { manual: true }
  );

  // Listen for __configure_dua event
  useEffect(() => {
    const root = document.getElementById("root");
    const handler = (e: Event) => {
      const { doc: d } = (e as CustomEvent).detail as { doc: DuaDoc };
      setDoc(d);
      // Pre-fill with existing DUA if any
      setValue(d?.dua?.value ?? "");
      setUnit(d?.dua?.unit ?? "years");
      setSortFinal(d?.dua?.sortFinal ?? "conservation");
      setOpen(true);
    };
    root?.addEventListener("__configure_dua", handler);
    return () => root?.removeEventListener("__configure_dua", handler);
  }, []);

  const handleClose = () => setOpen(false);

  const startDate = doc?.dua?.startDate ? new Date(doc.dua.startDate) : new Date();

  const expiresAt = useMemo(() => {
    if (!value || Number(value) <= 0) return null;
    return addDuration(startDate, Number(value), unit);
  }, [value, unit, startDate]);

  const handleSave = async () => {
    const id = doc?._id || doc?.id;
    if (!id || !value) return;
    try {
      await execSave({
        url: `/api/stuff/archives/${id}/dua`,
        data: { value: Number(value), unit, sortFinal },
      });
      dispatch(incrementVersion());
      setOpen(false);
    } catch {
      // error handled by notistack via global interceptor
    }
  };

  const isExpired = expiresAt ? expiresAt <= new Date() : false;
  const canSave = !!value && Number(value) > 0 && !loading;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <AccessTimeOutlinedIcon color="info" />
        Paramètres DUA
        {doc?.designation && (
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1, fontWeight: 400 }}>
            — {doc.designation}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          La DUA (Durée d'Utilité Administrative) définit la durée pendant laquelle le document
          reste en phase intermédiaire avant d'être automatiquement conservé ou éliminé.
        </Alert>

        {/* Duration */}
        <MuiBox display="flex" gap={2} alignItems="flex-start" mb={2}>
          <TextField
            label="Durée"
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value === "" ? "" : Math.max(1, Number(e.target.value)))}
            inputProps={{ min: 1, max: 999 }}
            sx={{ width: 120 }}
            size="small"
          />
          <FormControl size="small" sx={{ width: 140 }}>
            <InputLabel>Unité</InputLabel>
            <Select
              value={unit}
              label="Unité"
              onChange={(e) => setUnit(e.target.value as DuaUnit)}
            >
              <MenuItem value="years">Années</MenuItem>
              <MenuItem value="months">Mois</MenuItem>
            </Select>
          </FormControl>
          {expiresAt && (
            <MuiBox flex={1} display="flex" flexDirection="column" justifyContent="center">
              <Typography variant="caption" color="text.secondary">
                Date d'expiration
              </Typography>
              <Typography variant="body2" fontWeight={600} color={isExpired ? "error.main" : "text.primary"}>
                {expiresAt.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
              </Typography>
              <Chip
                size="small"
                label={formatRemaining(expiresAt)}
                color={isExpired ? "error" : "info"}
                sx={{ mt: 0.5, width: "fit-content" }}
              />
            </MuiBox>
          )}
        </MuiBox>

        <Divider sx={{ my: 2 }} />

        {/* Sort final */}
        <FormControl component="fieldset">
          <FormLabel component="legend" sx={{ mb: 1, fontSize: 14 }}>
            Sort final à l'expiration de la DUA
          </FormLabel>
          <RadioGroup
            value={sortFinal}
            onChange={(e) => setSortFinal(e.target.value as SortFinal)}
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
                      Le document passe automatiquement en statut Historique (PERMANENT)
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
                      Élimination
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Le document passe automatiquement en statut Détruit (DESTROYED)
                    </Typography>
                  </MuiBox>
                </MuiBox>
              }
            />
          </RadioGroup>
        </FormControl>

        {/* DUA start date info */}
        {doc?.dua?.startDate && (
          <MuiBox mt={2} p={1.5} bgcolor="action.hover" borderRadius={1}>
            <Typography variant="caption" color="text.secondary">
              Date de début DUA :{" "}
              <strong>
                {new Date(doc.dua.startDate).toLocaleDateString("fr-FR", {
                  day: "2-digit", month: "long", year: "numeric",
                })}
              </strong>
              {" "}(définie lors du passage en Intermédiaire)
            </Typography>
          </MuiBox>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit" disabled={loading}>
          Annuler
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="info"
          disabled={!canSave}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          Enregistrer la DUA
        </Button>
      </DialogActions>
    </Dialog>
  );
}
