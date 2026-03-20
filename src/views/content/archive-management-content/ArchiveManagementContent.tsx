import React, { useEffect, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../../redux/store";
import { updateData, incrementVersion } from "../../../redux/data";
import { Box as MuiBox, Chip } from "@mui/material";
import { DataGrid, GridColDef, GridToolbarColumnsButton, GridToolbarFilterButton, GridRowSelectionModel } from "@mui/x-data-grid";
import { frFR } from "@mui/x-data-grid/locales";
import useAxios from "../../../hooks/useAxios";
import useToken from "../../../hooks/useToken";
import type { Archive, ArchiveDocument, NavigationState } from "../../../types";
import scrollBarSx from "../../../utils/scrollBarSx";
import { Toolbar } from "@mui/material";
import NavigationMenuButton from "../../navigation/NavigationMenuButton";
import { useSnackbar } from "notistack";

// ── Lifecycle status ──────────────────────────────────────────

export type ArchiveStatus =
  | "PENDING"
  | "ACTIVE"
  | "SEMI_ACTIVE"
  | "PERMANENT"
  | "DESTROYED"
  // Legacy values — backward compat
  | "pending"
  | "validated"
  | "archived"
  | "disposed"
  | "actif"
  | "intermédiaire"
  | "historique"
  | "détruit";

export const STATUS_LABEL: Record<string, string> = {
  PENDING:     "En attente",
  ACTIVE:      "Actif",
  SEMI_ACTIVE: "Intermédiaire",
  PERMANENT:   "Historique",
  DESTROYED:   "Détruit",
  // Legacy
  pending:        "En attente",
  validated:      "Actif",
  archived:       "Intermédiaire",
  disposed:       "Détruit",
  actif:          "Actif",
  "intermédiaire": "Intermédiaire",
  historique:     "Historique",
  détruit:        "Détruit",
};

const STATUS_COLOR: Record<string, "default" | "warning" | "success" | "info" | "error" | "secondary"> = {
  PENDING:     "warning",
  ACTIVE:      "success",
  SEMI_ACTIVE: "info",
  PERMANENT:   "secondary",
  DESTROYED:   "error",
  // Legacy
  pending:        "warning",
  validated:      "success",
  archived:       "info",
  disposed:       "error",
  actif:          "success",
  "intermédiaire": "info",
  historique:     "secondary",
  détruit:        "error",
};

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
  { field: "createdAt", headerName: "Date", type: "dateTime", width: 155 },
];

// ── Toolbar ──────────────────────────────────────────────────

const ArchiveManagementHeader = React.memo(() => (
  <Toolbar sx={{ gap: 1, flexWrap: "wrap", py: 1 }}>
    <NavigationMenuButton
      hide
      IconProps={{ sx: { transform: "rotate(-180deg)" } }}
    />
    <GridToolbarColumnsButton
      slotProps={{ button: { variant: "outlined", color: "inherit", size: "medium" } }}
    />
    <GridToolbarFilterButton
      slotProps={{ button: { variant: "outlined", color: "inherit", size: "medium" } }}
    />
  </Toolbar>
));
ArchiveManagementHeader.displayName = "ArchiveManagementHeader";

// ── Main component ───────────────────────────────────────────

export default function ArchiveManagementContent() {
  const Authorization = useToken();
  const dispatch = useDispatch<AppDispatch>();
  const { enqueueSnackbar } = useSnackbar();
  const dataVersion = useSelector((store: RootState) => store.data.dataVersion);
  const selectedElements = useSelector(
    (store: RootState) => store.data.navigation.archiveManagement.selectedElements
  );

  const [{ data, loading }, refetch] = useAxios<Archive[]>({
    url: "/api/stuff/archives/archived",
    headers: { Authorization },
  });

  const [, execLifecycle] = useAxios(
    { method: "PATCH", headers: { Authorization } },
    { manual: true }
  );

  useEffect(() => {
    const root = document.getElementById("root");
    const handler = async (e: Event) => {
      const { id, targetStatus } = (e as CustomEvent).detail as { id: string; targetStatus: string };
      try {
        await execLifecycle({
          url: `/api/stuff/archives/${id}/lifecycle`,
          data: { targetStatus }
        });
        dispatch(incrementVersion());
        enqueueSnackbar(
          `Statut mis à jour : ${STATUS_LABEL[targetStatus] ?? targetStatus}.`,
          { variant: "success", title: "Cycle de vie" }
        );
      } catch {
        enqueueSnackbar("Impossible de changer le statut de ce document.", {
          variant: "error", title: "Erreur"
        });
      }
    };
    root?.addEventListener("__lifecycle_archive", handler);
    return () => root?.removeEventListener("__lifecycle_archive", handler);
  }, [execLifecycle, dispatch, enqueueSnackbar]);

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

  const rows = useMemo(
    () =>
      (data as Archive[])?.map((doc) => ({
        ...doc,
        id: doc._id,
        type: (doc.type as { type?: string })?.type ?? "",
        createdAt: doc.createdAt ? new Date(doc.createdAt as string) : null,
      })) ?? [],
    [data]
  );

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
          slots={{ toolbar: ArchiveManagementHeader }}
          localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
        />
      </MuiBox>
    </MuiBox>
  );
}
