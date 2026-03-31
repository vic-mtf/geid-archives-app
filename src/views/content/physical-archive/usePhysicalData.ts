/**
 * usePhysicalData — Chargement des données physiques avec cache Redux.
 *
 * Gère le fetch initial, le cache instantané, la revalidation,
 * et le refetch après mutation (dataVersion).
 */

import { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { setCacheEntry, invalidateCache as invalidateCacheAction } from "@/redux/data";
import type { ApiCacheEntry } from "@/redux/data";
import useAxios from "@/hooks/useAxios";
import type { PhysicalLevel } from "@/constants/physical";

type Level = PhysicalLevel;

interface UsePhysicalDataParams {
  currentLevel: Level;
  parentId: string | undefined;
  parentLevel: Level | undefined;
  dataVersion: number;
  headers: Record<string, string>;
}

export default function usePhysicalData({
  currentLevel, parentId, parentLevel, dataVersion, headers,
}: UsePhysicalDataParams) {
  const dispatch = useDispatch<AppDispatch>();
  const [levelData, setLevelData] = useState<unknown[]>([]);
  const [levelLoading, setLevelLoading] = useState(false);
  const [, executeFetch] = useAxios({ headers }, { manual: true });

  // URL à charger selon le niveau courant et le parent
  const currentUrl = useMemo(() => {
    const base = "/api/stuff/archives/physical";
    switch (currentLevel) {
      case "container": return `${base}/containers`;
      case "shelf":     return parentId ? `${base}/shelves/container/${parentId}` : null;
      case "floor":     return parentId ? `${base}/floors/shelf/${parentId}` : null;
      case "binder":    return parentId ? `${base}/binders/floor/${parentId}` : null;
      case "record":    return parentId ? `${base}/records/binder/${parentId}` : null;
      case "document":  return parentId
        ? parentLevel === "record"
          ? `${base}/documents/record/${parentId}`
          : `${base}/documents/parent/${parentId}`
        : null;
    }
  }, [currentLevel, parentId, parentLevel]);

  // Cache Redux pour les données physiques
  const apiCache = useSelector((store: RootState) =>
    (store.data as unknown as Record<string, unknown>).apiCache as Record<string, ApiCacheEntry> | undefined
  );

  // Charger les données quand l'URL change — cache instantané puis revalidation
  useEffect(() => {
    if (!currentUrl) { setLevelData([]); setLevelLoading(false); return; }
    let cancelled = false;

    const cached = apiCache?.[currentUrl];
    if (cached) {
      setLevelData((cached.data as unknown[]) ?? []);
      setLevelLoading(false);
      if (Date.now() - cached.timestamp > 30_000) {
        executeFetch({ url: currentUrl })
          .then((res) => {
            if (!cancelled) {
              const fresh = (res.data as unknown[]) ?? [];
              setLevelData(fresh);
              dispatch(setCacheEntry({ url: currentUrl, data: fresh }));
            }
          })
          .catch(() => {});
      }
    } else {
      const loadingTimer = setTimeout(() => { if (!cancelled) setLevelLoading(true); }, 150);
      executeFetch({ url: currentUrl })
        .then((res) => {
          if (!cancelled) {
            clearTimeout(loadingTimer);
            const fresh = (res.data as unknown[]) ?? [];
            setLevelData(fresh);
            dispatch(setCacheEntry({ url: currentUrl, data: fresh }));
          }
        })
        .catch(() => { if (!cancelled) { clearTimeout(loadingTimer); setLevelData([]); } })
        .finally(() => { if (!cancelled) setLevelLoading(false); });
    }

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUrl]);

  // Refetch après une mutation
  useEffect(() => {
    if (dataVersion > 0) {
      dispatch(invalidateCacheAction("/api/stuff/archives/physical"));
      if (currentUrl) {
        executeFetch({ url: currentUrl })
          .then((res) => {
            const fresh = (res.data as unknown[]) ?? [];
            setLevelData(fresh);
            dispatch(setCacheEntry({ url: currentUrl, data: fresh }));
          })
          .catch(() => {});
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVersion]);

  // ── Archives liées au document courant ─────────────────────
  const isInsideDocument = currentLevel === "document" && parentLevel === "document";
  const [docArchives, setDocArchives] = useState<Array<{
    _id: string; designation?: string; fileUrl?: string; classNumber?: string; createdAt?: string;
  }>>([]);

  useEffect(() => {
    if (!isInsideDocument || !parentId) { setDocArchives([]); return; }
    executeFetch({ url: `/api/stuff/archives/physical/documents/${parentId}/archives` })
      .then((res) => {
        const data = res.data as { archives?: typeof docArchives };
        setDocArchives(data?.archives ?? []);
      })
      .catch(() => setDocArchives([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInsideDocument, parentId, dataVersion]);

  // ── Items courants (transformation pour affichage) ──────────
  const items = useMemo<{ id: string; label: string; sub?: string; meta?: string; isArchive?: boolean; fileUrl?: string }[]>(() => {
    const data = levelData as Record<string, unknown>[];
    switch (currentLevel) {
      case "container":
        return data.map((c) => ({ id: c._id as string, label: c.name as string, sub: c.location as string, meta: c.description as string }));
      case "shelf":
        return data.map((s) => ({ id: s._id as string, label: s.name as string, sub: s.description as string }));
      case "floor":
        return data.map((f) => ({ id: f._id as string, label: (f.label as string) ?? `Étage ${f.number}`, sub: `N° ${f.number}` }));
      case "binder":
        return data.map((b) => ({ id: b._id as string, label: b.name as string, sub: `Nature : ${b.nature}`, meta: `${b.currentCount ?? 0} / ${b.maxCapacity} dossiers` }));
      case "record":
        return data.map((r) => ({ id: r._id as string, label: r.internalNumber as string, sub: r.subject as string, meta: r.nature as string }));
      case "document": {
        const docs = data.map((d) => ({
          id: d._id as string,
          label: d.title as string,
          sub: (d.nature as string) ?? (d.description as string),
          meta: d.documentDate ? new Date(d.documentDate as string).toLocaleDateString("fr-FR") : undefined,
        }));
        const archives = docArchives.map((a) => ({
          id: a._id,
          label: a.designation ?? "Archive",
          sub: a.classNumber ? `N° ${a.classNumber}` : undefined,
          meta: a.createdAt ? new Date(a.createdAt).toLocaleDateString("fr-FR") : undefined,
          isArchive: true,
          fileUrl: a.fileUrl,
        }));
        return [...docs, ...archives];
      }
      default:
        return [];
    }
  }, [currentLevel, levelData, docArchives]);

  return { levelData, setLevelData, levelLoading, executeFetch, apiCache, currentUrl, docArchives, isInsideDocument, items };
}
