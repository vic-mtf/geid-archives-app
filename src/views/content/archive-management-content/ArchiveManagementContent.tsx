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
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import UnarchiveOutlinedIcon from "@mui/icons-material/UnarchiveOutlined";
import HistoryEduOutlinedIcon from "@mui/icons-material/HistoryEduOutlined";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";
import RestoreOutlinedIcon from "@mui/icons-material/RestoreOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import AllInboxRoundedIcon from "@mui/icons-material/AllInboxRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import DeleteSweepRoundedIcon from "@mui/icons-material/DeleteSweepRounded";
import {
  DataGrid,
  GridColDef,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
  GridRowSelectionModel,
} from "@mui/x-data-grid";
import { frFR } from "@mui/x-data-grid/locales";
import useAxios from "../../../hooks/useAxios";
import useToken from "../../../hooks/useToken";
import useArchivePermissions from "../../../hooks/useArchivePermissions";
import type { Archive, ArchiveDocument, NavigationState } from "../../../types";
import scrollBarSx from "../../../utils/scrollBarSx";
import NavigationMenuButton from "../../navigation/NavigationMenuButton";
import { useSnackbar } from "notistack";
import formatDate from "../../../utils/formatTime";

// ── Lifecycle helpers ─────────────────────────────────────────

export type NormalizedStatus = "PENDING" | "ACTIVE" | "SEMI_ACTIVE" | "PERMANENT" | "DESTROYED";

export const STATUS_LABEL: Record<string, string> = {
  PENDING:      "En attente",
  ACTIVE:       "Actif",
  SEMI_ACTIVE:  "Intermédiaire",
  PERMANENT:    "Historique",
  DESTROYED:    "Détruit",
  pending:      "En attente",
  validated:    "Actif",
  archived:     "Intermédiaire",
  disposed:     "Détruit",
  actif:        "Actif",
  "intermédiaire": "Intermédiaire",
  historique:   "Historique",
  détruit:      "Détruit",
};

