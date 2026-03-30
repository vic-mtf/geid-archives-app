/**
 * PvDetailPanel — Panneau de detail d'un PV d'elimination.
 *
 * Affiche les informations du PV, la liste des archives, la timeline
 * d'approbation et les actions contextuelles selon le statut.
 */

import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import { useTranslation } from "react-i18next";
import useNavigateSetState from "@/hooks/useNavigateSetState";
import deepNavigate from "@/utils/deepNavigate";
import scrollBarSx from "@/utils/scrollBarSx";
import store from "@/redux/store";
import PvStatusChip from "./PvStatusChip";
import useEliminationActions from "./useEliminationActions";
import type { PvStatus } from "./pvStatusConfig";

// ── Types ────────────────────────────────────────────────────

interface ApprovalInfo {
  approvedBy?: { name?: string; email?: string } | string;
  date?: string;
  note?: string;
}

interface ArchiveRef {
  _id: string;
  designation?: string;
  status?: string;
}

export interface PvDetail {
  _id: string;
  pvNumber: string;
  status: PvStatus;
  motif: string;
  administrativeUnit?: string;
  archives: ArchiveRef[];
  createdBy?: { name?: string; email?: string };
  producerApproval?: ApprovalInfo;
  danticApproval?: ApprovalInfo;
  createdAt?: string;
}

interface PvDetailPanelProps {
  pv: PvDetail;
  canWrite: boolean;
  isAdmin: boolean;
  onClose: () => void;
}

// ── Helpers ──────────────────────────────────────────────────

function approverName(info?: ApprovalInfo): string {
  if (!info?.approvedBy) return "";
  if (typeof info.approvedBy === "string") return info.approvedBy;
  return info.approvedBy.name ?? info.approvedBy.email ?? "";
}

