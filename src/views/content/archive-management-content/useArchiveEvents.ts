/**
 * useArchiveEvents — Event bus listeners pour ArchiveManagementContent.
 *
 * Gère les événements lifecycle, sélection depuis l'arbre,
 * navigation vers l'élimination, et deep navigate.
 */

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/redux/store";
import { incrementVersion } from "@/redux/data";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import deepNavigate, { type DeepTarget } from "@/utils/deepNavigate";
import { STATUS_LABEL } from "@/constants/lifecycle";
import type { StatusFilter } from "./statusNav";

interface UseArchiveEventsParams {
  execLifecycle: (config: { url: string; data: Record<string, unknown> }) => Promise<unknown>;
  navigateTo: ReturnType<typeof import("@/hooks/useNavigateSetState").default>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiRef: React.MutableRefObject<any>;
  setFocusedId: (id: string | null) => void;
  setDetailOpen: (open: boolean) => void;
  setStatusFilter: (filter: StatusFilter) => void;
  setQuickFilter: (filter: "dua_expired" | "this_month" | null) => void;
}

export default function useArchiveEvents({
  execLifecycle, navigateTo, apiRef,
  setFocusedId, setDetailOpen, setStatusFilter, setQuickFilter,
}: UseArchiveEventsParams) {
  const dispatch = useDispatch<AppDispatch>();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const location = useLocation();

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
          SEMI_ACTIVE: { title: "Passage en intermédiaire",   msg: "L'archive est maintenant en phase intermédiaire. Pensez à définir sa durée de conservation pour planifier son sort final." },
          PERMANENT:   { title: "Classée en historique",      msg: "L'archive a été classée définitivement en historique. Elle sera conservée à titre permanent." },
          DESTROYED:           { title: "Archive éliminée",           msg: "L'archive a été éliminée. Cette action est irréversible — assurez-vous d'avoir conservé les documents nécessaires." },
          PROPOSED_ELIMINATION: { title: "Élimination proposée",    msg: "L'archive est proposée à l'élimination. Un procès-verbal doit être créé et approuvé avant destruction." },
        };
        const lm = lifecycleMsgs[targetStatus];
        enqueueSnackbar(lm?.msg ?? `Statut mis à jour : ${STATUS_LABEL[targetStatus] ?? targetStatus}`, {
          variant: "success",
          title: lm?.title ?? "Statut modifié",
        });
        setDetailOpen(false);
      } catch {
        enqueueSnackbar(t("notifications.errorActionFailed"), { variant: "error", title: t("notifications.errorActionFailedTitle") });
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

  // Écouter "Créer un PV" → naviguer vers l'onglet Élimination avec dialog ouvert
  useEffect(() => {
    const root = document.getElementById("root");
    const handler = () => {
      deepNavigate(navigateTo, { tab: "elimination", eliminationPvId: "__create__" });
    };
    root?.addEventListener("__navigate_to_elimination_create", handler);
    return () => root?.removeEventListener("__navigate_to_elimination_create", handler);
  }, [navigateTo]);

  // Deep navigate — ouvrir une archive, appliquer un filtre, scroll + flash
  useEffect(() => {
    const target = location.state?.deepTarget as DeepTarget | undefined;
    if (!target) return;

    if (target.quickFilter) {
      setQuickFilter(target.quickFilter as "dua_expired" | "this_month");
      setStatusFilter("ALL");
    } else if (target.statusFilter) {
      setStatusFilter(target.statusFilter as StatusFilter);
      setQuickFilter(null);
    }

    // Nettoyer deepTarget après consommation
    window.history.replaceState(
      { ...(window.history.state ?? {}), usr: { ...(window.history.state?.usr ?? {}), deepTarget: undefined } },
      ""
    );

    if (target.archiveId) {
      if (!target.statusFilter && !target.quickFilter) {
        setStatusFilter("ALL");
        setQuickFilter(null);
      }
      setFocusedId(target.archiveId);
      setDetailOpen(true);

      const scrollToRow = () => {
        try {
          const allRowIds = apiRef.current.getAllRowIds();
          const rowIndex = allRowIds.indexOf(target.archiveId!);
          if (rowIndex >= 0) {
            const pageSize = apiRef.current.state.pagination.paginationModel.pageSize;
            const targetPage = Math.floor(rowIndex / pageSize);
            apiRef.current.setPage(targetPage);

            setTimeout(() => {
              apiRef.current.scrollToIndexes({ rowIndex });
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

      if (!scrollToRow()) {
        const interval = setInterval(() => {
          if (scrollToRow()) clearInterval(interval);
        }, 500);
        setTimeout(() => clearInterval(interval), 5000);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.deepTarget]);
}
