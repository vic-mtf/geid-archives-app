/**
 * ArchiveManagementContent — Vue principale de gestion des archives.
 *
 * Disposition 3 colonnes responsive :
 *   xs/sm : filtres en chips + détail en bottom-drawer
 *   md+   : sidebar gauche (180-200px) + DataGrid + panneau détail (280-380px)
 *
 * Les sous-composants sont dans des fichiers séparés :
 *   - StatusChip.tsx        : Chip coloré du statut
 *   - DuaCell.tsx           : Cellule DUA dans le DataGrid
 *   - DetailPanel.tsx       : Panneau de détail complet
 *   - columns.tsx           : Définition des colonnes DataGrid
 *   - helpers.ts            : computeExpiresAt et utilitaires
 *   - ArchiveSidebar.tsx    : Panneau latéral gauche (filtres, accès rapide)
 *   - MobileFilterChips.tsx : Chips de filtre mobile
 *   - exportCSV.ts          : Export CSV
 */

import { useEffect, useMemo, useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { updateData, incrementVersion } from "@/redux/data";
import { Box as MuiBox, Drawer, useMediaQuery, useTheme } from "@mui/material";
import ResizeDivider from "@/views/content/physical-archive/ResizeDivider";
import usePanelWidth from "@/hooks/usePanelWidth";
import { DataGrid, GridRowSelectionModel, GridRowParams, useGridApiRef } from "@mui/x-data-grid";
import { frFR } from "@mui/x-data-grid/locales";
import useAxios              from "@/hooks/useAxios";
import useToken              from "@/hooks/useToken";
import useArchivePermissions from "@/hooks/useArchivePermissions";
import type { Archive, ArchiveDocument, NavigationState } from "@/types";
import scrollBarSx from "@/utils/scrollBarSx";
import { useSnackbar }       from "notistack";
import { useTranslation }   from "react-i18next";
import useNavigateSetState from "@/hooks/useNavigateSetState";
import { normalizeStatus, type NormalizedStatus } from "@/constants/lifecycle";
import useArchiveEvents from "./useArchiveEvents";
// useLocation retiré — deep navigate géré dans useArchiveEvents
import archiveColumns          from "./columns";
import DetailPanel             from "./DetailPanel";
import ArchiveManagementHeader from "./ArchiveManagementHeader";
import ArchiveSidebar          from "./ArchiveSidebar";
import MobileFilterChips       from "./MobileFilterChips";
import getStatusNav, { type StatusFilter } from "./statusNav";
import { exportArchivesCSV }   from "./exportCSV";
import { computeExpiresAt, dispatchArchiveAction } from "./helpers";


// ── Main component ─────────────────────────────────────────────────────────────

export default function ArchiveManagementContent() {
  const Authorization = useToken();
  const dispatch      = useDispatch<AppDispatch>();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const { canWrite, isAdmin } = useArchivePermissions();
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigateTo = useNavigateSetState();
  const [sidebarWidth, setSidebarWidth] = usePanelWidth("archives.sidebar", 200);

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

  const apiRef = useGridApiRef();

  // Event bus listeners (lifecycle, tree select, deep navigate, elimination)
  useArchiveEvents({
    execLifecycle, navigateTo, apiRef,
    setFocusedId, setDetailOpen, setStatusFilter, setQuickFilter,
  });

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
      PENDING: 0, ACTIVE: 0, SEMI_ACTIVE: 0, PROPOSED_ELIMINATION: 0, PERMANENT: 0, DESTROYED: 0,
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

  // ── Export CSV ─────────────────────────────────────────────────
  const exportCSV = useCallback(() => {
    exportArchivesCSV(rows as unknown as Parameters<typeof exportArchivesCSV>[0]);
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

  const handleRowDoubleClick = useCallback((params: GridRowParams) => {
    const row = params.row;
    const id = row._id || row.id;
    if (!id) return;
    const url = `/api/stuff/archives/file/${id}`;
    // Extraire le vrai nom de fichier (avec extension) depuis fileUrl
    const realFileName = row.fileUrl ? row.fileUrl.split("/").pop() : null;
    const fileName = realFileName || row.designation || "document";
    document.getElementById("root")?.dispatchEvent(
      new CustomEvent("_open_file_preview", {
        detail: {
          file: { _id: id, name: fileName, fileUrl: url, size: row.size },
          files: rows.map((r: any) => {
            const rName = r.fileUrl ? r.fileUrl.split("/").pop() : r.designation;
            return { _id: r._id || r.id, name: rName, fileUrl: `/api/stuff/archives/file/${r._id || r.id}` };
          }),
        },
      })
    );
  }, [rows]);

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
    (action: string) => {
      const id  = focusedId ?? (selectedElements as string[])[0];
      const doc = focusedDoc;
      const isDelete = dispatchArchiveAction(action, id, doc);
      if (isDelete) {
        setDetailOpen(false);
        setFocusedId(null);
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
        { variant: "error", title: t("notifications.errorDeletePartialTitle") }
      );
    }
  }, [selectedElements, execDelete, dispatch, enqueueSnackbar]);

  const openAdd = useCallback(() => {
    document.getElementById("root")?.dispatchEvent(
      new CustomEvent("__open_archive_source_picker", { detail: {} })
    );
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setFocusedId(null);
  }, []);

  const handleSelectArchive = useCallback((id: string) => {
    setFocusedId(id);
    setDetailOpen(true);
  }, []);

  const handleStatusFilter = useCallback((key: StatusFilter) => {
    setStatusFilter(key);
    setQuickFilter(null);
  }, []);

  const handleQuickFilter = useCallback((key: "dua_expired" | "this_month" | null) => {
    setQuickFilter(key);
    setStatusFilter("ALL");
  }, []);

  // ── Render ────────────────────────────────────────────────────

  return (
    <MuiBox sx={{
      display: "grid",
      flex: 1,
      height: "100%",
      overflow: "hidden",
      gridTemplateColumns: isMobile
        ? "1fr"
        : detailOpen && focusedDoc
          ? `${sidebarWidth}px 1px minmax(0, 1fr) 320px`
          : `${sidebarWidth}px 1px minmax(0, 1fr)`,
    }}>

      {/* ── Sidebar gauche (md+) ──────────────────────────────── */}
      {!isMobile && <ArchiveSidebar
        canWrite={canWrite}
        statusNav={getStatusNav()}
        statusFilter={statusFilter}
        quickFilter={quickFilter}
        totalCount={totalCount}
        statusCounts={statusCounts}
        duaExpiredCount={duaExpiredCount}
        thisMonthCount={thisMonthCount}
        recentArchives={recentArchives as unknown as { id: string; status?: string; validated?: boolean; designation?: string }[]}
        focusedId={focusedId}
        rowCount={rows.length}
        onStatusFilter={handleStatusFilter}
        onQuickFilter={handleQuickFilter}
        onOpenAdd={openAdd}
        onExportCSV={exportCSV}
        onSelectArchive={handleSelectArchive}
      />}

      {/* ── Divider ajustable ──────────────────────────────────── */}
      {!isMobile && <ResizeDivider onResize={setSidebarWidth} minLeft={160} minRight={250} />}

      {/* ── Colonne centrale ──────────────────────────────────── */}
      <MuiBox display="flex" flexDirection="column" overflow="hidden" minWidth={0}>

        {/* Chips de filtre — mobile uniquement */}
        <MobileFilterChips
          statusNav={getStatusNav()}
          statusFilter={statusFilter}
          quickFilter={quickFilter}
          totalCount={totalCount}
          statusCounts={statusCounts}
          duaExpiredCount={duaExpiredCount}
          onStatusFilter={handleStatusFilter}
          onQuickFilter={(key) => handleQuickFilter(key)}
        />

        {/* DataGrid — remplit tout l'espace restant */}
        <MuiBox flex={1} position="relative" overflow="hidden" minHeight={0}>
          <MuiBox position="absolute" top={0} left={0} right={0} bottom={0}>
            <DataGrid
              apiRef={apiRef}
              rows={rows}
              loading={loading}
              columns={archiveColumns}
              checkboxSelection
              disableRowSelectionOnClick
              rowSelectionModel={selectedElements as string[]}
              onRowSelectionModelChange={handleSelectionChange}
              onRowClick={handleRowClick}
              onRowDoubleClick={handleRowDoubleClick}
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

      {/* ── Panneau droit — detail d'une archive selectionnee ──── */}
      {!isMobile && detailOpen && focusedDoc && (
        <MuiBox
          sx={{
            borderLeft: 1,
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minWidth: 0,
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
