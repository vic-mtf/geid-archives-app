/**
 * DetailPanel — Panneau de détail d'une archive sélectionnée.
 *
 * Affiche les métadonnées, le statut, la DUA, les actions rapides,
 * les transitions du cycle de vie et l'historique des changements.
 *
 * Utilisé dans ArchiveManagementContent (panneau droit desktop,
 * bottom drawer mobile).
 */

import React from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import AccessTimeOutlinedIcon     from "@mui/icons-material/AccessTimeOutlined";
import VerifiedOutlinedIcon       from "@mui/icons-material/VerifiedOutlined";
import EditNoteOutlinedIcon       from "@mui/icons-material/EditNoteOutlined";
import FolderOpenOutlinedIcon     from "@mui/icons-material/FolderOpenOutlined";
import ArchiveOutlinedIcon        from "@mui/icons-material/ArchiveOutlined";
import UnarchiveOutlinedIcon      from "@mui/icons-material/UnarchiveOutlined";
import HistoryEduOutlinedIcon     from "@mui/icons-material/HistoryEduOutlined";
import DeleteForeverOutlinedIcon  from "@mui/icons-material/DeleteForeverOutlined";
import RestoreOutlinedIcon        from "@mui/icons-material/RestoreOutlined";
import DeleteOutlineOutlinedIcon  from "@mui/icons-material/DeleteOutlineOutlined";
import CloseRoundedIcon           from "@mui/icons-material/CloseRounded";
import OpenInNewRoundedIcon       from "@mui/icons-material/OpenInNewRounded";

import { STATUS_LABEL, normalizeStatus } from "@/constants/lifecycle";
import scrollBarSx from "@/utils/scrollBarSx";
import formatDate  from "@/utils/formatTime";
import openArchiveFile from "@/utils/openArchiveFile";
import StatusChip  from "./StatusChip";
import { computeExpiresAt } from "./helpers";

// ── Types ────────────────────────────────────────────────────

export interface DetailPanelProps {
  /** L'archive sélectionnée (row du DataGrid, typé Record<string, unknown>) */
  doc: Record<string, unknown>;
  /** L'utilisateur a les droits d'écriture */
  canWrite: boolean;
  /** L'utilisateur est administrateur */
  isAdmin: boolean;
  /** Ferme le panneau */
  onClose: () => void;
  /** Déclenche une action (edit, delete, verify, link-physical, etc.) */
  onAction: (action: string) => void;
}

// ── Sous-composant — Ligne de détail ─────────────────────────

function DetailRow({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <Box mb={1}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" noWrap={!multiline} sx={multiline ? { whiteSpace: "pre-wrap" } : undefined}>
        {value}
      </Typography>
    </Box>
  );
}

// ── Composant principal ──────────────────────────────────────

