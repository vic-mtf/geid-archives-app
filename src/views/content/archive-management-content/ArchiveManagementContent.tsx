/**
 * ArchiveManagementContent
 *
 * Disposition 3 colonnes : Sidebar gauche | DataGrid | Panneau détail
 * Responsive :
 *   – xs/sm : sidebar cachée, filtres en chips horizontaux, détail en bottom-drawer
 *   – md+   : sidebar 200 px, panneau détail 300 px inline
 */

import React, { useEffect, useMemo, useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../../redux/store";
import { updateData, incrementVersion } from "../../../redux/data";
import {
  Box as MuiBox,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  LinearProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddRoundedIcon                 from "@mui/icons-material/AddRounded";
import AccessTimeOutlinedIcon         from "@mui/icons-material/AccessTimeOutlined";
import VerifiedOutlinedIcon           from "@mui/icons-material/VerifiedOutlined";
import EditNoteOutlinedIcon           from "@mui/icons-material/EditNoteOutlined";
import FolderOpenOutlinedIcon         from "@mui/icons-material/FolderOpenOutlined";
import ArchiveOutlinedIcon            from "@mui/icons-material/ArchiveOutlined";
import UnarchiveOutlinedIcon          from "@mui/icons-material/UnarchiveOutlined";
import HistoryEduOutlinedIcon         from "@mui/icons-material/HistoryEduOutlined";
import DeleteForeverOutlinedIcon      from "@mui/icons-material/DeleteForeverOutlined";
import RestoreOutlinedIcon            from "@mui/icons-material/RestoreOutlined";
import DeleteOutlineOutlinedIcon      from "@mui/icons-material/DeleteOutlineOutlined";
import CloseRoundedIcon               from "@mui/icons-material/CloseRounded";
import OpenInNewRoundedIcon           from "@mui/icons-material/OpenInNewRounded";
import AllInboxRoundedIcon            from "@mui/icons-material/AllInboxRounded";
import PendingActionsRoundedIcon      from "@mui/icons-material/PendingActionsRounded";
import CheckCircleOutlineRoundedIcon  from "@mui/icons-material/CheckCircleOutlineRounded";
import ArchiveRoundedIcon             from "@mui/icons-material/ArchiveRounded";
import MenuBookRoundedIcon            from "@mui/icons-material/MenuBookRounded";
import DeleteSweepRoundedIcon         from "@mui/icons-material/DeleteSweepRounded";
import AlarmRoundedIcon               from "@mui/icons-material/AlarmRounded";
import CalendarTodayRoundedIcon       from "@mui/icons-material/CalendarTodayRounded";
import SearchRoundedIcon              from "@mui/icons-material/SearchRounded";
import FileDownloadOutlinedIcon       from "@mui/icons-material/FileDownloadOutlined";
import BoltRoundedIcon                from "@mui/icons-material/BoltRounded";
import {
  DataGrid,
  GridColDef,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
  GridRowSelectionModel,
  GridRowParams,
} from "@mui/x-data-grid";
import { frFR } from "@mui/x-data-grid/locales";
import useAxios               from "../../../hooks/useAxios";
import useToken               from "../../../hooks/useToken";
import useArchivePermissions  from "../../../hooks/useArchivePermissions";
import type { Archive, ArchiveDocument, NavigationState } from "../../../types";
import scrollBarSx            from "../../../utils/scrollBarSx";
import NavigationMenuButton   from "../../navigation/NavigationMenuButton";
import { useSnackbar }        from "notistack";
import formatDate             from "../../../utils/formatTime";

// ── Lifecycle helpers ──────────────────────────────────────────────────────────

export type NormalizedStatus = "PENDING" | "ACTIVE" | "SEMI_ACTIVE" | "PERMANENT" | "DESTROYED";

export const STATUS_LABEL: Record<string, string> = {
  PENDING:         "En attente",
  ACTIVE:          "Actif",
  SEMI_ACTIVE:     "Intermédiaire",
  PERMANENT:       "Historique",
  DESTROYED:       "Détruit",
  pending:         "En attente",
  validated:       "Actif",
  archived:        "Intermédiaire",
  disposed:        "Détruit",
  actif:           "Actif",
  "intermédiaire": "Intermédiaire",
  historique:      "Historique",
  détruit:         "Détruit",
};

export const STATUS_COLOR: Record<string, "default" | "warning" | "success" | "info" | "secondary" | "error"> = {
  PENDING:         "warning",
  ACTIVE:          "success",
  SEMI_ACTIVE:     "info",
  PERMANENT:       "secondary",
  DESTROYED:       "error",
  pending:         "warning",
  validated:       "success",
  archived:        "info",
  disposed:        "error",
  actif:           "success",
  "intermédiaire": "info",
  historique:      "secondary",
  détruit:         "error",
};

export function normalizeStatus(status: string | undefined, validated?: boolean): NormalizedStatus {
  if (!status) return validated ? "ACTIVE" : "PENDING";
  const map: Record<string, NormalizedStatus> = {
    PENDING: "PENDING", pending: "PENDING",
    ACTIVE: "ACTIVE", validated: "ACTIVE", actif: "ACTIVE",
    SEMI_ACTIVE: "SEMI_ACTIVE", archived: "SEMI_ACTIVE", "intermédiaire": "SEMI_ACTIVE",
    PERMANENT: "PERMANENT", historique: "PERMANENT",
    DESTROYED: "DESTROYED", disposed: "DESTROYED", détruit: "DESTROYED",
  };
  return map[status] ?? "PENDING";
}

function StatusChip({
  status,
  validated,
  size = "small",
}: {
  status?: string;
  validated?: boolean;
  size?: "small" | "medium";
}) {
  const resolved = status ?? (validated ? "ACTIVE" : "PENDING");
  return (
    <Chip
      label={STATUS_LABEL[resolved] ?? resolved}
      color={STATUS_COLOR[resolved] ?? "default"}
      size={size}
      variant="outlined"
    />
  );
}

// ── DUA helpers ────────────────────────────────────────────────────────────────

function computeExpiresAt(startDate: Date, value: number, unit: string): Date {
  const d = new Date(startDate);
  if (unit === "years")  d.setFullYear(d.getFullYear() + value);
  if (unit === "months") d.setMonth(d.getMonth() + value);
  return d;
}

function DuaCell({ row }: { row: Record<string, unknown> }) {
  const status = row.status as string | undefined;
  const dua    = row.dua as { value?: number; unit?: string; sortFinal?: string; startDate?: string } | undefined;
  const norm   = normalizeStatus(status, row.validated as boolean | undefined);
  if (norm !== "SEMI_ACTIVE") return null;

  if (!dua?.value || !dua?.unit || !dua?.startDate) {
    return (
      <Tooltip title="DUA non configurée">
        <Chip
          icon={<AccessTimeOutlinedIcon />}
          label="Non config."
          size="small"
          color="warning"
          variant="outlined"
          sx={{ fontSize: 11 }}
        />
      </Tooltip>
    );
  }

  const start     = new Date(dua.startDate);
  const expiresAt = computeExpiresAt(start, dua.value, dua.unit);
  const now       = new Date();
  const pct       = Math.min(100, Math.max(0, ((now.getTime() - start.getTime()) / (expiresAt.getTime() - start.getTime())) * 100));
  const expired   = now >= expiresAt;
  const daysLeft  = Math.floor((expiresAt.getTime() - now.getTime()) / 86_400_000);
  const label     = expired ? "Expirée"
    : daysLeft < 30  ? `${daysLeft}j`
    : daysLeft < 365 ? `${Math.floor(daysLeft / 30)}m`
    : `${Math.floor(daysLeft / 365)}a`;
  const sortLabel = dua.sortFinal === "conservation" ? "→ Hist." : "→ Elim.";

  return (
    <Tooltip title={`DUA : ${dua.value} ${dua.unit === "years" ? "an(s)" : "mois"} ${sortLabel} — Expire le ${expiresAt.toLocaleDateString("fr-FR")}`}>
      <MuiBox width={90}>
        <MuiBox display="flex" justifyContent="space-between">
          <Typography variant="caption" color={expired ? "error" : "text.secondary"} sx={{ fontSize: 10 }}>
            {label}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>{sortLabel}</Typography>
        </MuiBox>
        <LinearProgress
          variant="determinate"
          value={pct}
          color={pct > 90 || expired ? "error" : pct > 70 ? "warning" : "info"}
          sx={{ height: 4, borderRadius: 2 }}
        />
      </MuiBox>
    </Tooltip>
  );
}

// ── Columns ────────────────────────────────────────────────────────────────────

const columns: GridColDef[] = [
  { field: "designation", headerName: "Désignation", flex: 2, minWidth: 160 },
  { field: "type",        headerName: "Type",         width: 150 },
  { field: "classNumber", headerName: "N° class.",    width: 110 },
  { field: "refNumber",   headerName: "N° réf.",      width: 110 },
  {
    field: "status",
    headerName: "Statut",
    width: 140,
    renderCell: (p) => <StatusChip status={p.row.status as string} validated={p.row.validated as boolean} />,
  },
  {
    field: "dua",
    headerName: "DUA",
    width: 100,
    sortable: false,
    renderCell: (p) => <DuaCell row={p.row} />,
  },
  { field: "createdAt", headerName: "Date", type: "dateTime", width: 150 },
];

// ── Status nav items ───────────────────────────────────────────────────────────

type StatusFilter = "ALL" | NormalizedStatus;

const STATUS_NAV: { key: StatusFilter; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "ALL",         label: "Toutes",         icon: <AllInboxRoundedIcon fontSize="small" />,          color: "text.primary"    },
  { key: "PENDING",     label: "En attente",     icon: <PendingActionsRoundedIcon fontSize="small" />,    color: "warning.main"    },
  { key: "ACTIVE",      label: "Actifs",         icon: <CheckCircleOutlineRoundedIcon fontSize="small" />,color: "success.main"    },
  { key: "SEMI_ACTIVE", label: "Intermédiaires", icon: <ArchiveRoundedIcon fontSize="small" />,           color: "info.main"       },
  { key: "PERMANENT",   label: "Historique",     icon: <MenuBookRoundedIcon fontSize="small" />,          color: "secondary.main"  },
  { key: "DESTROYED",   label: "Détruits",       icon: <DeleteSweepRoundedIcon fontSize="small" />,       color: "error.main"      },
];

// ── Detail panel ───────────────────────────────────────────────────────────────

interface DetailPanelProps {
  doc: Record<string, unknown>;
  canWrite: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
}

function DetailPanel({ doc, canWrite, isAdmin, onClose, onAction }: DetailPanelProps) {
  const norm      = normalizeStatus(doc.status as string | undefined, doc.validated as boolean | undefined);
  const rawStatus = doc.status as string | undefined;
  const dua       = doc.dua as { value?: number; unit?: string; sortFinal?: string; startDate?: string } | undefined;

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

  // ── Icon-row quick actions (admin & write) ────────────────────────────────
  const quickActions: { title: string; icon: React.ReactNode; action: string; color?: "error" | "warning" | "success" | "info" }[] = [
    ...(norm === "PENDING" && canWrite
      ? [{ title: "Valider", icon: <VerifiedOutlinedIcon />, action: "verify", color: "success" as const }]
      : []),
    ...(canWrite ? [{ title: "Modifier", icon: <EditNoteOutlinedIcon />, action: "edit" }] : []),
    ...(canWrite ? [{ title: "Dossier physique", icon: <FolderOpenOutlinedIcon />, action: "link-physical" }] : []),
    ...(norm === "SEMI_ACTIVE" && canWrite
      ? [{ title: "Configurer DUA", icon: <AccessTimeOutlinedIcon />, action: "configure-dua", color: "info" as const }]
      : []),
    ...(canWrite ? [{ title: "Supprimer", icon: <DeleteOutlineOutlinedIcon />, action: "delete", color: "error" as const }] : []),
  ];

  // ── Lifecycle buttons ─────────────────────────────────────────────────────
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
    <MuiBox display="flex" flexDirection="column" height="100%" overflow="hidden">

      {/* Header */}
      <MuiBox
        px={2} py={1.5}
        display="flex" alignItems="flex-start" justifyContent="space-between"
        sx={{ borderBottom: 1, borderColor: "divider", flexShrink: 0 }}
      >
        <MuiBox flex={1} mr={1} minWidth={0}>
          <Typography variant="subtitle2" fontWeight={700} noWrap title={doc.designation as string}>
            {(doc.designation as string) || "—"}
          </Typography>
          <MuiBox display="flex" alignItems="center" gap={0.75} mt={0.5} flexWrap="wrap">
            <StatusChip status={rawStatus} validated={doc.validated as boolean} />
            {Boolean(doc.fileUrl) && (
              <Tooltip title="Ouvrir le fichier">
                <IconButton
                  size="small"
                  onClick={() =>
                    window.open(
                      new URL(
                        doc.fileUrl as string,
                        (import.meta.env.VITE_SERVER_BASE_URL as string) ?? ""
                      ).toString()
                    )
                  }
                >
                  <OpenInNewRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </MuiBox>
        </MuiBox>
        <IconButton size="small" onClick={onClose} sx={{ flexShrink: 0 }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </MuiBox>

      {/* Quick-action icon bar */}
      {quickActions.length > 0 && (
        <MuiBox
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
        </MuiBox>
      )}

      {/* Scrollable body */}
      <MuiBox flex={1} overflow="auto" sx={{ ...scrollBarSx }}>

        {/* Metadata */}
        <MuiBox px={2} py={1.5}>
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
            <MuiBox mb={1}>
              <Typography variant="caption" color="text.secondary">Mots-clés</Typography>
              <MuiBox display="flex" flexWrap="wrap" gap={0.5} mt={0.25}>
                {(doc.tags as string[]).map((t) => (
                  <Chip key={t} label={t} size="small" variant="outlined" />
                ))}
              </MuiBox>
            </MuiBox>
          )}
        </MuiBox>

        {/* DUA section */}
        {norm === "SEMI_ACTIVE" && (
          <>
            <Divider />
            <MuiBox px={2} py={1.5}>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                DUA &mdash; Durée d&apos;Utilité Administrative
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
            </MuiBox>
          </>
        )}

        {/* Lifecycle transitions */}
        {lifecycleActions.length > 0 && (
          <>
            <Divider />
            <MuiBox px={2} py={1.5}>
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
            </MuiBox>
          </>
        )}

        {/* Lifecycle history */}
        {history.length > 0 && (
          <>
            <Divider />
            <MuiBox px={2} py={1.5}>
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
                    <MuiBox key={i} display="flex" alignItems="center" gap={1}>
                      <MuiBox sx={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, bgcolor: dotColor }} />
                      <MuiBox flex={1}>
                        <Typography variant="caption" fontWeight={500}>
                          {STATUS_LABEL[h.status] ?? h.status}
                        </Typography>
                        {h.changedAt && (
                          <Typography variant="caption" color="text.disabled" display="block">
                            {new Date(h.changedAt).toLocaleDateString("fr-FR")}
                          </Typography>
                        )}
                      </MuiBox>
                    </MuiBox>
                  );
                })}
              </Stack>
            </MuiBox>
          </>
        )}
      </MuiBox>
    </MuiBox>
  );
}

