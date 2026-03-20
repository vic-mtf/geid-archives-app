import React, { useEffect, useMemo, useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../../redux/store";
import { updateData, incrementVersion } from "../../../redux/data";
import {
  Box as MuiBox,
  Button,
  ButtonGroup,
  Chip,
  LinearProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
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
import { DataGrid, GridColDef, GridToolbarColumnsButton, GridToolbarFilterButton, GridRowSelectionModel } from "@mui/x-data-grid";
import { frFR } from "@mui/x-data-grid/locales";
import useAxios from "../../../hooks/useAxios";
import useToken from "../../../hooks/useToken";
import useArchivePermissions from "../../../hooks/useArchivePermissions";
import type { Archive, ArchiveDocument, NavigationState } from "../../../types";
import scrollBarSx from "../../../utils/scrollBarSx";
import NavigationMenuButton from "../../navigation/NavigationMenuButton";
import { useSnackbar } from "notistack";

// ── Lifecycle status ──────────────────────────────────────────

export type ArchiveStatus =
  | "PENDING" | "ACTIVE" | "SEMI_ACTIVE" | "PERMANENT" | "DESTROYED"
  | "pending" | "validated" | "archived" | "disposed"
  | "actif" | "intermédiaire" | "historique" | "détruit";

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

const STATUS_COLOR: Record<string, "default" | "warning" | "success" | "info" | "error" | "secondary"> = {
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

type NormalizedStatus = "PENDING" | "ACTIVE" | "SEMI_ACTIVE" | "PERMANENT" | "DESTROYED";

function normalizeStatus(status: string | undefined, validated?: boolean): NormalizedStatus {
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

function StatusChip({ status, validated }: { status?: string; validated?: boolean }) {
  const resolved = status ?? (validated ? "ACTIVE" : "PENDING");
  return (
    <Chip
      label={STATUS_LABEL[resolved] ?? resolved}
      color={STATUS_COLOR[resolved] ?? "default"}
      size="small"
      variant="outlined"
    />
  );
}

// ── DUA status cell ──────────────────────────────────────────

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
      <Tooltip title="DUA non configurée — sélectionnez la ligne puis Actions → Configurer DUA">
        <Chip
          icon={<AccessTimeOutlinedIcon />}
          label="DUA non config."
          size="small"
          color="warning"
          variant="outlined"
          sx={{ fontSize: 11 }}
        />
      </Tooltip>
    );
  }

  const startDate = new Date(dua.startDate);
  const expiresAt = computeExpiresAt(startDate, dua.value, dua.unit);
  const now       = new Date();
  const totalMs   = expiresAt.getTime() - startDate.getTime();
  const elapsedMs = now.getTime() - startDate.getTime();
  const pct       = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
  const expired   = now >= expiresAt;

  const diffMs   = expiresAt.getTime() - now.getTime();
  const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const label    = expired
    ? "Expirée"
    : daysLeft < 30  ? `${daysLeft}j`
    : daysLeft < 365 ? `${Math.floor(daysLeft / 30)}m`
    :                  `${Math.floor(daysLeft / 365)}a`;

  const sortLabel   = dua.sortFinal === "conservation" ? "→ Historique" : "→ Détruire";
  const tooltipText = `DUA : ${dua.value} ${dua.unit === "years" ? "an(s)" : "mois"} ${sortLabel}\nExpire le : ${expiresAt.toLocaleDateString("fr-FR")}`;

  return (
    <Tooltip title={<span style={{ whiteSpace: "pre-line" }}>{tooltipText}</span>}>
      <MuiBox width={90}>
        <MuiBox display="flex" justifyContent="space-between">
          <Typography variant="caption" color={expired ? "error" : "text.secondary"} sx={{ fontSize: 10 }}>
            {expired ? "Expirée" : label}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
            {sortLabel}
          </Typography>
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

// ── Colonnes du tableau ──────────────────────────────────────

const columns: GridColDef[] = [
  { field: "designation",  headerName: "Désignation",      flex: 2, minWidth: 200 },
  { field: "type",         headerName: "Type de document", width: 180 },
  { field: "classNumber",  headerName: "N° classement",    width: 140 },
  { field: "refNumber",    headerName: "N° référence",     width: 140 },
  { field: "description",  headerName: "Description",      flex: 1, minWidth: 130 },
  {
    field: "status",
    headerName: "Statut",
    width: 145,
    renderCell: (params) => (
      <StatusChip
        status={params.row.status as string}
        validated={params.row.validated as boolean}
      />
    ),
  },
  {
    field: "dua",
    headerName: "DUA",
    width: 110,
    sortable: false,
    renderCell: (params) => <DuaCell row={params.row} />,
  },
  { field: "createdAt", headerName: "Date", type: "dateTime", width: 155 },
];

// ── Status filter chips ──────────────────────────────────────

type StatusFilter = "ALL" | NormalizedStatus;

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "ALL",         label: "Tous"           },
  { key: "PENDING",     label: "En attente"     },
  { key: "ACTIVE",      label: "Actifs"         },
  { key: "SEMI_ACTIVE", label: "Intermédiaires" },
  { key: "PERMANENT",   label: "Historique"     },
  { key: "DESTROYED",   label: "Détruits"       },
];

// ── Toolbar ──────────────────────────────────────────────────

interface ArchiveToolbarProps {
  statusFilter: StatusFilter;
  onStatusFilter: (f: StatusFilter) => void;
  statusCounts: Record<NormalizedStatus, number>;
  selectedDoc: Record<string, unknown> | undefined;
  selectedCount: number;
  canWrite: boolean;
  isAdmin: boolean;
  onAdd: () => void;
  onAction: (action: string) => void;
}

const ArchiveManagementHeader = React.memo(function ArchiveManagementHeader({
  statusFilter,
  onStatusFilter,
  statusCounts,
  selectedDoc,
  selectedCount,
  canWrite,
  isAdmin,
  onAdd,
  onAction,
}: ArchiveToolbarProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const norm = normalizeStatus(
    selectedDoc?.status as string | undefined,
    selectedDoc?.validated as boolean | undefined
  );

  interface ActionItem {
    label: string;
    icon: React.ReactNode;
    color?: string;
    disabled: boolean;
    onClick: () => void;
  }

  const actions: ActionItem[] = useMemo(() => {
    if (selectedCount === 0) return [];

    if (selectedCount > 1) {
      return [
        {
          label: `Supprimer (${selectedCount})`,
          icon: <DeleteOutlineOutlinedIcon fontSize="small" />,
          color: "error.main",
          disabled: !canWrite,
          onClick: () => onAction("delete"),
        },
      ];
    }

    const list: (ActionItem | null)[] = [
      norm === "PENDING" ? {
        label: "Valider",
        icon: <VerifiedOutlinedIcon fontSize="small" />,
        disabled: !canWrite,
        onClick: () => onAction("verify"),
      } : null,
      {
        label: "Modifier",
        icon: <EditNoteOutlinedIcon fontSize="small" />,
        disabled: !canWrite,
        onClick: () => onAction("edit"),
      },
      {
        label: "Dossier physique",
        icon: <FolderOpenOutlinedIcon fontSize="small" />,
        disabled: !canWrite,
        onClick: () => onAction("link-physical"),
      },
      norm === "SEMI_ACTIVE" ? {
        label: "Configurer DUA",
        icon: <AccessTimeOutlinedIcon fontSize="small" />,
        disabled: !canWrite,
        onClick: () => onAction("configure-dua"),
      } : null,
      norm === "ACTIVE" ? {
        label: "Passer en intermédiaire",
        icon: <ArchiveOutlinedIcon fontSize="small" />,
        disabled: !canWrite,
        onClick: () => onAction("to-semi-active"),
      } : null,
      norm === "SEMI_ACTIVE" ? {
        label: "Réactiver",
        icon: <UnarchiveOutlinedIcon fontSize="small" />,
        disabled: !canWrite,
        onClick: () => onAction("reactivate"),
      } : null,
      norm === "SEMI_ACTIVE" ? {
        label: "Archiver (historique)",
        icon: <HistoryEduOutlinedIcon fontSize="small" />,
        disabled: !canWrite,
        onClick: () => onAction("to-permanent"),
      } : null,
      (isAdmin && (norm === "SEMI_ACTIVE" || norm === "PERMANENT")) ? {
        label: "Éliminer",
        icon: <DeleteForeverOutlinedIcon fontSize="small" />,
        color: "error.main",
        disabled: !canWrite,
        onClick: () => onAction("to-destroyed"),
      } : null,
      (isAdmin && norm === "DESTROYED") ? {
        label: "Restaurer",
        icon: <RestoreOutlinedIcon fontSize="small" />,
        disabled: !canWrite,
        onClick: () => onAction("restore"),
      } : null,
      {
        label: "Supprimer définitivement",
        icon: <DeleteOutlineOutlinedIcon fontSize="small" />,
        color: "error.main",
        disabled: !canWrite,
        onClick: () => onAction("delete"),
      },
    ];

    return list.filter((a): a is ActionItem => a !== null);
  }, [selectedCount, norm, canWrite, isAdmin, onAction]);

  return (
    <Toolbar sx={{ gap: 1, flexWrap: "wrap", py: 1, minHeight: "unset" }}>
      <NavigationMenuButton hide IconProps={{ sx: { transform: "rotate(-180deg)" } }} />

      {/* Status filter chips */}
      <MuiBox display="flex" gap={0.5} flexWrap="wrap" flex={1}>
        {STATUS_FILTERS.map(({ key, label }) => {
          const count = key === "ALL"
            ? Object.values(statusCounts).reduce((a, b) => a + b, 0)
            : statusCounts[key] ?? 0;
          return (
            <Chip
              key={key}
              label={count > 0 ? `${label} (${count})` : label}
              size="small"
              variant={statusFilter === key ? "filled" : "outlined"}
              color={
                key === "PENDING" && count > 0
                  ? "warning"
                  : statusFilter === key
                  ? "primary"
                  : "default"
              }
              onClick={() => onStatusFilter(key)}
              sx={{ cursor: "pointer" }}
            />
          );
        })}
      </MuiBox>

      <GridToolbarColumnsButton
        slotProps={{ button: { variant: "outlined", color: "inherit", size: "small" } }}
      />
      <GridToolbarFilterButton
        slotProps={{ button: { variant: "outlined", color: "inherit", size: "small" } }}
      />

      {/* Contextual Actions dropdown */}
      {selectedCount > 0 && actions.length > 0 && (
        <>
          <ButtonGroup size="small" variant="outlined">
            <Button
              endIcon={<ArrowDropDownIcon />}
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
              Actions{selectedCount > 1 ? ` (${selectedCount})` : ""}
            </Button>
          </ButtonGroup>
          <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
            {actions.map((action, idx) => (
              <MenuItem
                key={idx}
                disabled={action.disabled}
                onClick={() => { setAnchorEl(null); action.onClick(); }}
                sx={action.color ? { color: action.color } : undefined}
              >
                <ListItemIcon sx={action.color ? { color: action.color } : undefined}>
                  {action.icon}
                </ListItemIcon>
                <ListItemText>{action.label}</ListItemText>
              </MenuItem>
            ))}
          </Menu>
        </>
      )}

      {/* Add button */}
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

  const [{ data, loading }, refetch] = useAxios<Archive[]>({
    url: "/api/stuff/archives/archived",
    headers: { Authorization },
  });

  const [, execLifecycle] = useAxios(
    { method: "PATCH", headers: { Authorization } },
    { manual: true }
  );
  const [, execDelete] = useAxios(
    { method: "DELETE", headers: { Authorization } },
    { manual: true }
  );

  // Sync docs into Redux store for cross-component access
  useEffect(() => {
    if (data) {
      dispatch(
        updateData({
          data: {
            docs: (data as Archive[]).map((doc) => ({
              ...doc,
              id: doc._id,
            })) as unknown as ArchiveDocument[],
          },
        })
      );
    }
  }, [data, dispatch]);

  useEffect(() => {
    if (dataVersion > 0) refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVersion]);

  // Lifecycle event bus listener
  useEffect(() => {
    const root = document.getElementById("root");
    const handler = async (e: Event) => {
      const { id, targetStatus } = (e as CustomEvent).detail as { id: string; targetStatus: string };
      try {
        await execLifecycle({ url: `/api/stuff/archives/${id}/lifecycle`, data: { targetStatus } });
        dispatch(incrementVersion());
        enqueueSnackbar(`Statut mis à jour : ${STATUS_LABEL[targetStatus] ?? targetStatus}.`, {
          variant: "success",
          title: "Cycle de vie",
        });
      } catch {
        enqueueSnackbar("Impossible de changer le statut de ce document.", {
          variant: "error",
          title: "Erreur",
        });
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
    const counts: Record<NormalizedStatus, number> = {
      PENDING: 0, ACTIVE: 0, SEMI_ACTIVE: 0, PERMANENT: 0, DESTROYED: 0,
    };
    allRows.forEach((r) => {
      const n = normalizeStatus(r.status as string | undefined, r.validated as boolean | undefined);
      counts[n]++;
    });
    return counts;
  }, [allRows]);

  const rows = useMemo(() => {
    if (statusFilter === "ALL") return allRows;
    return allRows.filter(
      (r) => normalizeStatus(r.status as string | undefined, r.validated as boolean | undefined) === statusFilter
    );
  }, [allRows, statusFilter]);

  const handleSelectionChange = useCallback(
    (selectionModel: GridRowSelectionModel) => {
      dispatch(
        updateData({
          data: {
            navigation: {
              archiveManagement: {
                selectedElements: [...selectionModel] as string[],
              },
            } as unknown as NavigationState,
          },
        })
      );
    },
    [dispatch]
  );

  const handleRowClick = useCallback((params: { row: Record<string, unknown> }) => {
    const fileUrl = params.row.fileUrl as string | undefined;
    if (fileUrl) {
      window.open(new URL(fileUrl, import.meta.env.VITE_SERVER_BASE_URL as string));
    }
  }, []);

  const handleAdd = useCallback(() => {
    document.getElementById("root")?.dispatchEvent(
      new CustomEvent("__open_archive_form", { detail: {} })
    );
  }, []);

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
          if (selectedDoc) {
            document.getElementById("root")?.dispatchEvent(
              new CustomEvent("__edit_archive_doc", { detail: { doc: selectedDoc } })
            );
          }
          break;
        case "link-physical":
          if (selectedDoc) {
            document.getElementById("root")?.dispatchEvent(
              new CustomEvent("__link_physical_record", { detail: { doc: selectedDoc } })
            );
          }
          break;
        case "configure-dua":
          if (selectedDoc) {
            document.getElementById("root")?.dispatchEvent(
              new CustomEvent("__configure_dua", { detail: { doc: selectedDoc } })
            );
          }
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
          if (ids.length === 1) {
            document.getElementById("root")?.dispatchEvent(
              new CustomEvent("__delete_archive_docs", { detail: { ids } })
            );
          } else {
            try {
              await Promise.all(ids.map((docId) => execDelete({ url: `/api/stuff/archives/${docId}` })));
              dispatch(incrementVersion());
              enqueueSnackbar(`${ids.length} archives supprimées.`, { variant: "success", title: "Suppression" });
            } catch {
              enqueueSnackbar("Une ou plusieurs suppressions ont échoué.", { variant: "error", title: "Erreur" });
            }
          }
          break;
      }
    },
    [selectedElements, selectedDoc, execDelete, dispatch, enqueueSnackbar]
  );

  return (
    <MuiBox display="flex" flex={1} position="relative">
      <MuiBox position="absolute" display="flex" flex={1} width="100%" height="100%" top={0}>
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
            "& .MuiDataGrid-cell": { outline: "none", border: "none" },
            "& .MuiDataGrid-cell:focus": { outline: "none", border: "none" },
            "& *": scrollBarSx as Record<string, unknown>,
          }}
          disableDensitySelector
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          slots={{ toolbar: ArchiveManagementHeader as any }}
          slotProps={{
            toolbar: {
              statusFilter,
              onStatusFilter: setStatusFilter,
              statusCounts,
              selectedDoc,
              selectedCount: (selectedElements as string[]).length,
              canWrite,
              isAdmin,
              onAdd: handleAdd,
              onAction: handleAction,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
          }}
          localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
        />
      </MuiBox>
    </MuiBox>
  );
}
