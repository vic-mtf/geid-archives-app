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
  Alert,
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
import CloseOutlinedIcon           from "@mui/icons-material/CloseOutlined";
import OpenInNewOutlinedIcon       from "@mui/icons-material/OpenInNewOutlined";
import GavelOutlinedIcon          from "@mui/icons-material/GavelOutlined";
import ShieldOutlinedIcon         from "@mui/icons-material/ShieldOutlined";
import ReplayOutlinedIcon         from "@mui/icons-material/ReplayOutlined";
import WarningAmberOutlinedIcon   from "@mui/icons-material/WarningAmberOutlined";
import PhysicalLinkSection         from "./PhysicalLinkSection";

import { useTranslation } from "react-i18next";
import { STATUS_LABEL, normalizeStatus } from "@/constants/lifecycle";
import scrollBarSx from "@/utils/scrollBarSx";
import formatDate  from "@/utils/formatTime";
import openArchiveFile from "@/utils/openArchiveFile";
import useToken from "@/hooks/useToken";
import StatusChip  from "./StatusChip";
import { resolveDua, currentPhase, humanizeDuration } from "./duaDefaults";

const THUMB_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "tif", "avif", "pdf", "docx", "xlsx", "pptx", "doc", "xls", "ppt", "odt"]);
function hasThumb(fileUrl: string | undefined): boolean {
  if (!fileUrl) return false;
  const ext = fileUrl.split(".").pop()?.toLowerCase() ?? "";
  return THUMB_EXTS.has(ext);
}

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

// ── Sous-composant — Bloc d'une phase DUA ───────────────────

interface DuaPhaseBlockProps {
  label: string;
  shortLabel: string;
  phase: { value: number; unit: "years" | "months"; startDate?: string; isDefault: boolean };
  isCurrent: boolean;
  nextLabel: string;
  t: (key: string) => string;
}