function DetailRow({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <MuiBox mb={1}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" noWrap={!multiline} sx={multiline ? { whiteSpace: "pre-wrap" } : undefined}>
        {value}
      </Typography>
    </MuiBox>
  );
}

// ── Toolbar ────────────────────────────────────────────────────────────────────

interface ArchiveToolbarProps {
  canWrite: boolean;
  onAdd: () => void;
  selectedCount: number;
  onBulkDelete: () => void;
}

const ArchiveManagementHeader = React.memo(function ArchiveManagementHeader({
  canWrite,
  onAdd,
  selectedCount,
  onBulkDelete,
}: ArchiveToolbarProps) {
  return (
    <Toolbar sx={{ gap: 1, flexWrap: "wrap", py: 0.5, minHeight: "unset" }}>
      <NavigationMenuButton hide IconProps={{ sx: { transform: "rotate(-180deg)" } }} />
      <GridToolbarColumnsButton slotProps={{ button: { variant: "outlined", color: "inherit", size: "small" } }} />
      <GridToolbarFilterButton  slotProps={{ button: { variant: "outlined", color: "inherit", size: "small" } }} />
      <MuiBox flex={1} />
      <GridToolbarQuickFilter size="small" sx={{ "& .MuiInputBase-root": { borderRadius: 1 } }} />
      {selectedCount > 1 && canWrite && (
        <Button
          variant="outlined"
          size="small"
          color="error"
          startIcon={<DeleteOutlineOutlinedIcon />}
          onClick={onBulkDelete}
        >
          Supprimer ({selectedCount})
        </Button>
      )}
      {/* Ajouter visible sur mobile seulement — sur desktop c'est dans la sidebar */}
      {canWrite && (
        <Button
          variant="contained"
          size="small"
          startIcon={<AddRoundedIcon />}
          onClick={onAdd}
          disableElevation
          sx={{ display: { xs: "flex", md: "none" } }}
        >
          Ajouter
        </Button>
      )}
    </Toolbar>
  );
});

