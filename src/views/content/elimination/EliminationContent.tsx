/**
 * EliminationContent — Vue principale du workflow d'élimination.
 *
 * Layout CSS Grid 4 colonnes (même pattern que ArchiveManagementContent) :
 *   Col 1 : Sidebar filtres (sidebarWidth px)
 *   Col 2 : ResizeDivider (1px)
 *   Col 3 : DataGrid PV (1fr)
 *   Col 4 : Panneau droit — résumé ou détail (280/320px)
 *
 * Mobile : 1 colonne, sidebar masquée, détail en bottom drawer.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Chip, Drawer, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { GridRowParams } from "@mui/x-data-grid";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import useApiCache from "@/hooks/useApiCache";
import useToken from "@/hooks/useToken";
import useArchivePermissions from "@/hooks/useArchivePermissions";
import useRealtimeRefresh from "@/hooks/useRealtimeRefresh";
import scrollBarSx from "@/utils/scrollBarSx";
import type { DeepTarget } from "@/utils/deepNavigate";
import ResizeDivider from "@/views/content/physical-archive/ResizeDivider";
import { useTranslation } from "react-i18next";
import usePanelWidth from "@/hooks/usePanelWidth";

import EliminationSidebar from "./EliminationSidebar";
import PvList, { type PvRow } from "./PvList";
import PvDetailPanel, { type PvDetail } from "./PvDetailPanel";
import PvCreateDialog from "./PvCreateDialog";
import pvColumns from "./pvColumns";
import { PV_STATUSES, PV_STATUS_COLOR, type PvStatus } from "./pvStatusConfig";

// ── Main ─────────────────────────────────────────────────────

export default function EliminationContent() {
  const Authorization = useToken();
  const headers = useMemo(() => ({ Authorization: Authorization ?? "" }), [Authorization]);
  const { canWrite, isAdmin } = useArchivePermissions();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();
  const dataVersion = useSelector((store: RootState) => store.data.dataVersion);
  const { t } = useTranslation();

  useRealtimeRefresh();

  // ── State ──────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<PvStatus | "ALL">("ALL");
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = usePanelWidth("elimination.sidebar", 200);

  // ── Fetch ──────────────────────────────────────────────────
  const { data: pvData, loading, refetch } = useApiCache<PvRow[]>(
    "/api/stuff/archives/elimination",
    headers,
  );

  const { data: pvDetail, refetch: refetchDetail } = useApiCache<PvDetail>(
    focusedId ? `/api/stuff/archives/elimination/${focusedId}` : null,
    headers,
  );

  useEffect(() => {
    if (dataVersion > 0) {
      refetch();
      if (focusedId) refetchDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVersion]);

  // ── Deep navigation ────────────────────────────────────────
  useEffect(() => {
    const deep = (location.state as Record<string, unknown> | null)?.deepTarget as DeepTarget | undefined;
    if (deep?.eliminationPvId) {
      if (deep.eliminationPvId === "__create__") {
        // Ouvrir le dialog de création de PV
        setCreateOpen(true);
      } else {
        setFocusedId(deep.eliminationPvId);
        setDetailOpen(true);
      }
      // Nettoyer le deepTarget pour éviter les re-déclenchements
      window.history.replaceState(
        { ...(window.history.state ?? {}), usr: { ...(window.history.state?.usr ?? {}), deepTarget: undefined } },
        ""
      );
    }
  }, [location.state]);

  // ── Derived ────────────────────────────────────────────────
  const pvList = useMemo(() => (pvData ?? []) as PvRow[], [pvData]);

  const rows = useMemo(() => {
    const base = pvList.map((pv) => ({ ...pv, id: pv._id }));
    if (statusFilter === "ALL") return base;
    return base.filter((pv) => pv.status === statusFilter);
  }, [pvList, statusFilter]);

  const statusCounts = useMemo(() => {
    const c = {} as Record<PvStatus, number>;
    for (const s of PV_STATUSES) c[s] = 0;
    pvList.forEach((pv) => { if (pv.status in c) c[pv.status as PvStatus]++; });
    return c;
  }, [pvList]);

  // ── Handlers ───────────────────────────────────────────────
  const handleRowClick = useCallback((params: GridRowParams) => {
    setFocusedId(params.id as string);
    setDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
    setFocusedId(null);
  }, []);

  const focusedPv = detailOpen ? pvDetail : null;

  // ── Render ─────────────────────────────────────────────────
  return (
    <>
      <Box
        sx={{
          display: "grid",
          flex: 1,
          height: "100%",
          overflow: "hidden",
          gridTemplateColumns: isMobile
            ? "1fr"
            : `${sidebarWidth}px 1px minmax(0, 1fr) ${focusedPv ? 320 : 280}px`,
        }}
      >
        {/* Col 1 — Sidebar */}
        {!isMobile && (
          <EliminationSidebar
            statusFilter={statusFilter}
            statusCounts={statusCounts}
            totalCount={pvList.length}
            canWrite={canWrite}
            onStatusFilter={setStatusFilter}
            onOpenCreate={() => setCreateOpen(true)}
          />
        )}

        {/* Col 2 — Divider */}
        {!isMobile && <ResizeDivider onResize={setSidebarWidth} minLeft={160} minRight={250} />}

        {/* Col 3 — DataGrid */}
        <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
          {/* Chips mobile (remplacent la sidebar) */}
          {isMobile && (
            <Box px={1} py={0.75} display="flex" gap={0.5} overflow="auto" flexShrink={0} sx={scrollBarSx}>
              <Chip label={t("elimination.filter.all")} size="small"
                color={statusFilter === "ALL" ? "primary" : "default"}
                variant={statusFilter === "ALL" ? "filled" : "outlined"}
                onClick={() => setStatusFilter("ALL")} />
              {PV_STATUSES.map((s) => (
                <Chip key={s} label={t(`elimination.filter.${s}`)} size="small"
                  color={statusFilter === s ? PV_STATUS_COLOR[s] : "default"}
                  variant={statusFilter === s ? "filled" : "outlined"}
                  onClick={() => setStatusFilter(s)} />
              ))}
            </Box>
          )}
          <PvList
            rows={rows}
            columns={pvColumns}
            loading={loading}
            focusedId={focusedId}
            onRowClick={handleRowClick}
          />
        </Box>

        {/* Col 4 — Panneau droit (toujours visible desktop) */}
        {!isMobile && (
          <Box sx={{ borderLeft: 1, borderColor: "divider", display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
            {focusedPv ? (
              <PvDetailPanel pv={focusedPv} canWrite={canWrite} isAdmin={isAdmin} onClose={handleCloseDetail} />
            ) : (
              /* Résumé quand aucun PV sélectionné */
              <Box p={2.5} flex={1} display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                <GavelOutlinedIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1.5 }} />
                <Typography variant="body2" color="text.secondary" textAlign="center" mb={2}>
                  {t("elimination.noPvs")}
                </Typography>
                <Stack spacing={0.75} width="100%">
                  {PV_STATUSES.map((s) => {
                    const count = statusCounts[s];
                    if (count === 0) return null;
                    return (
                      <Stack key={s} direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">{t(`elimination.filter.${s}`)}</Typography>
                        <Typography variant="caption" fontWeight="bold">{count}</Typography>
                      </Stack>
                    );
                  })}
                  {pvList.length === 0 && (
                    <Typography variant="caption" color="text.disabled" textAlign="center">
                      {t("elimination.noPvsDesc")}
                    </Typography>
                  )}
                </Stack>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Bottom drawer mobile — HORS du grid */}
      <Drawer
        anchor="bottom"
        open={detailOpen && !!pvDetail && isMobile}
        onClose={handleCloseDetail}
        PaperProps={{
          sx: { maxHeight: "72vh", borderTopLeftRadius: 12, borderTopRightRadius: 12, ...scrollBarSx },
        }}
      >
        {pvDetail && (
          <PvDetailPanel pv={pvDetail} canWrite={canWrite} isAdmin={isAdmin} onClose={handleCloseDetail} />
        )}
      </Drawer>

      {/* Dialog création — HORS du grid */}
      <PvCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