export const STATUS_COLOR: Record<string, "default" | "warning" | "success" | "info" | "secondary" | "error"> = {
  PENDING:      "warning",
  ACTIVE:       "success",
  SEMI_ACTIVE:  "info",
  PERMANENT:    "secondary",
  DESTROYED:    "error",
  pending:      "warning",
  validated:    "success",
  archived:     "info",
  disposed:     "error",
  actif:        "success",
  "intermédiaire": "info",
  historique:   "secondary",
  détruit:      "error",
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

function StatusChip({ status, validated, size = "small" }: { status?: string; validated?: boolean; size?: "small" | "medium" }) {
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

// ── DUA progress inline ───────────────────────────────────────

function computeExpiresAt(startDate: Date, value: number, unit: string): Date {
  const d = new Date(startDate);
  if (unit === "years")  d.setFullYear(d.getFullYear() + value);
  if (unit === "months") d.setMonth(d.getMonth() + value);
  return d;
}

function DuaCell({ row }: { row: Record<string, unknown> }) {
  const status = row.status as string | undefined;
  const dua    = row.dua as { value?: number; unit?: string; sortFinal?: string; startDate?: string } | undefined;

  const norm = normalizeStatus(status, row.validated as boolean | undefined);
  if (norm !== "SEMI_ACTIVE") return null;

  if (!dua?.value || !dua?.unit || !dua?.startDate) {
    return (
      <Tooltip title="DUA non configurée">
        <Chip icon={<AccessTimeOutlinedIcon />} label="DUA non config." size="small" color="warning" variant="outlined" sx={{ fontSize: 11 }} />
      </Tooltip>
    );
  }

  const startDate = new Date(dua.startDate);
  const expiresAt = computeExpiresAt(startDate, dua.value, dua.unit);
  const now       = new Date();
  const pct       = Math.min(100, Math.max(0, ((now.getTime() - startDate.getTime()) / (expiresAt.getTime() - startDate.getTime())) * 100));
  const expired   = now >= expiresAt;
  const daysLeft  = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const label     = expired ? "Expirée" : daysLeft < 30 ? `${daysLeft}j` : daysLeft < 365 ? `${Math.floor(daysLeft / 30)}m` : `${Math.floor(daysLeft / 365)}a`;
  const sortLabel = dua.sortFinal === "conservation" ? "→ Hist." : "→ Elim.";

  return (
    <Tooltip title={`DUA : ${dua.value} ${dua.unit === "years" ? "an(s)" : "mois"} ${sortLabel}\nExpire le : ${expiresAt.toLocaleDateString("fr-FR")}`}>
      <MuiBox width={90}>
        <MuiBox display="flex" justifyContent="space-between">
          <Typography variant="caption" color={expired ? "error" : "text.secondary"} sx={{ fontSize: 10 }}>{expired ? "Expirée" : label}</Typography>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>{sortLabel}</Typography>
        </MuiBox>
        <LinearProgress variant="determinate" value={pct} color={pct > 90 || expired ? "error" : pct > 70 ? "warning" : "info"} sx={{ height: 4, borderRadius: 2 }} />
      </MuiBox>
    </Tooltip>
  );
}

// ── Columns ───────────────────────────────────────────────────

const columns: GridColDef[] = [
  { field: "designation", headerName: "Désignation", flex: 2, minWidth: 180 },
  { field: "type",        headerName: "Type",         width: 160 },
  { field: "classNumber", headerName: "N° class.",    width: 120 },
  { field: "refNumber",   headerName: "N° réf.",      width: 120 },
  {
    field: "status",
    headerName: "Statut",
    width: 140,
    renderCell: (params) => (
      <StatusChip status={params.row.status as string} validated={params.row.validated as boolean} />
    ),
  },
  {
    field: "dua",
    headerName: "DUA",
    width: 105,
    sortable: false,
    renderCell: (params) => <DuaCell row={params.row} />,
  },
  { field: "createdAt", headerName: "Date", type: "dateTime", width: 150 },
];

// ── Status navigation panel ───────────────────────────────────

type StatusFilter = "ALL" | NormalizedStatus;

const STATUS_NAV: { key: StatusFilter; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "ALL",         label: "Toutes",         icon: <AllInboxRoundedIcon fontSize="small" />,           color: "text.primary" },
  { key: "PENDING",     label: "En attente",     icon: <PendingActionsRoundedIcon fontSize="small" />,     color: "warning.main" },
  { key: "ACTIVE",      label: "Actifs",         icon: <CheckCircleOutlineRoundedIcon fontSize="small" />, color: "success.main" },
  { key: "SEMI_ACTIVE", label: "Intermédiaires", icon: <ArchiveRoundedIcon fontSize="small" />,            color: "info.main" },
  { key: "PERMANENT",   label: "Historique",     icon: <MenuBookRoundedIcon fontSize="small" />,           color: "secondary.main" },
  { key: "DESTROYED",   label: "Détruits",       icon: <DeleteSweepRoundedIcon fontSize="small" />,        color: "error.main" },
];

// ── Detail side panel ─────────────────────────────────────────

interface DetailPanelProps {
  doc: Record<string, unknown>;
  canWrite: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
}

function DetailPanel({ doc, canWrite, isAdmin, onClose, onAction }: DetailPanelProps) {
  const norm = normalizeStatus(doc.status as string | undefined, doc.validated as boolean | undefined);
  const rawStatus = doc.status as string | undefined;
  const dua = doc.dua as { value?: number; unit?: string; sortFinal?: string; startDate?: string } | undefined;

  // DUA progress for SEMI_ACTIVE
  let duaExpired = false;
  let duaPct = 0;
  let duaExpiry: Date | null = null;
  if (norm === "SEMI_ACTIVE" && dua?.value && dua?.unit && dua?.startDate) {
    duaExpiry  = computeExpiresAt(new Date(dua.startDate), dua.value, dua.unit);
    duaPct     = Math.min(100, Math.max(0, ((new Date().getTime() - new Date(dua.startDate).getTime()) / (duaExpiry.getTime() - new Date(dua.startDate).getTime())) * 100));
    duaExpired = new Date() >= duaExpiry;
  }

  const history = (doc.lifecycleHistory as Array<{ status: string; changedAt?: string; note?: string }> | undefined) ?? [];

  const actions: { label: string; icon: React.ReactNode; color?: "inherit" | "error"; action: string; disabled?: boolean }[] = [
    ...(norm === "PENDING" ? [{ label: "Valider", icon: <VerifiedOutlinedIcon />, action: "verify" }] : []),
    { label: "Modifier", icon: <EditNoteOutlinedIcon />, action: "edit" },
    { label: "Dossier physique", icon: <FolderOpenOutlinedIcon />, action: "link-physical" },
    ...(norm === "SEMI_ACTIVE" ? [{ label: "Configurer DUA", icon: <AccessTimeOutlinedIcon />, action: "configure-dua" }] : []),
    ...(norm === "ACTIVE" ? [{ label: "Passer en intermédiaire", icon: <ArchiveOutlinedIcon />, action: "to-semi-active" }] : []),
    ...(norm === "SEMI_ACTIVE" ? [{ label: "Réactiver", icon: <UnarchiveOutlinedIcon />, action: "reactivate" }] : []),
    ...(norm === "SEMI_ACTIVE" ? [{ label: "Archiver (historique)", icon: <HistoryEduOutlinedIcon />, action: "to-permanent" }] : []),
    ...(isAdmin && (norm === "SEMI_ACTIVE" || norm === "PERMANENT")
      ? [{ label: "Éliminer", icon: <DeleteForeverOutlinedIcon />, color: "error" as const, action: "to-destroyed" }]
      : []),
    ...(isAdmin && norm === "DESTROYED" ? [{ label: "Restaurer", icon: <RestoreOutlinedIcon />, action: "restore" }] : []),
    { label: "Supprimer définitivement", icon: <DeleteOutlineOutlinedIcon />, color: "error" as const, action: "delete" },
  ];

  return (
    <MuiBox display="flex" flexDirection="column" height="100%" overflow="hidden">
      {/* Header */}
      <MuiBox px={2} py={1.5} display="flex" alignItems="flex-start" justifyContent="space-between" borderBottom={1} borderColor="divider">
        <MuiBox flex={1} mr={1}>
          <Typography variant="subtitle1" fontWeight={700} noWrap title={doc.designation as string}>
            {doc.designation as string || "—"}
          </Typography>
          <MuiBox display="flex" alignItems="center" gap={0.75} mt={0.5}>
            <StatusChip status={rawStatus} validated={doc.validated as boolean} />
            {Boolean(doc.fileUrl) && (
              <Tooltip title="Ouvrir le fichier">
                <IconButton
                  size="small"
                  onClick={() => window.open(new URL(doc.fileUrl as string, import.meta.env.VITE_SERVER_BASE_URL as string))}
                >
                  <OpenInNewRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </MuiBox>
        </MuiBox>
        <IconButton size="small" onClick={onClose}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </MuiBox>

      {/* Scrollable body */}
      <MuiBox flex={1} overflow="auto" sx={{ ...scrollBarSx }}>
        {/* Metadata */}
        <MuiBox px={2} py={1.5}>
          <DetailRow label="Type" value={(doc.type as string) || "—"} />
          <DetailRow label="N° classement" value={(doc.classNumber as string) || "—"} />
          <DetailRow label="N° référence" value={(doc.refNumber as string) || "—"} />
          <DetailRow label="Description" value={(doc.description as string) || "—"} multiline />
          <DetailRow label="Créé le" value={doc.createdAt ? formatDate(doc.createdAt as string) : "—"} />
          {Boolean(doc.folder) && (
            <DetailRow label="Dossier/Activité" value={
              (typeof doc.folder === "object" && doc.folder !== null
                ? ((doc.folder as Record<string, unknown>).name as string)
                : String(doc.folder)) || "—"
            } />
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
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>DUA — Durée d'Utilité Administrative</Typography>
              {!dua?.value ? (
                <Chip icon={<AccessTimeOutlinedIcon />} label="DUA non configurée" size="small" color="warning" variant="outlined" />
              ) : (
                <>
                  <Typography variant="body2" mb={0.5}>
                    {dua.value} {dua.unit === "years" ? "an(s)" : "mois"}
                    {" · "}
                    Sort : <strong>{dua.sortFinal === "conservation" ? "Historique" : "Élimination"}</strong>
                  </Typography>
                  {duaExpiry && (
                    <Typography variant="caption" color={duaExpired ? "error.main" : "text.secondary"} display="block" mb={0.5}>
                      Expire le {duaExpiry.toLocaleDateString("fr-FR")}
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

        {/* Lifecycle history */}
        {history.length > 0 && (
          <>
            <Divider />
            <MuiBox px={2} py={1.5}>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>Historique du cycle de vie</Typography>
              <Stack spacing={0.5}>
                {[...history].reverse().slice(0, 6).map((h, i) => (
                  <MuiBox key={i} display="flex" alignItems="center" gap={1}>
                    <MuiBox
                      sx={{
                        width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                        bgcolor: h.status === "ACTIVE" || h.status === "actif" || h.status === "validated" ? "success.main"
                          : h.status === "PENDING" || h.status === "pending" ? "warning.main"
                          : h.status === "SEMI_ACTIVE" || h.status === "archived" || h.status === "intermédiaire" ? "info.main"
                          : h.status === "PERMANENT" || h.status === "historique" ? "secondary.main"
                          : h.status === "DESTROYED" || h.status === "disposed" || h.status === "détruit" ? "error.main"
                          : "text.disabled",
                      }}
                    />
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
                ))}
              </Stack>
            </MuiBox>
          </>
        )}

        {/* Actions */}
        {canWrite && (
          <>
            <Divider />
            <MuiBox px={2} py={1.5}>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>Actions</Typography>
              <Stack spacing={0.75}>
                {actions.map((a) => (
                  <Button
                    key={a.action}
                    variant="outlined"
                    size="small"
                    color={a.color ?? "inherit"}
                    startIcon={a.icon}
                    disabled={a.disabled}
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

// ── Toolbar (minimal) ─────────────────────────────────────────

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
      {canWrite && (
        <Button
          variant="contained"
          size="small"
          startIcon={<AddRoundedIcon />}
          onClick={onAdd}
          disableElevation
        >
          Ajouter
        </Button>
      )}
    </Toolbar>
  );
});

// ── Main component ───────────────────────────────────────────

export default function ArchiveManagementContent() {
  const Authorization = useToken();
  const dispatch = useDispatch<AppDispatch>();
  const { enqueueSnackbar } = useSnackbar();
  const { canWrite, isAdmin } = useArchivePermissions();
  const dataVersion = useSelector((store: RootState) => store.data.dataVersion);
  const selectedElements = useSelector(
    (store: RootState) => store.data.navigation.archiveManagement.selectedElements
  );
  const selectedDoc = useSelector((store: RootState) => {
    const id = store.data.navigation.archiveManagement.selectedElements[0];
    return id
      ? (store.data.docs.find((d) => d._id === id || d.id === id) as Record<string, unknown> | undefined)
      : undefined;
  });

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [detailOpen, setDetailOpen] = useState(false);

  const [{ data, loading }, refetch] = useAxios<Archive[]>({
    url: "/api/stuff/archives/archived",
    headers: { Authorization },
  });

  const [, execLifecycle] = useAxios({ method: "PATCH", headers: { Authorization } }, { manual: true });
  const [, execDelete]    = useAxios({ method: "DELETE", headers: { Authorization } }, { manual: true });

  // Sync docs into Redux store
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

  // Lifecycle event bus
  useEffect(() => {
    const root = document.getElementById("root");
    const handler = async (e: Event) => {
      const { id, targetStatus } = (e as CustomEvent).detail as { id: string; targetStatus: string };
      try {
        await execLifecycle({ url: `/api/stuff/archives/${id}/lifecycle`, data: { targetStatus } });
        dispatch(incrementVersion());
        enqueueSnackbar(`Statut → ${STATUS_LABEL[targetStatus] ?? targetStatus}`, { variant: "success", title: "Cycle de vie" });
        setDetailOpen(false);
      } catch {
        enqueueSnackbar("Impossible de changer le statut.", { variant: "error", title: "Erreur" });
      }
    };
    root?.addEventListener("__lifecycle_archive", handler);
    return () => root?.removeEventListener("__lifecycle_archive", handler);
  }, [execLifecycle, dispatch, enqueueSnackbar]);

  type RowType = Archive & { id: string; type: string; createdAt: Date | null };

  const allRows = useMemo(
    () =>
      (data as Archive[])?.map((doc) => ({
        ...doc,
        id: doc._id,
        type: (doc.type as { type?: string })?.type ?? "",
        createdAt: doc.createdAt ? new Date(doc.createdAt as string) : null,
      } as RowType)) ?? [],
    [data]
  );

  const statusCounts = useMemo(() => {
    const counts: Record<NormalizedStatus, number> = { PENDING: 0, ACTIVE: 0, SEMI_ACTIVE: 0, PERMANENT: 0, DESTROYED: 0 };
    allRows.forEach((r) => counts[normalizeStatus(r.status as string | undefined, r.validated as boolean | undefined)]++);
    return counts;
  }, [allRows]);

  const rows = useMemo(
    () => statusFilter === "ALL"
      ? allRows
      : allRows.filter((r) => normalizeStatus(r.status as string | undefined, r.validated as boolean | undefined) === statusFilter),
    [allRows, statusFilter]
  );

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
      if (selectionModel.length === 1) setDetailOpen(true);
      else if (selectionModel.length === 0) setDetailOpen(false);
    },
    [dispatch]
  );

  const handleAction = useCallback(
    async (action: string) => {
      const ids = selectedElements as string[];
      const [id] = ids;

      switch (action) {
        case "verify":
          document.getElementById("root")?.dispatchEvent(
            new CustomEvent("__validate_archive_doc", { detail: { doc: id, name: "__validate_archive_doc" } })
          );
          break;
        case "edit":
          if (selectedDoc) document.getElementById("root")?.dispatchEvent(new CustomEvent("__edit_archive_doc", { detail: { doc: selectedDoc } }));
          break;
        case "link-physical":
          if (selectedDoc) document.getElementById("root")?.dispatchEvent(new CustomEvent("__link_physical_record", { detail: { doc: selectedDoc } }));
          break;
        case "configure-dua":
          if (selectedDoc) document.getElementById("root")?.dispatchEvent(new CustomEvent("__configure_dua", { detail: { doc: selectedDoc } }));
          break;
        case "to-semi-active":
          document.getElementById("root")?.dispatchEvent(new CustomEvent("__lifecycle_archive", { detail: { id, targetStatus: "SEMI_ACTIVE" } }));
          break;
        case "reactivate":
          document.getElementById("root")?.dispatchEvent(new CustomEvent("__lifecycle_archive", { detail: { id, targetStatus: "ACTIVE" } }));
          break;
        case "to-permanent":
          document.getElementById("root")?.dispatchEvent(new CustomEvent("__lifecycle_archive", { detail: { id, targetStatus: "PERMANENT" } }));
          break;
        case "to-destroyed":
          document.getElementById("root")?.dispatchEvent(new CustomEvent("__lifecycle_archive", { detail: { id, targetStatus: "DESTROYED" } }));
          break;
        case "restore":
          document.getElementById("root")?.dispatchEvent(new CustomEvent("__lifecycle_archive", { detail: { id, targetStatus: "PERMANENT" } }));
          break;
        case "delete":
          document.getElementById("root")?.dispatchEvent(new CustomEvent("__delete_archive_docs", { detail: { ids } }));
          setDetailOpen(false);
          break;
      }
    },
    [selectedElements, selectedDoc]
  );

  const handleBulkDelete = useCallback(async () => {
    const ids = selectedElements as string[];
    if (!ids.length) return;
    if (ids.length === 1) {
      handleAction("delete");
      return;
    }
    try {
      await Promise.all(ids.map((docId) => execDelete({ url: `/api/stuff/archives/${docId}` })));
      dispatch(incrementVersion());
      enqueueSnackbar(`${ids.length} archives supprimées.`, { variant: "success", title: "Suppression" });
    } catch {
      enqueueSnackbar("Une ou plusieurs suppressions ont échoué.", { variant: "error", title: "Erreur" });
    }
  }, [selectedElements, execDelete, dispatch, enqueueSnackbar, handleAction]);

  return (
    <MuiBox display="flex" flex={1} height="100%" overflow="hidden">

      {/* ── Left: status navigation ── */}
      <MuiBox
        sx={{
          width: 172,
          flexShrink: 0,
          borderRight: 1,
          borderColor: "divider",
          overflow: "auto",
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          pt: 1,
          ...scrollBarSx,
        }}
      >
        <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={1} textTransform="uppercase" px={2} mb={0.5}>
          Statuts
        </Typography>
        <List dense disablePadding>
          {STATUS_NAV.map(({ key, label, icon, color }) => {
            const count = key === "ALL"
              ? Object.values(statusCounts).reduce((a, b) => a + b, 0)
              : statusCounts[key] ?? 0;
            return (
              <ListItemButton
                key={key}
                selected={statusFilter === key}
                onClick={() => setStatusFilter(key)}
                sx={{ borderRadius: 1, mx: 0.5, my: 0.125, py: 0.75 }}
              >
                <ListItemIcon sx={{ minWidth: 28, color }}>
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
        <Divider sx={{ my: 1 }} />
      </MuiBox>

      {/* ── Center: DataGrid ── */}
      <MuiBox display="flex" flex={1} position="relative" overflow="hidden">
        <MuiBox position="absolute" top={0} left={0} right={0} bottom={0} display="flex">
          <DataGrid
            rows={rows}
            loading={loading}
            columns={columns}
            checkboxSelection
            rowSelectionModel={selectedElements as string[]}
            onRowSelectionModelChange={handleSelectionChange}
            showCellVerticalBorder={false}
            showColumnVerticalBorder={false}
            pageSizeOptions={[25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            sx={{
              border: "none",
              "& .MuiDataGrid-cell":       { outline: "none", border: "none" },
              "& .MuiDataGrid-cell:focus": { outline: "none", border: "none" },
              "& *": scrollBarSx as Record<string, unknown>,
            }}
            disableDensitySelector
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            slots={{ toolbar: ArchiveManagementHeader as any }}
            slotProps={{
              toolbar: {
                canWrite,
                onAdd: () => document.getElementById("root")?.dispatchEvent(new CustomEvent("__open_archive_create", { detail: {} })),
                selectedCount: (selectedElements as string[]).length,
                onBulkDelete: handleBulkDelete,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } as any,
            }}
            localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
          />
        </MuiBox>
      </MuiBox>

      {/* ── Right: detail drawer ── */}
      <Drawer
        anchor="right"
        variant="persistent"
        open={detailOpen && !!selectedDoc}
        PaperProps={{
          sx: {
            position: "relative",
            width: 300,
            border: "none",
            borderLeft: 1,
            borderColor: "divider",
            height: "100%",
            overflow: "hidden",
          },
        }}
        sx={{ position: "relative", "& .MuiDrawer-paper": { position: "relative" } }}
      >
        {selectedDoc && (
          <DetailPanel
            doc={selectedDoc}
            canWrite={canWrite}
            isAdmin={isAdmin}
            onClose={() => setDetailOpen(false)}
            onAction={handleAction}
          />
        )}
      </Drawer>
    </MuiBox>
  );
}
