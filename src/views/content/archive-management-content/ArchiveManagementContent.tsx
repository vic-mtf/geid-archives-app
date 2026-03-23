/**
 * ArchiveManagementContent
 *
 * Disposition 3 colonnes : Sidebar gauche | DataGrid | Panneau détail
 * Responsive :
 *   – xs/sm : sidebar cachée, filtres en chips horizontaux, détail en bottom-drawer
 *   – md+   : sidebar 200 px, panneau détail 300 px inline
 */

/**
 * ArchiveManagementContent — Vue principale de gestion des archives.
 *
 * Disposition 3 colonnes responsive :
 *   xs/sm : filtres en chips + détail en bottom-drawer
 *   md+   : sidebar gauche (180-200px) + DataGrid + panneau détail (280-380px)
 *
 * Les sous-composants sont dans des fichiers séparés :
 *   - StatusChip.tsx : Chip coloré du statut
 *   - DuaCell.tsx    : Cellule DUA dans le DataGrid
 *   - DetailPanel.tsx : Panneau de détail complet
 *   - columns.tsx     : Définition des colonnes DataGrid
 *   - helpers.ts      : computeExpiresAt et utilitaires
 */

import React, { useEffect, useMemo, useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { updateData, incrementVersion } from "@/redux/data";
import {
  Box as MuiBox,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
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
import DeleteOutlineOutlinedIcon      from "@mui/icons-material/DeleteOutlineOutlined";
import AllInboxRoundedIcon            from "@mui/icons-material/AllInboxRounded";
import PendingActionsRoundedIcon      from "@mui/icons-material/PendingActionsRounded";
import CheckCircleOutlineRoundedIcon  from "@mui/icons-material/CheckCircleOutlineRounded";
import ArchiveRoundedIcon             from "@mui/icons-material/ArchiveRounded";
import MenuBookRoundedIcon            from "@mui/icons-material/MenuBookRounded";
import DeleteSweepRoundedIcon         from "@mui/icons-material/DeleteSweepRounded";
import SearchRoundedIcon              from "@mui/icons-material/SearchRounded";
import FileDownloadOutlinedIcon       from "@mui/icons-material/FileDownloadOutlined";
import BoltRoundedIcon                from "@mui/icons-material/BoltRounded";
import {
  DataGrid,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
  GridRowSelectionModel,
  GridRowParams,
  useGridApiRef,
} from "@mui/x-data-grid";
import { frFR } from "@mui/x-data-grid/locales";
import useAxios              from "@/hooks/useAxios";
import useToken              from "@/hooks/useToken";
import useArchivePermissions from "@/hooks/useArchivePermissions";
import type { Archive, ArchiveDocument, NavigationState } from "@/types";
import scrollBarSx           from "@/utils/scrollBarSx";
import NavigationMenuButton  from "@/views/navigation/NavigationMenuButton";
import { useSnackbar }       from "notistack";
import { useLocation }       from "react-router-dom";
import type { DeepTarget }   from "@/utils/deepNavigate";
// useHighlightElement utilisé dans PhysicalArchive — ici on utilise apiRef.scrollToIndexes
import { STATUS_LABEL, STATUS_COLOR, normalizeStatus, type NormalizedStatus } from "@/constants/lifecycle";
import archiveColumns from "./columns";
import DetailPanel    from "./DetailPanel";

import AlarmRoundedIcon          from "@mui/icons-material/AlarmRounded";
import CalendarTodayRoundedIcon  from "@mui/icons-material/CalendarTodayRounded";
import { computeExpiresAt } from "./helpers";

// ── Filtres par statut ───────────────────────────────────────

type StatusFilter = "ALL" | NormalizedStatus;

const STATUS_NAV: { key: StatusFilter; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "ALL",         label: "Toutes",         icon: <AllInboxRoundedIcon fontSize="small" />,          color: "text.primary"    },
  { key: "PENDING",     label: "En attente",     icon: <PendingActionsRoundedIcon fontSize="small" />,    color: "warning.main"    },
  { key: "ACTIVE",      label: "Actifs",         icon: <CheckCircleOutlineRoundedIcon fontSize="small" />,color: "success.main"    },
  { key: "SEMI_ACTIVE", label: "Intermédiaires", icon: <ArchiveRoundedIcon fontSize="small" />,           color: "info.main"       },
  { key: "PERMANENT",   label: "Historique",     icon: <MenuBookRoundedIcon fontSize="small" />,          color: "secondary.main"  },
  { key: "DESTROYED",   label: "Détruits",       icon: <DeleteSweepRoundedIcon fontSize="small" />,       color: "error.main"      },
];


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
  const location = useLocation();

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

  // Écouter le clic depuis l'arbre de navigation → ouvrir le détail
  useEffect(() => {
    const root = document.getElementById("root");
    const handler = (e: Event) => {
      const { id } = (e as CustomEvent).detail as { id: string };
      if (id) {
        setFocusedId(id);
        setDetailOpen(true);
      }
    };
    root?.addEventListener("__tree_archive_select", handler);
    return () => root?.removeEventListener("__tree_archive_select", handler);
  }, []);

  // Écouter le deep navigate — ouvrir une archive, appliquer un filtre, scroll + flash
  const apiRef = useGridApiRef();

  useEffect(() => {
    const target = location.state?.deepTarget as DeepTarget | undefined;
    if (!target) return;

    if (target.statusFilter) {
      setStatusFilter(target.statusFilter as StatusFilter);
      setQuickFilter(null);
    }

    if (target.archiveId) {
      setFocusedId(target.archiveId);
      setDetailOpen(true);

      // Attendre que les rows soient chargées puis scroller vers la ligne
      const scrollToRow = () => {
        try {
          const allRowIds = apiRef.current.getAllRowIds();
          const rowIndex = allRowIds.indexOf(target.archiveId!);
          if (rowIndex >= 0) {
            // Changer de page si nécessaire
            const pageSize = apiRef.current.state.pagination.paginationModel.pageSize;
            const targetPage = Math.floor(rowIndex / pageSize);
            apiRef.current.setPage(targetPage);

            // Scroller vers la ligne après le changement de page
            setTimeout(() => {
              apiRef.current.scrollToIndexes({ rowIndex });
              // Flash jaune sur la ligne
              setTimeout(() => {
                const el = document.querySelector(`[data-id="${target.archiveId}"]`);
                if (el) {
                  el.classList.add("geid-highlight-flash");
                  setTimeout(() => el.classList.remove("geid-highlight-flash"), 2200);
                }
              }, 300);
            }, 200);
            return true;
          }
        } catch { /* apiRef pas encore prêt */ }
        return false;
      };

      // Essayer immédiatement, sinon réessayer après chargement
      if (!scrollToRow()) {
        const interval = setInterval(() => {
          if (scrollToRow()) clearInterval(interval);
        }, 500);
        setTimeout(() => clearInterval(interval), 5000);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.deepTarget]);

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
          width: { md: 180, lg: 200 },
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
              apiRef={apiRef}
              rows={rows}
              loading={loading}
              columns={archiveColumns}
              checkboxSelection
              disableRowSelectionOnClick
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

      {/* ── Panneau droit — détail ou résumé ────────────────── */}
      {!isMobile && (
        <MuiBox
          sx={{
            width: { md: 280, lg: 320, xl: 380 },
            flexShrink: 0,
            borderLeft: 1,
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            height: "100%",
          }}
        >
          {detailOpen && focusedDoc ? (
            <DetailPanel
              doc={focusedDoc}
              canWrite={canWrite}
              isAdmin={isAdmin}
              onClose={closeDetail}
              onAction={handleAction}
            />
          ) : (
            /* Résumé + accès rapide quand rien n'est sélectionné */
            <MuiBox flex={1} overflow="auto" sx={{ ...scrollBarSx }}>
              {/* En-tête */}
              <MuiBox px={2} py={1.5} borderBottom={1} borderColor="divider">
                <Typography variant="subtitle2" fontWeight={700}>Résumé</Typography>
              </MuiBox>

              {/* Stats rapides */}
              <MuiBox px={2} py={1.5}>
                {[
                  { label: "Total", value: totalCount, color: "primary.main" },
                  { label: "En attente", value: statusCounts.PENDING, color: "warning.main" },
                  { label: "Actives", value: statusCounts.ACTIVE, color: "success.main" },
                  { label: "Intermédiaires", value: statusCounts.SEMI_ACTIVE, color: "info.main" },
                  { label: "DUA expirées", value: duaExpiredCount, color: "error.main" },
                ].map(({ label, value, color }) => (
                  <MuiBox key={label} display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
                    <MuiBox display="flex" alignItems="center" gap={1}>
                      <MuiBox sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color }} />
                      <Typography variant="caption" color="text.secondary">{label}</Typography>
                    </MuiBox>
                    <Typography variant="caption" fontWeight="bold">{value}</Typography>
                  </MuiBox>
                ))}
              </MuiBox>

              <Divider />

              {/* Suppression multiple — admin uniquement */}
              {isAdmin && (selectedElements as string[]).length > 1 && (
                <MuiBox px={2} py={1.5}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    {(selectedElements as string[]).length} archives sélectionnées
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    color="error"
                    fullWidth
                    onClick={handleBulkDelete}
                    startIcon={<DeleteOutlineOutlinedIcon />}>
                    Supprimer définitivement ({(selectedElements as string[]).length})
                  </Button>
                </MuiBox>
              )}

              {isAdmin && (selectedElements as string[]).length > 1 && <Divider />}

              {/* Accès rapide */}
              <MuiBox px={2} py={1.5}>
                <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={0.5} fontWeight="bold" display="block" mb={1}>
                  Actions rapides
                </Typography>
                <Stack spacing={0.75}>
                  {canWrite && (
                    <Button size="small" variant="outlined" fullWidth onClick={openAdd} sx={{ justifyContent: "flex-start" }}>
                      + Nouvelle archive
                    </Button>
                  )}
                  <Button size="small" variant="outlined" fullWidth color="inherit" onClick={() => {
                    document.getElementById("root")?.dispatchEvent(new CustomEvent("__global_search_open"));
                  }} sx={{ justifyContent: "flex-start" }}>
                    Rechercher (Ctrl+K)
                  </Button>
                  <Button size="small" variant="outlined" fullWidth color="inherit" onClick={exportCSV} disabled={rows.length === 0} sx={{ justifyContent: "flex-start" }}>
                    Exporter CSV ({rows.length})
                  </Button>
                </Stack>
              </MuiBox>

              <Divider />

              {/* 5 dernières archives */}
              {recentArchives.length > 0 && (
                <MuiBox px={2} py={1.5}>
                  <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={0.5} fontWeight="bold" display="block" mb={1}>
                    Dernières archives
                  </Typography>
                  <List dense disablePadding>
                    {recentArchives.slice(0, 5).map((r) => {
                      const norm = normalizeStatus(r.status as string | undefined, r.validated as boolean | undefined);
                      return (
                        <ListItemButton
                          key={r.id}
                          onClick={() => { setFocusedId(r.id as string); setDetailOpen(true); }}
                          sx={{ borderRadius: 1, py: 0.5, px: 0.5 }}>
                          <MuiBox sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: `${STATUS_COLOR[norm]}.main`, flexShrink: 0, mr: 0.75 }} />
                          <ListItemText
                            primary={(r as Record<string, unknown>).designation as string ?? r.id}
                            primaryTypographyProps={{ variant: "caption", noWrap: true }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </MuiBox>
              )}
            </MuiBox>
          )}
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