function DuaPhaseBlock({ label, phase, isCurrent, nextLabel, t }: DuaPhaseBlockProps) {
  const unitLabel =
    phase.unit === "years"
      ? phase.value === 1
        ? t("dua.yearsSingular")
        : t("dua.yearsPlural")
      : t("dua.monthsUnit");

  let expiresAt: Date | null = null;
  let pct = 0;
  let expired = false;
  let daysLeft = 0;
  if (phase.startDate) {
    const start = new Date(phase.startDate);
    expiresAt = new Date(start);
    if (phase.unit === "years") expiresAt.setFullYear(expiresAt.getFullYear() + phase.value);
    else expiresAt.setMonth(expiresAt.getMonth() + phase.value);
    const span = expiresAt.getTime() - start.getTime();
    pct = Math.min(100, Math.max(0, ((Date.now() - start.getTime()) / span) * 100));
    expired = Date.now() >= expiresAt.getTime();
    daysLeft = Math.floor((expiresAt.getTime() - Date.now()) / 86_400_000);
  }

  return (
    <Box
      sx={{
        border: 1,
        borderColor: "info.main",
        bgcolor: "info.50",
        borderRadius: 1.5,
        p: 1.25,
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.75}>
        <Box display="flex" alignItems="center" gap={0.75}>
          <Typography variant="caption" fontWeight={600} color="info.main">
            {label}
          </Typography>
          {phase.isDefault && (
            <Chip
              label="défaut"
              size="small"
              variant="outlined"
              sx={{ height: 16, fontSize: 9, "& .MuiChip-label": { px: 0.6 } }}
            />
          )}
        </Box>
        <Typography variant="caption" fontWeight={600}>
          {phase.value} {unitLabel}
        </Typography>
      </Box>

      {phase.startDate ? (
        <>
          <LinearProgress
            variant="determinate"
            value={pct}
            color={pct > 90 || expired ? "error" : pct > 70 ? "warning" : "info"}
            sx={{ height: 5, borderRadius: 2, mb: 0.75 }}
          />
          <Typography variant="caption" color="text.secondary" display="block">
            {expired ? (
              <>Expirée le <strong>{expiresAt?.toLocaleDateString("fr-FR")}</strong> — {nextLabel} imminent</>
            ) : (
              <>Reste <strong>{humanizeDuration(daysLeft)}</strong></>
            )}
          </Typography>
          {!expired && (
            <Typography variant="caption" color="text.disabled" display="block">
              {nextLabel} le {expiresAt?.toLocaleDateString("fr-FR")}
            </Typography>
          )}
        </>
      ) : (
        <Typography variant="caption" color="text.secondary" display="block">
          {isCurrent
            ? "Démarrage imminent."
            : `Prévue ${phase.value} ${unitLabel}.`}
        </Typography>
      )}
    </Box>
  );
}

// ── Composant principal ──────────────────────────────────────

export default function DetailPanel({ doc, canWrite, isAdmin, onClose, onAction }: DetailPanelProps) {
  const { t } = useTranslation();
  const norm      = normalizeStatus(doc.status as string | undefined, doc.validated as boolean | undefined);
  const rawStatus = doc.status as string | undefined;
  // DUA par phase avec defauts 10 ans / conservation (synchro serveur)
  const dua       = resolveDua(doc.dua);
  const curPhase  = currentPhase(doc.status as string | undefined, norm);
  const showDuaSection = curPhase !== null;

  const history = (doc.lifecycleHistory as Array<{ status: string; changedAt?: string }> | undefined) ?? [];

  // ── Actions rapides (barre d'icônes) ───────────────────────
  const quickActions: { title: string; icon: React.ReactNode; action: string; color?: "error" | "warning" | "success" | "info" }[] = [
    ...(norm === "PENDING" && canWrite
      ? [{ title: t("archives.actions.validate"), icon: <VerifiedOutlinedIcon />, action: "verify", color: "success" as const }]
      : []),
    ...(canWrite && norm !== "DESTROYED" ? [{ title: t("archives.actions.edit"), icon: <EditNoteOutlinedIcon />, action: "edit" }] : []),
    ...(canWrite && (norm === "ACTIVE" || norm === "SEMI_ACTIVE") ? [{ title: t("archives.actions.linkPhysical"), icon: <FolderOpenOutlinedIcon />, action: "link-physical" }] : []),
    ...((norm === "ACTIVE" || norm === "SEMI_ACTIVE") && canWrite
      ? [{ title: t("archives.actions.configureDua"), icon: <AccessTimeOutlinedIcon />, action: "configure-dua", color: "info" as const }]
      : []),
    ...(isAdmin && norm !== "DESTROYED" ? [{ title: t("archives.actions.delete"), icon: <DeleteOutlineOutlinedIcon />, action: "delete", color: "error" as const }] : []),
  ];

  // ── Transitions du cycle de vie ────────────────────────────
  const isProposedElimination = norm === "PROPOSED_ELIMINATION";

  const lifecycleActions: { label: string; icon: React.ReactNode; color?: "inherit" | "error" | "warning" | "info" | "success"; action: string }[] = [
    ...(norm === "ACTIVE" && canWrite
      ? [{ label: t("archives.actions.toSemiActive"), icon: <ArchiveOutlinedIcon />, action: "to-semi-active", color: "info" as const }]
      : []),
    ...(norm === "SEMI_ACTIVE" && canWrite
      ? [{ label: t("archives.actions.reactivate"), icon: <UnarchiveOutlinedIcon />, action: "reactivate", color: "success" as const }]
      : []),
    ...(norm === "SEMI_ACTIVE" && canWrite
      ? [{ label: t("archives.actions.toPermanent"), icon: <HistoryEduOutlinedIcon />, action: "to-permanent" }]
      : []),
    ...(norm === "SEMI_ACTIVE" && canWrite
      ? [{ label: t("archives.actions.proposeElimination"), icon: <GavelOutlinedIcon />, action: "to-proposed-elimination", color: "error" as const }]
      : []),
    ...(isAdmin && (norm === "SEMI_ACTIVE" || norm === "PERMANENT")
      ? [{ label: t("archives.actions.eliminate"), icon: <DeleteForeverOutlinedIcon />, action: "to-destroyed", color: "error" as const }]
      : []),
    ...(isAdmin && norm === "DESTROYED"
      ? [{ label: t("archives.actions.restore"), icon: <RestoreOutlinedIcon />, action: "restore" }]
      : []),
    // PROPOSED_ELIMINATION — actions spécifiques
    ...(isProposedElimination && canWrite
      ? [
          { label: t("elimination.createPV"), icon: <GavelOutlinedIcon />, action: "create-elimination-pv", color: "error" as const },
          { label: t("elimination.conserve"), icon: <ShieldOutlinedIcon />, action: "to-permanent", color: "info" as const },
          { label: t("elimination.reactivate"), icon: <ReplayOutlinedIcon />, action: "reactivate", color: "success" as const },
        ]
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
                  <OpenInNewOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ flexShrink: 0 }}>
          <CloseOutlinedIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Aperçu miniature (images, PDF, Office) */}
      {hasThumb(doc.fileUrl as string) && <ThumbnailPreview archiveId={doc._id as string} />}

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

        {/* Section Rattachement physique */}
        <Divider />
        <PhysicalLinkSection doc={doc} canWrite={canWrite} onAction={onAction} />

        {/* Section DUA — phase courante uniquement */}
        {showDuaSection && curPhase && (
          <>
            <Divider />
            <Box px={2} py={1.5}>
              <Box display="flex" alignItems="center" gap={0.75} mb={1.25}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}
                >
                  Durée de conservation
                </Typography>
                <Chip
                  label={`Sort final : ${dua.sortFinal === "conservation" ? "Historique" : "Élimination"}`}
                  size="small"
                  variant="outlined"
                  color={dua.sortFinal === "conservation" ? "secondary" : "error"}
                  sx={{ height: 18, fontSize: 10, "& .MuiChip-label": { px: 0.75 } }}
                />
              </Box>

              <DuaPhaseBlock
                label={curPhase === "active" ? "Phase active" : "Phase intermédiaire"}
                shortLabel={curPhase === "active" ? "act." : "int."}
                phase={dua[curPhase]}
                isCurrent
                nextLabel={
                  curPhase === "active"
                    ? "Passage en intermédiaire"
                    : dua.sortFinal === "conservation"
                      ? "Passage en historique"
                      : "Proposition d'élimination"
                }
                t={t}
              />
            </Box>
          </>
        )}

        {/* Bannière élimination proposée */}
        {isProposedElimination && (
          <>
            <Divider />
            <Box px={2} py={1.5}>
              <Alert
                severity="warning"
                icon={<WarningAmberOutlinedIcon fontSize="small" />}
                sx={{ mb: 1 }}
              >
                {t("elimination.proposedWarning")}
              </Alert>
              <Typography variant="caption" color="text.secondary">
                {t("elimination.pvRequired")}
              </Typography>
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
                    : h.status === "PROPOSED_ELIMINATION"                                             ? "warning.main"
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

// ── Aperçu miniature ─────────────────────────────────────────

function ThumbnailPreview({ archiveId }: { archiveId: string }) {
  const token = useToken();
  const [src, setSrc] = React.useState<string | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    if (!archiveId || !token) return;
    let revoked = false;
    fetch(`/api/stuff/archives/thumbnail/${archiveId}`, {
      headers: { Authorization: token },
    })
      .then((res) => {
        if (res.status === 204 || !res.ok) { setError(true); return null; }
        return res.blob();
      })
      .then((blob) => {
        if (blob && !revoked) setSrc(URL.createObjectURL(blob));
      })
      .catch(() => setError(true));
    return () => { revoked = true; };
  }, [archiveId, token]);

  React.useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);

  if (error || !src) return null;

  return (
    <Box px={2} py={1} borderBottom={1} borderColor="divider" display="flex" justifyContent="center" bgcolor="action.hover">
      <Box
        component="img"
        src={src}
        sx={{ maxWidth: "100%", maxHeight: 140, borderRadius: 1, objectFit: "contain" }}
      />
    </Box>
  );
}
