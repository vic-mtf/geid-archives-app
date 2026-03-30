/**
 * PvCreateDialog — Dialog de creation d'un PV d'elimination.
 *
 * Permet de selectionner des archives proposees a l'elimination,
 * saisir un motif et l'unite administrative, puis creer le PV.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import useApiCache from "@/hooks/useApiCache";
import useToken from "@/hooks/useToken";
import scrollBarSx from "@/utils/scrollBarSx";
import { normalizeStatus } from "@/constants/lifecycle";
import useEliminationActions from "./useEliminationActions";

interface ArchiveItem {
  _id: string;
  designation?: string;
  status?: string;
  validated?: boolean;
  [key: string]: unknown;
}

interface PvCreateDialogProps {
  open: boolean;
  onClose: () => void;
  preSelectedArchives?: string[];
}

export default function PvCreateDialog({ open, onClose, preSelectedArchives }: PvCreateDialogProps) {
  const { t } = useTranslation();
  const Authorization = useToken();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const { createPv, loading: actionLoading } = useEliminationActions();

  // Get user info for default administrative unit
  const userInfo = useSelector((store: RootState) => store.user as Record<string, unknown>);
  const defaultUnit = (userInfo.administrativeUnit as string) ?? "";

  const [selected, setSelected] = useState<string[]>(preSelectedArchives ?? []);
  const [motif, setMotif] = useState("");
  const [unit, setUnit] = useState(defaultUnit);

  // Fetch archives
  const headers = useMemo(() => ({ Authorization: Authorization ?? "" }), [Authorization]);
  const { data, loading: archivesLoading, refetch } = useApiCache<ArchiveItem[]>(
    open ? "/api/stuff/archives/archived" : null,
    headers,
  );

  useEffect(() => {
    if (open) {
      refetch();
      setMotif("");
      setUnit(defaultUnit);
      setSelected(preSelectedArchives ?? []);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const eligibleArchives = useMemo(
    () => (data ?? []).filter((a) =>
      a.status === "PROPOSED_ELIMINATION" ||
      normalizeStatus(a.status, a.validated) === "PROPOSED_ELIMINATION"
    ),
    [data],
  );

  const toggleArchive = useCallback((id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const toggleAll = useCallback(() => {
    if (selected.length === eligibleArchives.length) {
      setSelected([]);
    } else {
      setSelected(eligibleArchives.map((a) => a._id));
    }
  }, [selected.length, eligibleArchives]);

  const canSubmit = selected.length > 0 && motif.trim().length > 0;

  const handleCreate = useCallback(async () => {
    if (!canSubmit) return;
    await createPv(selected, motif.trim(), unit.trim());
    onClose();
  }, [canSubmit, createPv, selected, motif, unit, onClose]);

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} maxWidth="sm" fullWidth BackdropProps={{ sx: { bgcolor: (theme: any) => theme.palette.background.paper + theme.customOptions.opacity, backdropFilter: (theme: any) => `blur(${theme.customOptions.blur})` } }} PaperProps={{ sx: { border: 1, borderColor: "divider" } }}>
      <DialogTitle>{t("elimination.createDialog.title")}</DialogTitle>
      <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Motif */}
        <TextField
          label={t("elimination.createDialog.motif")}
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          required
          fullWidth
          multiline
          minRows={2}
          maxRows={4}
          size="small"
        />

        {/* Unite administrative */}
        <TextField
          label={t("elimination.createDialog.unit")}
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          fullWidth
          size="small"
        />

        {/* Selection des archives */}
        <Box>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
            <Typography variant="subtitle2">
              {t("elimination.createDialog.selectArchives")}
            </Typography>
            {eligibleArchives.length > 0 && (
              <Button size="small" onClick={toggleAll}>
                {selected.length === eligibleArchives.length
                  ? t("elimination.createDialog.unselectAll")
                  : t("elimination.createDialog.selectAll")}
              </Button>
            )}
          </Box>

          {archivesLoading ? (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress size={24} />
            </Box>
          ) : eligibleArchives.length === 0 ? (
            <Typography variant="body2" color="text.secondary" py={2} textAlign="center">
              {t("elimination.createDialog.noArchives")}
            </Typography>
          ) : (
            <List
              dense
              disablePadding
              sx={{ maxHeight: 240, overflow: "auto", ...scrollBarSx }}
            >
              {eligibleArchives.map((archive) => (
                <ListItemButton
                  key={archive._id}
                  onClick={() => toggleArchive(archive._id)}
                  sx={{ borderRadius: 1, py: 0.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Checkbox
                      edge="start"
                      checked={selected.includes(archive._id)}
                      size="small"
                      tabIndex={-1}
                      disableRipple
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={archive.designation ?? archive._id}
                    primaryTypographyProps={{ variant: "body2", noWrap: true }}
                  />
                </ListItemButton>
              ))}
            </List>
          )}

          {selected.length > 0 && (
            <Chip
              label={t("elimination.createDialog.selectedCount", { count: selected.length })}
              size="small"
              color="primary"
              sx={{ mt: 0.5 }}
            />
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t("common.cancel")}</Button>
        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={!canSubmit || actionLoading}
          disableElevation
        >
          {actionLoading ? <CircularProgress size={20} /> : t("elimination.createDialog.submit")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