function formatDate(iso?: string): string {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ── Component ────────────────────────────────────────────────

export default function PvDetailPanel({ pv, canWrite, isAdmin, onClose }: PvDetailPanelProps) {
  const { t } = useTranslation();
  const navigateTo = useNavigateSetState();
  const {
    submitPv,
    approveProducer,
    approveDantic,
    rejectPv,
    executePv,
    getPdfUrl,
    loading,
  } = useEliminationActions();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteAction, setNoteAction] = useState<"approveProducer" | "approveDantic" | "reject" | null>(null);
  const [noteText, setNoteText] = useState("");

  // ── Archive click → navigate to archiveManager ──────────────

  const handleArchiveClick = useCallback(
    (archiveId: string) => {
      deepNavigate(navigateTo, { tab: "archiveManager", archiveId });
    },
    [navigateTo],
  );

  // ── PDF download with auth ──────────────────────────────────

  const handleDownloadPdf = useCallback(async () => {
    const token = (store.getState().user as { token?: string }).token;
    if (!token) return;
    try {
      const res = await fetch(getPdfUrl(pv._id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      // Silently fail — user can retry
    }
  }, [getPdfUrl, pv._id]);

  // ── Note dialog actions ────────────────────────────────────

  const openNoteDialog = useCallback((action: "approveProducer" | "approveDantic" | "reject") => {
    setNoteAction(action);
    setNoteText("");
    setNoteDialogOpen(true);
  }, []);

  const handleNoteConfirm = useCallback(async () => {
    if (!noteAction) return;
    const note = noteText.trim() || undefined;
    if (noteAction === "approveProducer") await approveProducer(pv._id, note);
    else if (noteAction === "approveDantic") await approveDantic(pv._id, note);
    else if (noteAction === "reject") await rejectPv(pv._id, note);
    setNoteDialogOpen(false);
    setNoteAction(null);
  }, [noteAction, noteText, approveProducer, approveDantic, rejectPv, pv._id]);

  // ── Execute confirmation ───────────────────────────────────

  const handleExecute = useCallback(async () => {
    await executePv(pv._id);
    setConfirmOpen(false);
  }, [executePv, pv._id]);

  // ── Approval stepper ───────────────────────────────────────

  const activeStep = useMemo(() => {
    if (pv.status === "DRAFT") return 0;
    if (pv.status === "PENDING_PRODUCER") return 0;
    if (pv.status === "PENDING_DANTIC") return 1;
    if (pv.status === "APPROVED" || pv.status === "EXECUTED") return 2;
    if (pv.status === "REJECTED") return -1;
    return 0;
  }, [pv.status]);

  const creatorName = pv.createdBy?.name ?? pv.createdBy?.email ?? "\u2014";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <Box px={2} py={1.5} display="flex" alignItems="center" gap={1}>
        <Typography variant="subtitle1" fontWeight="bold" noWrap flex={1}>
          {pv.pvNumber}
        </Typography>
        <PvStatusChip status={pv.status} />
        <IconButton size="small" onClick={onClose}>
          <CloseOutlinedIcon fontSize="small" />
        </IconButton>
      </Box>

      <Divider />

      {/* Scrollable content */}
      <Box flex={1} overflow="auto" px={2} py={1.5} sx={scrollBarSx}>
        {/* Info */}
        <Typography variant="caption" color="text.secondary" display="block">
          {t("elimination.detail.motif")}
        </Typography>
        <Typography variant="body2" mb={1}>{pv.motif}</Typography>

        <Typography variant="caption" color="text.secondary" display="block">
          {t("elimination.detail.creator")}
        </Typography>
        <Typography variant="body2" mb={1}>{creatorName}</Typography>

        <Typography variant="caption" color="text.secondary" display="block">
          {t("elimination.detail.date")}
        </Typography>
        <Typography variant="body2" mb={1}>{formatDate(pv.createdAt)}</Typography>

        {pv.administrativeUnit && (
          <>
            <Typography variant="caption" color="text.secondary" display="block">
              {t("elimination.detail.unit")}
            </Typography>
            <Typography variant="body2" mb={1}>{pv.administrativeUnit}</Typography>
          </>
        )}

        <Typography variant="caption" color="text.secondary" display="block">
          {t("elimination.detail.archiveCount")}
        </Typography>
        <Typography variant="body2" mb={1}>{pv.archives.length}</Typography>

        {/* Archive list */}
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle2" mb={0.5}>
          {t("elimination.detail.archives")}
        </Typography>
        <List dense disablePadding sx={{ maxHeight: 200, overflow: "auto", ...scrollBarSx }}>
          {pv.archives.map((archive) => (
            <ListItemButton
              key={archive._id}
              onClick={() => handleArchiveClick(archive._id)}
              sx={{ borderRadius: 1, py: 0.25 }}
            >
              <ListItemText
                primary={archive.designation ?? archive._id}
                primaryTypographyProps={{ variant: "body2", noWrap: true }}
              />
              {archive.status && (
                <Chip
                  label={archive.status}
                  size="small"
                  sx={{ height: 18, fontSize: 10, ".MuiChip-label": { px: 0.5 } }}
                />
              )}
            </ListItemButton>
          ))}
        </List>

        {/* Approval timeline */}
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle2" mb={1}>
          {t("elimination.detail.approvalTimeline")}
        </Typography>
        <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 1 }}>
          <Step completed={!!pv.producerApproval?.date}>
            <StepLabel
              error={pv.status === "REJECTED" && !pv.danticApproval?.date}
            >
              {t("elimination.detail.stepProducer")}
            </StepLabel>
            <StepContent>
              {pv.producerApproval?.date ? (
                <Typography variant="caption" color="text.secondary">
                  {approverName(pv.producerApproval)} — {formatDate(pv.producerApproval.date)}
                  {pv.producerApproval.note && ` — ${pv.producerApproval.note}`}
                </Typography>
              ) : (
                <Typography variant="caption" color="text.disabled">
                  {t("elimination.detail.awaitingApproval")}
                </Typography>
              )}
            </StepContent>
          </Step>
          <Step completed={!!pv.danticApproval?.date}>
            <StepLabel
              error={pv.status === "REJECTED" && !!pv.producerApproval?.date}
            >
              {t("elimination.detail.stepDantic")}
            </StepLabel>
            <StepContent>
              {pv.danticApproval?.date ? (
                <Typography variant="caption" color="text.secondary">
                  {approverName(pv.danticApproval)} — {formatDate(pv.danticApproval.date)}
                  {pv.danticApproval.note && ` — ${pv.danticApproval.note}`}
                </Typography>
              ) : (
                <Typography variant="caption" color="text.disabled">
                  {t("elimination.detail.awaitingApproval")}
                </Typography>
              )}
            </StepContent>
          </Step>
        </Stepper>
      </Box>

      {/* Action bar */}
      <Divider />
      <Box px={2} py={1.25} display="flex" flexWrap="wrap" gap={1}>
        {pv.status === "DRAFT" && (
          <Button
            variant="contained"
            size="small"
            startIcon={<SendOutlinedIcon />}
            onClick={() => submitPv(pv._id)}
            disabled={loading}
            disableElevation
          >
            {t("elimination.action.submit")}
          </Button>
        )}

        {pv.status === "PENDING_PRODUCER" && canWrite && (
          <>
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<CheckOutlinedIcon />}
              onClick={() => openNoteDialog("approveProducer")}
              disabled={loading}
              disableElevation
            >
              {t("elimination.action.approve")}
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<CancelOutlinedIcon />}
              onClick={() => openNoteDialog("reject")}
              disabled={loading}
            >
              {t("elimination.action.reject")}
            </Button>
          </>
        )}

        {pv.status === "PENDING_DANTIC" && isAdmin && (
          <>
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<CheckOutlinedIcon />}
              onClick={() => openNoteDialog("approveDantic")}
              disabled={loading}
              disableElevation
            >
              {t("elimination.action.approve")}
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<CancelOutlinedIcon />}
              onClick={() => openNoteDialog("reject")}
              disabled={loading}
            >
              {t("elimination.action.reject")}
            </Button>
          </>
        )}

        {pv.status === "APPROVED" && (
          <>
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<GavelOutlinedIcon />}
              onClick={() => setConfirmOpen(true)}
              disabled={loading}
              disableElevation
            >
              {t("elimination.action.execute")}
            </Button>
            <Button
              size="small"
              startIcon={<PictureAsPdfOutlinedIcon />}
              onClick={handleDownloadPdf}
            >
              {t("elimination.action.downloadPdf")}
            </Button>
          </>
        )}

        {pv.status === "EXECUTED" && (
          <Button
            size="small"
            startIcon={<PictureAsPdfOutlinedIcon />}
            onClick={handleDownloadPdf}
          >
            {t("elimination.action.downloadPdf")}
          </Button>
        )}

        {pv.status === "REJECTED" && (
          <Alert severity="info" sx={{ width: "100%", py: 0.5 }}>
            <Typography variant="body2">
              {t("elimination.detail.rejectedInfo")}
            </Typography>
          </Alert>
        )}
      </Box>

      {/* Execute confirmation dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} BackdropProps={{ sx: { bgcolor: (theme: any) => theme.palette.background.paper + theme.customOptions.opacity, backdropFilter: (theme: any) => `blur(${theme.customOptions.blur})` } }} PaperProps={{ sx: { border: 1, borderColor: "divider" } }}>
        <DialogTitle>{t("elimination.confirmExecute.title")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("elimination.confirmExecute.message", { count: pv.archives.length })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>{t("common.cancel")}</Button>
          <Button variant="contained" color="error" onClick={handleExecute} disabled={loading}>
            {t("elimination.confirmExecute.confirm")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Note dialog for approve/reject */}
      <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} maxWidth="xs" fullWidth BackdropProps={{ sx: { bgcolor: (theme: any) => theme.palette.background.paper + theme.customOptions.opacity, backdropFilter: (theme: any) => `blur(${theme.customOptions.blur})` } }} PaperProps={{ sx: { border: 1, borderColor: "divider" } }}>
        <DialogTitle>
          {noteAction === "reject"
            ? t("elimination.noteDialog.rejectTitle")
            : t("elimination.noteDialog.approveTitle")}
        </DialogTitle>
        <DialogContent>
          <TextField
            label={t("elimination.noteDialog.notePlaceholder")}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            size="small"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)}>{t("common.cancel")}</Button>
          <Button
            variant="contained"
            color={noteAction === "reject" ? "error" : "success"}
            onClick={handleNoteConfirm}
            disabled={loading}
          >
            {t("common.confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