// ── Main component ─────────────────────────────────────────────────────────────

export default function ArchiveManagementContent() {
  const Authorization = useToken();
  const dispatch      = useDispatch<AppDispatch>();
  const { enqueueSnackbar } = useSnackbar();
  const { canWrite, isAdmin } = useArchivePermissions();
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const dataVersion      = useSelector((store: RootState) => store.data.dataVersion);
  const selectedElements = useSelector(
    (store: RootState) => store.data.navigation.archiveManagement.selectedElements
  );

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [quickFilter,  setQuickFilter]  = useState<"dua_expired" | "this_month" | null>(null);
  const [focusedId,    setFocusedId]    = useState<string | null>(null);
  const [detailOpen,   setDetailOpen]   = useState(false);

  const [{ data, loading }, refetch] = useAxios<Archive[]>({
    url: "/api/stuff/archives/archived",
    headers: { Authorization },
  });

  const [, execLifecycle] = useAxios({ method: "PATCH", headers: { Authorization } }, { manual: true });
  const [, execDelete]    = useAxios({ method: "DELETE", headers: { Authorization } }, { manual: true });

  // Sync data → Redux store
  useEffect(() => {
    if (data) {
      dispatch(
        updateData({
          data: {
            docs: (data as Archive[]).map((doc) => ({ ...doc, id: doc._id })) as unknown as ArchiveDocument[],
          },
        })
      );
    }
  }, [data, dispatch]);

  useEffect(() => {
    if (dataVersion > 0) refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVersion]);

  // Lifecycle event bus (PATCH)
  useEffect(() => {
    const root = document.getElementById("root");
    const handler = async (e: Event) => {
      const { id, targetStatus } = (e as CustomEvent).detail as { id: string; targetStatus: string };
      try {
        await execLifecycle({ url: `/api/stuff/archives/${id}/lifecycle`, data: { targetStatus } });
        dispatch(incrementVersion());
        const lifecycleMsgs: Record<string, { title: string; msg: string }> = {
          ACTIVE:      { title: "Archive réactivée",          msg: "L'archive est de nouveau active. Elle reprend son cycle de vie normal." },
          SEMI_ACTIVE: { title: "Passage en intermédiaire",   msg: "L'archive est maintenant en phase intermédiaire. Pensez à configurer sa DUA pour planifier son sort final." },
          PERMANENT:   { title: "Classée en historique",      msg: "L'archive a été classée définitivement en historique. Elle sera conservée à titre permanent." },
          DESTROYED:   { title: "Archive éliminée",           msg: "L'archive a été éliminée. Cette action est irréversible — assurez-vous d'avoir conservé les documents nécessaires." },
        };
        const lm = lifecycleMsgs[targetStatus];
        enqueueSnackbar(lm?.msg ?? `Statut mis à jour : ${STATUS_LABEL[targetStatus] ?? targetStatus}`, {
          variant: "success",
          title: lm?.title ?? "Cycle de vie mis à jour",
        });
        setDetailOpen(false);
      } catch {
        enqueueSnackbar("Le changement de statut a échoué. Vérifiez votre connexion et réessayez. Si le problème persiste, contactez l'administrateur.", { variant: "error", title: "Changement de statut impossible" });
      }
    };
    root?.addEventListener("__lifecycle_archive", handler);
    return () => root?.removeEventListener("__lifecycle_archive", handler);
  }, [execLifecycle, dispatch, enqueueSnackbar]);

  // ── Rows ──────────────────────────────────────────────────────

  type RowType = Archive & { id: string; type: string; createdAt: Date | null };

  const allRows = useMemo(
    () =>
      (data as Archive[])?.map((doc) => ({
        ...doc,
        id:        doc._id,
        type:      (doc.type as { type?: string })?.type ?? "",
        createdAt: doc.createdAt ? new Date(doc.createdAt as string) : null,
      } as RowType)) ?? [],
    [data]
  );

  const statusCounts = useMemo(() => {
    const counts: Record<NormalizedStatus, number> = {
      PENDING: 0, ACTIVE: 0, SEMI_ACTIVE: 0, PERMANENT: 0, DESTROYED: 0,
    };
    allRows.forEach((r) =>
      counts[normalizeStatus(r.status as string | undefined, r.validated as boolean | undefined)]++
    );
    return counts;
  }, [allRows]);

  const duaExpiredCount = useMemo(
    () =>
      allRows.filter((r) => {
        if (normalizeStatus(r.status as string | undefined, r.validated as boolean | undefined) !== "SEMI_ACTIVE") return false;
        const dua = r.dua as { value?: number; unit?: string; startDate?: string } | undefined;
        if (!dua?.value || !dua?.unit || !dua?.startDate) return false;
        return Date.now() >= computeExpiresAt(new Date(dua.startDate), dua.value, dua.unit).getTime();
      }).length,
    [allRows]
  );

  const thisMonthCount = useMemo(() => {
    const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    return allRows.filter((r) => r.createdAt && new Date(r.createdAt as string) >= start).length;
  }, [allRows]);

  // ── Accès rapide : 5 archives les plus récentes ────────────
  const recentArchives = useMemo(() =>
    [...allRows]
      .sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt as string).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt as string).getTime() : 0;
        return db - da;
      })
      .slice(0, 5),
    [allRows]
  );

  const rows = useMemo(() => {
    let base =
      statusFilter === "ALL"
        ? allRows
        : allRows.filter(
            (r) =>
              normalizeStatus(r.status as string | undefined, r.validated as boolean | undefined) === statusFilter
          );

    if (quickFilter === "dua_expired") {
      base = base.filter((r) => {
        if (normalizeStatus(r.status as string | undefined, r.validated as boolean | undefined) !== "SEMI_ACTIVE") return false;
        const dua = r.dua as { value?: number; unit?: string; startDate?: string } | undefined;
        if (!dua?.value || !dua?.unit || !dua?.startDate) return false;
        return Date.now() >= computeExpiresAt(new Date(dua.startDate), dua.value, dua.unit).getTime();
      });
    }
    if (quickFilter === "this_month") {
      const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      base = base.filter((r) => r.createdAt && new Date(r.createdAt as string) >= start);
    }
    return base;
  }, [allRows, statusFilter, quickFilter]);

  // ── Export CSV de la liste filtrée courante ─────────────────
  const exportCSV = useCallback(() => {
    const cols = [
      { key: "designation",   label: "Désignation" },
      { key: "classNumber",   label: "N° de classe" },
      { key: "refNumber",     label: "N° référence" },
      { key: "folder",        label: "Dossier" },
      { key: "status",        label: "Statut" },
      { key: "createdAt",     label: "Date création" },
    ];
    const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = cols.map((c) => escape(c.label)).join(";");
    const body = rows.map((r) =>
      cols.map((c) => {
        const raw = (r as Record<string, unknown>)[c.key];
        if (c.key === "status") return escape(STATUS_LABEL[normalizeStatus(r.status as string | undefined, r.validated as boolean | undefined)] ?? raw);
        if (c.key === "createdAt" && raw) return escape(new Date(raw as string).toLocaleDateString("fr-FR"));
        return escape(raw);
      }).join(";")
    ).join("\n");
    const csv = "\uFEFF" + header + "\n" + body; // BOM UTF-8 pour Excel
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `archives_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [rows]);

  const focusedDoc = useMemo(
    () =>
      focusedId
        ? (allRows.find((r) => r.id === focusedId) as Record<string, unknown> | undefined)
        : undefined,
    [focusedId, allRows]
  );

  const totalCount = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  // ── Handlers ──────────────────────────────────────────────────

  const handleRowClick = useCallback((params: GridRowParams) => {
    setFocusedId(params.id as string);
    setDetailOpen(true);
  }, []);

  const handleSelectionChange = useCallback(
    (selectionModel: GridRowSelectionModel) => {
      dispatch(
        updateData({
          data: {
            navigation: {
              archiveManagement: { selectedElements: [...selectionModel] as string[] },
            } as unknown as NavigationState,
          },
        })
      );
    },
    [dispatch]
  );

  const handleAction = useCallback(
    async (action: string) => {
      const id  = focusedId ?? (selectedElements as string[])[0];
      const doc = focusedDoc;

      switch (action) {
        case "verify":
          document.getElementById("root")?.dispatchEvent(
            new CustomEvent("__validate_archive_doc", { detail: { doc: id, name: "__validate_archive_doc" } })
          );
          break;
        case "edit":
          if (doc)
            document.getElementById("root")?.dispatchEvent(
              new CustomEvent("__edit_archive_doc", { detail: { doc } })
            );
          break;
        case "link-physical":
          if (doc)
            document.getElementById("root")?.dispatchEvent(
              new CustomEvent("__link_physical_record", { detail: { doc } })
            );
          break;
        case "configure-dua":
          if (doc)
            document.getElementById("root")?.dispatchEvent(
              new CustomEvent("__configure_dua", { detail: { doc } })
            );
          break;
        case "to-semi-active":
          document.getElementById("root")?.dispatchEvent(
            new CustomEvent("__lifecycle_archive", { detail: { id, targetStatus: "SEMI_ACTIVE" } })
          );
          break;
        case "reactivate":
          document.getElementById("root")?.dispatchEvent(
            new CustomEvent("__lifecycle_archive", { detail: { id, targetStatus: "ACTIVE" } })
          );
          break;
        case "to-permanent":
          document.getElementById("root")?.dispatchEvent(
            new CustomEvent("__lifecycle_archive", { detail: { id, targetStatus: "PERMANENT" } })
          );
          break;
        case "to-destroyed":
          document.getElementById("root")?.dispatchEvent(
            new CustomEvent("__lifecycle_archive", { detail: { id, targetStatus: "DESTROYED" } })
          );
          break;
        case "restore":
          document.getElementById("root")?.dispatchEvent(
            new CustomEvent("__lifecycle_archive", { detail: { id, targetStatus: "PERMANENT" } })
          );
          break;
        case "delete":
          document.getElementById("root")?.dispatchEvent(
            new CustomEvent("__delete_archive_docs", { detail: { ids: [id] } })
          );
          setDetailOpen(false);
          setFocusedId(null);
          break;
      }
    },
    [focusedId, focusedDoc, selectedElements]
  );

  const handleBulkDelete = useCallback(async () => {
    const ids = selectedElements as string[];
    if (!ids.length) return;
    if (ids.length === 1) {
      document.getElementById("root")?.dispatchEvent(
        new CustomEvent("__delete_archive_docs", { detail: { ids } })
      );
      setDetailOpen(false);
      setFocusedId(null);
      return;
    }
    try {
      await Promise.all(ids.map((docId) => execDelete({ url: `/api/stuff/archives/${docId}` })));
      dispatch(incrementVersion());
      enqueueSnackbar(
        `Les ${ids.length} archives sélectionnées ont été supprimées définitivement. Elles ne peuvent plus être récupérées.`,
        { variant: "success", title: "Suppression groupée effectuée" }
      );
    } catch {
      enqueueSnackbar(
        "Certaines suppressions ont échoué. Les archives concernées n'ont pas été modifiées. Vérifiez vos droits et réessayez.",
        { variant: "error", title: "Suppression partielle" }
      );
    }
  }, [selectedElements, execDelete, dispatch, enqueueSnackbar]);

  const openAdd = useCallback(() => {
    document.getElementById("root")?.dispatchEvent(
      new CustomEvent("__open_archive_create", { detail: {} })
    );
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setFocusedId(null);
  }, []);

  // ── Render ────────────────────────────────────────────────────

  return (
    <MuiBox display="flex" flex={1} height="100%" overflow="hidden">

      {/* ── Sidebar gauche (md+) ──────────────────────────────── */}
      <MuiBox
        sx={{
          width: 200,
          flexShrink: 0,
          borderRight: 1,
          borderColor: "divider",
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Boutons Ajouter + Rechercher + Exporter */}
        <MuiBox px={1.5} pt={1.5} pb={0.75} display="flex" gap={1}>
          {canWrite && (
            <Button
              variant="contained"
              size="small"
              fullWidth
              startIcon={<AddRoundedIcon />}
              onClick={openAdd}
              disableElevation
            >
              Ajouter
            </Button>
          )}
          <Tooltip title="Recherche globale (Ctrl+K)" placement="right">
            <IconButton
              size="small"
              onClick={() => {
                document.getElementById("root")?.dispatchEvent(
                  new CustomEvent("__global_search_open")
                );
              }}
              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
              <SearchRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={`Exporter la liste en CSV (${rows.length} ligne${rows.length !== 1 ? "s" : ""})`} placement="right">
            <IconButton
              size="small"
              onClick={exportCSV}
              disabled={rows.length === 0}
              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
              <FileDownloadOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </MuiBox>

        {/* Filtres scrollables */}
        <MuiBox flex={1} overflow="auto" sx={{ ...scrollBarSx, pt: canWrite ? 0.5 : 1 }}>
          <List dense disablePadding>
            {STATUS_NAV.map(({ key, label, icon, color }) => {
              const count    = key === "ALL" ? totalCount : statusCounts[key] ?? 0;
              const isActive = statusFilter === key && quickFilter === null;
              return (
                <ListItemButton
                  key={key}
                  selected={isActive}
                  onClick={() => { setStatusFilter(key); setQuickFilter(null); }}
                  sx={{ borderRadius: 1, mx: 0.5, my: 0.125, py: 0.75 }}
                >
                  <ListItemIcon sx={{ minWidth: 28, color: isActive ? undefined : color }}>
                    {icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    primaryTypographyProps={{ variant: "body2", noWrap: true }}
                  />
                  {count > 0 && (
                    <Chip
                      label={count}
                      size="small"
                      color={key === "PENDING" ? "warning" : "default"}
                      sx={{ height: 18, fontSize: 11, ".MuiChip-label": { px: 0.75 } }}
                    />
                  )}
                </ListItemButton>
              );
            })}
          </List>

          {/* Filtres rapides */}
          <Divider sx={{ mx: 1, my: 0.75 }} />
          <List dense disablePadding>
            <ListItemButton
              selected={quickFilter === "dua_expired"}
              onClick={() => {
                setQuickFilter((q) => (q === "dua_expired" ? null : "dua_expired"));
                setStatusFilter("ALL");
              }}
              sx={{ borderRadius: 1, mx: 0.5, my: 0.125, py: 0.75 }}
            >
              <ListItemIcon sx={{ minWidth: 28, color: quickFilter === "dua_expired" ? undefined : "error.main" }}>
                <AlarmRoundedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="DUA expirées" primaryTypographyProps={{ variant: "body2", noWrap: true }} />
              {duaExpiredCount > 0 && (
                <Chip
                  label={duaExpiredCount}
                  size="small"
                  color="error"
                  sx={{ height: 18, fontSize: 11, ".MuiChip-label": { px: 0.75 } }}
                />
              )}
            </ListItemButton>

            <ListItemButton
              selected={quickFilter === "this_month"}
              onClick={() => {
                setQuickFilter((q) => (q === "this_month" ? null : "this_month"));
                setStatusFilter("ALL");
              }}
              sx={{ borderRadius: 1, mx: 0.5, my: 0.125, py: 0.75 }}
            >
              <ListItemIcon sx={{ minWidth: 28, color: quickFilter === "this_month" ? undefined : "text.secondary" }}>
                <CalendarTodayRoundedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Ce mois" primaryTypographyProps={{ variant: "body2", noWrap: true }} />
              {thisMonthCount > 0 && (
                <Chip
                  label={thisMonthCount}
                  size="small"
                  sx={{ height: 18, fontSize: 11, ".MuiChip-label": { px: 0.75 } }}
                />
              )}
            </ListItemButton>
          </List>
        </MuiBox>

        {/* ── Accès rapide : 5 dernières archives ────────────── */}
        {recentArchives.length > 0 && (
          <>
            <Divider sx={{ mx: 1, my: 0.75 }} />
            <MuiBox px={1} pb={0.5}>
              <MuiBox display="flex" alignItems="center" gap={0.5} px={0.5} pb={0.25}>
                <BoltRoundedIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                <Typography variant="caption" color="text.disabled" fontWeight="bold" textTransform="uppercase" letterSpacing={0.5}>
                  Récents
                </Typography>
              </MuiBox>
              <List dense disablePadding>
                {recentArchives.map((r) => {
                  const norm = normalizeStatus(r.status as string | undefined, r.validated as boolean | undefined);
                  const isFocused = focusedId === r.id;
                  return (
                    <ListItemButton
                      key={r.id}
                      selected={isFocused}
                      onClick={() => { setFocusedId(r.id as string); setDetailOpen(true); }}
                      sx={{ borderRadius: 1, mx: 0, my: 0.125, py: 0.5, px: 0.75 }}>
                      <MuiBox
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          bgcolor: `${STATUS_COLOR[norm]}.main`,
                          flexShrink: 0,
                          mr: 0.75,
                        }}
                      />
                      <ListItemText
                        primary={(r as Record<string, unknown>).designation as string ?? r.id}
                        primaryTypographyProps={{ variant: "caption", noWrap: true }}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            </MuiBox>
          </>
        )}

        {/* Pied de sidebar — statistiques */}
        <Divider />
        <MuiBox px={2} py={1.25}>
          <Typography variant="caption" color="text.disabled" display="block">
            {totalCount} archive{totalCount !== 1 ? "s" : ""}
          </Typography>
          {statusCounts.PENDING > 0 && (
            <Typography variant="caption" color="warning.main" display="block">
              {statusCounts.PENDING} en attente de validation
            </Typography>
          )}
          {duaExpiredCount > 0 && (
            <Typography variant="caption" color="error.main" display="block">
              {duaExpiredCount} DUA expirée{duaExpiredCount !== 1 ? "s" : ""}
            </Typography>
          )}
        </MuiBox>
      </MuiBox>

      {/* ── Colonne centrale ──────────────────────────────────── */}
      <MuiBox display="flex" flexDirection="column" flex={1} overflow="hidden" minWidth={0}>

        {/* Chips de filtre — mobile uniquement */}
        <MuiBox
          sx={{
            display: { xs: "flex", md: "none" },
            gap: 0.75,
            px: 1.5,
            py: 0.75,
            overflow: "auto",
            flexShrink: 0,
            borderBottom: 1,
            borderColor: "divider",
            ...scrollBarSx,
          }}
        >
          {STATUS_NAV.map(({ key, label }) => {
            const count  = key === "ALL" ? totalCount : statusCounts[key] ?? 0;
            const active = statusFilter === key && quickFilter === null;
            return (
              <Chip
                key={key}
                label={count > 0 ? `${label} (${count})` : label}
                size="small"
                variant={active ? "filled" : "outlined"}
                color={key === "PENDING" ? "warning" : active ? "primary" : "default"}
                onClick={() => { setStatusFilter(key); setQuickFilter(null); }}
                sx={{ flexShrink: 0, cursor: "pointer" }}
              />
            );
          })}
          {duaExpiredCount > 0 && (
            <Chip
              label={`DUA exp. (${duaExpiredCount})`}
              size="small"
              variant={quickFilter === "dua_expired" ? "filled" : "outlined"}
              color="error"
              onClick={() => {
                setQuickFilter((q) => (q === "dua_expired" ? null : "dua_expired"));
                setStatusFilter("ALL");
              }}
              sx={{ flexShrink: 0, cursor: "pointer" }}
            />
          )}
        </MuiBox>

        {/* DataGrid — remplit tout l'espace restant */}
        <MuiBox flex={1} position="relative" overflow="hidden" minHeight={0}>
          <MuiBox position="absolute" top={0} left={0} right={0} bottom={0}>
            <DataGrid
              rows={rows}
              loading={loading}
              columns={columns}
              checkboxSelection
              rowSelectionModel={selectedElements as string[]}
              onRowSelectionModelChange={handleSelectionChange}
              onRowClick={handleRowClick}
              showCellVerticalBorder={false}
              showColumnVerticalBorder={false}
              pageSizeOptions={[25, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
              sx={{
                border: "none",
                "& .MuiDataGrid-cell":        { outline: "none", border: "none" },
                "& .MuiDataGrid-cell:focus":  { outline: "none" },
                "& .MuiDataGrid-row":         { cursor: "pointer" },
                "& *":                        scrollBarSx as Record<string, unknown>,
              }}
              disableDensitySelector
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              slots={{ toolbar: ArchiveManagementHeader as any }}
              slotProps={{
                toolbar: {
                  canWrite,
                  onAdd:         openAdd,
                  selectedCount: (selectedElements as string[]).length,
                  onBulkDelete:  handleBulkDelete,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any,
              }}
              localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
            />
          </MuiBox>
        </MuiBox>
      </MuiBox>

      {/* ── Panneau détail — desktop (inline) ────────────────── */}
      {detailOpen && !!focusedDoc && !isMobile && (
        <MuiBox
          sx={{
            width: 300,
            flexShrink: 0,
            borderLeft: 1,
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            height: "100%",
          }}
        >
          <DetailPanel
            doc={focusedDoc}
            canWrite={canWrite}
            isAdmin={isAdmin}
            onClose={closeDetail}
            onAction={handleAction}
          />
        </MuiBox>
      )}

      {/* ── Panneau détail — mobile (bottom drawer) ──────────── */}
      <Drawer
        anchor="bottom"
        open={detailOpen && !!focusedDoc && isMobile}
        onClose={closeDetail}
        PaperProps={{
          sx: {
            maxHeight: "72vh",
            borderRadius: "12px 12px 0 0",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {focusedDoc && (
          <DetailPanel
            doc={focusedDoc}
            canWrite={canWrite}
            isAdmin={isAdmin}
            onClose={closeDetail}
            onAction={handleAction}
          />
        )}
      </Drawer>
    </MuiBox>
  );
}
