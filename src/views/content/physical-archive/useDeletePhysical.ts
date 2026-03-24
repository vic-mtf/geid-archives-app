import { useState, useCallback } from "react";
import { useSnackbar } from "notistack";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/redux/store";
import { incrementVersion, setCacheEntry, invalidateCache as invalidateCacheAction } from "@/redux/data";
import useAxios from "@/hooks/useAxios";
import type { PhysicalLevel } from "@/constants/physical";
import type { BreadcrumbItem } from "./BreadcrumbBar";

interface DeleteTarget {
  level: PhysicalLevel;
  id: string;
  label: string;
}

const DELETE_ENDPOINTS: Record<PhysicalLevel, string> = {
  container: "/api/stuff/archives/physical/containers",
  shelf:     "/api/stuff/archives/physical/shelves",
  floor:     "/api/stuff/archives/physical/floors",
  binder:    "/api/stuff/archives/physical/binders",
  record:    "/api/stuff/archives/physical/records",
  document:  "/api/stuff/archives/physical/documents",
};

const LEVEL_LABELS: Record<string, string> = {
  container: "conteneur", shelf: "étagère", floor: "niveau",
  binder: "classeur", record: "dossier", document: "document",
};

const NEXT_LEVELS: Record<string, string> = {
  container: "shelf", shelf: "floor", floor: "binder",
  binder: "record", record: "document", document: "document",
};

export default function useDeletePhysical(
  headers: Record<string, string>,
  breadcrumb: BreadcrumbItem[],
  setBreadcrumb: React.Dispatch<React.SetStateAction<BreadcrumbItem[]>>,
  setSelected: (v: null) => void,
  setLevelData: React.Dispatch<React.SetStateAction<unknown[]>>,
  executeFetch: (config: { url: string; method?: string; data?: Record<string, unknown> }) => Promise<{ data: unknown }>,
) {
  const dispatch = useDispatch<AppDispatch>();
  const { enqueueSnackbar } = useSnackbar();

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [, executeDelete] = useAxios(
    { method: "DELETE", headers },
    { manual: true }
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget || deleting) return;
    const levelLabel = LEVEL_LABELS[deleteTarget.level] ?? "élément";

    setDeleting(true);
    try {
      await executeDelete({ url: `${DELETE_ENDPOINTS[deleteTarget.level]}/${deleteTarget.id}` });

      const deletedLabel = deleteTarget.label;
      const deletedId = deleteTarget.id;
      setDeleteTarget(null);
      setSelected(null);

      let newBreadcrumb = [...breadcrumb];
      if (newBreadcrumb.length > 0 && newBreadcrumb[newBreadcrumb.length - 1].id === deletedId) {
        newBreadcrumb = newBreadcrumb.slice(0, -1);
      }
      setBreadcrumb(newBreadcrumb);

      dispatch(invalidateCacheAction("/api/stuff/archives/physical"));
      dispatch(incrementVersion());

      const base = "/api/stuff/archives/physical";
      const newParentId = newBreadcrumb.length > 0 ? newBreadcrumb[newBreadcrumb.length - 1].id : undefined;
      const newParentLevel = newBreadcrumb.length > 0 ? newBreadcrumb[newBreadcrumb.length - 1].level : undefined;
      const newLevel = newBreadcrumb.length > 0 ? NEXT_LEVELS[newBreadcrumb[newBreadcrumb.length - 1].level] : "container";

      let refetchUrl: string;
      if (newLevel === "container") refetchUrl = `${base}/containers`;
      else if (newLevel === "shelf") refetchUrl = `${base}/shelves/container/${newParentId}`;
      else if (newLevel === "floor") refetchUrl = `${base}/floors/shelf/${newParentId}`;
      else if (newLevel === "binder") refetchUrl = `${base}/binders/floor/${newParentId}`;
      else if (newLevel === "record") refetchUrl = `${base}/records/binder/${newParentId}`;
      else refetchUrl = newParentLevel === "record" ? `${base}/documents/record/${newParentId}` : `${base}/documents/parent/${newParentId}`;

      executeFetch({ url: refetchUrl })
        .then((res) => {
          const fresh = (res.data as unknown[]) ?? [];
          setLevelData(fresh);
          dispatch(setCacheEntry({ url: refetchUrl, data: fresh }));
        })
        .catch(() => setLevelData([]));

      enqueueSnackbar(
        `Le ${levelLabel} « ${deletedLabel} » a bien été supprimé. Les éléments qui y étaient rattachés ne sont plus liés à cet emplacement.`,
        { variant: "success" }
      );
    } catch (err: unknown) {
      const serverMsg = ((err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message)
        ?? ((err as { response?: { data?: { error?: string } } })?.response?.data?.error);
      enqueueSnackbar(
        serverMsg ?? `La suppression n'a pas pu être effectuée. Cet élément contient peut-être des sous-éléments qui doivent être supprimés en premier.`,
        { variant: "error" }
      );
    } finally {
      setDeleting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteTarget, deleting, breadcrumb]);

  return { deleteTarget, setDeleteTarget, deleting, handleDeleteConfirm };
}