export default function DetailPanel({ doc, canWrite, isAdmin, onClose, onAction }: DetailPanelProps) {
  const norm      = normalizeStatus(doc.status as string | undefined, doc.validated as boolean | undefined);
  const rawStatus = doc.status as string | undefined;
  const dua       = doc.dua as { value?: number; unit?: string; sortFinal?: string; startDate?: string } | undefined;

  // ── Calcul DUA ─────────────────────────────────────────────
  let duaExpired = false;
  let duaPct     = 0;
  let duaExpiry: Date | null = null;
  if (norm === "SEMI_ACTIVE" && dua?.value && dua?.unit && dua?.startDate) {
    duaExpiry  = computeExpiresAt(new Date(dua.startDate), dua.value, dua.unit);
    const span = duaExpiry.getTime() - new Date(dua.startDate).getTime();
    duaPct     = Math.min(100, Math.max(0, ((Date.now() - new Date(dua.startDate).getTime()) / span) * 100));
    duaExpired = Date.now() >= duaExpiry.getTime();
  }

  const history = (doc.lifecycleHistory as Array<{ status: string; changedAt?: string }> | undefined) ?? [];

  // ── Actions rapides (barre d'icônes) ───────────────────────
  const quickActions: { title: string; icon: React.ReactNode; action: string; color?: "error" | "warning" | "success" | "info" }[] = [
    ...(norm === "PENDING" && canWrite
      ? [{ title: "Valider", icon: <VerifiedOutlinedIcon />, action: "verify", color: "success" as const }]
      : []),
    ...(canWrite && norm !== "DESTROYED" ? [{ title: "Modifier", icon: <EditNoteOutlinedIcon />, action: "edit" }] : []),
    ...(canWrite && (norm === "ACTIVE" || norm === "SEMI_ACTIVE") ? [{ title: "Dossier physique", icon: <FolderOpenOutlinedIcon />, action: "link-physical" }] : []),
    ...(norm === "SEMI_ACTIVE" && canWrite
      ? [{ title: "Définir la durée de conservation", icon: <AccessTimeOutlinedIcon />, action: "configure-dua", color: "info" as const }]
      : []),
    ...(isAdmin && norm !== "DESTROYED" ? [{ title: "Supprimer", icon: <DeleteOutlineOutlinedIcon />, action: "delete", color: "error" as const }] : []),
  ];

  // ── Transitions du cycle de vie ────────────────────────────
  const lifecycleActions: { label: string; icon: React.ReactNode; color?: "inherit" | "error" | "warning" | "info" | "success"; action: string }[] = [
    ...(norm === "ACTIVE" && canWrite
      ? [{ label: "Passer en intermédiaire", icon: <ArchiveOutlinedIcon />, action: "to-semi-active", color: "info" as const }]
      : []),
    ...(norm === "SEMI_ACTIVE" && canWrite
      ? [{ label: "Réactiver", icon: <UnarchiveOutlinedIcon />, action: "reactivate", color: "success" as const }]
      : []),
    ...(norm === "SEMI_ACTIVE" && canWrite
      ? [{ label: "Classer en historique", icon: <HistoryEduOutlinedIcon />, action: "to-permanent" }]
      : []),
    ...(isAdmin && (norm === "SEMI_ACTIVE" || norm === "PERMANENT")
      ? [{ label: "Éliminer", icon: <DeleteForeverOutlinedIcon />, action: "to-destroyed", color: "error" as const }]
      : []),
    ...(isAdmin && norm === "DESTROYED"
      ? [{ label: "Restaurer", icon: <RestoreOutlinedIcon />, action: "restore" }]
      : []),
  ];

  return (
    <Box display="flex" flexDirection="column" height="100%" overflow="hidden">

      {/* En-tête — titre + statut + bouton fermer */}
      <Box
        px={2} py={1.5}
        display="flex" alignItems="flex-start" justifyContent="space-between"
        sx={{ borderBottom: 1, borderColor: "divider", flexShrink: 0 }}
      >
        <Box flex={1} mr={1} minWidth={0}>
          <Typography variant="subtitle2" fontWeight={700} noWrap title={doc.designation as string}>
            {(doc.designation as string) || "—"}
          </Typography>
          <Box display="flex" alignItems="center" gap={0.75} mt={0.5} flexWrap="wrap">
            <StatusChip status={rawStatus} validated={doc.validated as boolean} />
            {Boolean(doc.fileUrl) && (
              <Tooltip title="Ouvrir le fichier">
                <IconButton
                  size="small"
                  onClick={() => openArchiveFile(doc._id as string, doc.designation as string ?? "Fichier")}
                >
                  <OpenInNewRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ flexShrink: 0 }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Barre d'actions rapides */}
      {quickActions.length > 0 && (
        <Box
          px={1.5} py={0.75}
          display="flex" gap={0.5} flexWrap="wrap"
          sx={{ borderBottom: 1, borderColor: "divider", flexShrink: 0 }}
        >
          {quickActions.map((a) => (
            <Tooltip key={a.action} title={a.title}>
              <IconButton
                size="small"
                color={a.color ?? "default"}
                onClick={() => onAction(a.action)}
                sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}
              >
                {a.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Box>
      )}

      {/* Corps scrollable */}
      <Box flex={1} overflow="auto" sx={{ ...scrollBarSx }}>

        {/* Métadonnées */}
        <Box px={2} py={1.5}>
          <DetailRow label="Type"           value={(doc.type as string) || "—"} />
          <DetailRow label="N° classement"  value={(doc.classNumber as string) || "—"} />
          <DetailRow label="N° référence"   value={(doc.refNumber as string) || "—"} />
          <DetailRow label="Description"    value={(doc.description as string) || "—"} multiline />
          <DetailRow label="Créé le"        value={doc.createdAt ? formatDate(doc.createdAt as string) : "—"} />
          {Boolean(doc.folder) && (
            <DetailRow
              label="Dossier / Activité"
              value={
                typeof doc.folder === "object" && doc.folder !== null
                  ? ((doc.folder as Record<string, unknown>).name as string) || "—"
                  : String(doc.folder)
              }
            />
          )}
          {Array.isArray(doc.tags) && (doc.tags as string[]).length > 0 && (
            <Box mb={1}>
              <Typography variant="caption" color="text.secondary">Mots-clés</Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.25}>
                {(doc.tags as string[]).map((t) => (
                  <Chip key={t} label={t} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}
        </Box>

        {/* Section DUA */}
        {norm === "SEMI_ACTIVE" && (
          <>
            <Divider />
            <Box px={2} py={1.5}>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                Durée de conservation (DUA)
              </Typography>
              {!dua?.value ? (
                <Chip icon={<AccessTimeOutlinedIcon />} label="Non configurée" size="small" color="warning" variant="outlined" />
              ) : (
                <>
                  <Typography variant="body2" mb={0.5}>
                    {dua.value} {dua.unit === "years" ? "an(s)" : "mois"}
                    {" · "}
                    Sort : <strong>{dua.sortFinal === "conservation" ? "Historique" : "Élimination"}</strong>
                  </Typography>
                  {duaExpiry && (
                    <Typography
                      variant="caption"
                      color={duaExpired ? "error.main" : "text.secondary"}
                      display="block"
                      mb={0.5}
                    >
                      {duaExpired ? "Expirée le " : "Expire le "}
                      {duaExpiry.toLocaleDateString("fr-FR")}
                    </Typography>
                  )}
                  <LinearProgress
                    variant="determinate"
                    value={duaPct}
                    color={duaPct > 90 || duaExpired ? "error" : duaPct > 70 ? "warning" : "info"}
                    sx={{ height: 6, borderRadius: 2 }}
                  />
                </>
              )}
            </Box>
          </>
        )}

        {/* Transitions du cycle de vie */}
        {lifecycleActions.length > 0 && (
          <>
            <Divider />
            <Box px={2} py={1.5}>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                Cycle de vie
              </Typography>
              <Stack spacing={0.75}>
                {lifecycleActions.map((a) => (
                  <Button
                    key={a.action}
                    variant="outlined"
                    size="small"
                    color={a.color ?? "inherit"}
                    startIcon={a.icon}
                    onClick={() => onAction(a.action)}
                    sx={{ justifyContent: "flex-start" }}
                    fullWidth
                  >
                    {a.label}
                  </Button>
                ))}
              </Stack>
            </Box>
          </>
        )}

        {/* Historique des transitions */}
        {history.length > 0 && (
          <>
            <Divider />
            <Box px={2} py={1.5}>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                Historique
              </Typography>
              <Stack spacing={0.5}>
                {[...history].reverse().slice(0, 6).map((h, i) => {
                  const dotColor =
                    h.status === "ACTIVE" || h.status === "validated" || h.status === "actif"         ? "success.main"
                    : h.status === "PENDING" || h.status === "pending"                                ? "warning.main"
                    : h.status === "SEMI_ACTIVE" || h.status === "archived" || h.status === "intermédiaire" ? "info.main"
                    : h.status === "PERMANENT" || h.status === "historique"                          ? "secondary.main"
                    : h.status === "DESTROYED" || h.status === "disposed"  || h.status === "détruit" ? "error.main"
                    : "text.disabled";
                  return (
                    <Box key={i} display="flex" alignItems="center" gap={1}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, bgcolor: dotColor }} />
                      <Box flex={1}>
                        <Typography variant="caption" fontWeight={500}>
                          {STATUS_LABEL[h.status] ?? h.status}
                        </Typography>
                        {h.changedAt && (
                          <Typography variant="caption" color="text.disabled" display="block">
                            {new Date(h.changedAt).toLocaleDateString("fr-FR")}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
