/**
 * useApiCache — Cache stale-while-revalidate via Redux.
 *
 * Le cache est stocké dans le slice Redux `data.apiCache`,
 * persisté en sessionStorage. Il survit aux navigations entre onglets.
 *
 * Premier appel (pas de cache) : chargement visible.
 * Appels suivants : données du cache instantanées + revalidation silencieuse.
 *
 * Usage :
 *   const { data, loading, refetch } = useApiCache<T>("/api/...", headers);
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { setCacheEntry } from "@/redux/data";
import type { ApiCacheEntry } from "@/redux/data";
import useAxios from "@/hooks/useAxios";

/** Durée avant revalidation en arrière-plan (30 secondes) */
const STALE_MS = 30_000;

export interface UseApiCacheResult<T> {
  /** Données (cache ou fresh) */
  data: T | null;
  /** True seulement au premier chargement (pas de cache) */
  loading: boolean;
  /** True pendant la revalidation en arrière-plan */
  revalidating: boolean;
  /** Force un refetch (silencieux si données en cache) */
  refetch: () => void;
}

export default function useApiCache<T = unknown>(
  url: string | null,
  headers: Record<string, string>,
): UseApiCacheResult<T> {
  const dispatch = useDispatch<AppDispatch>();
  const cached = useSelector((store: RootState) =>
    url ? ((store.data as unknown as Record<string, unknown>).apiCache as Record<string, ApiCacheEntry> | undefined)?.[url] : undefined
  );

  const [data, setData] = useState<T | null>((cached?.data as T) ?? null);
  const [loading, setLoading] = useState(!cached && !!url);
  const [revalidating, setRevalidating] = useState(false);
  const mountedRef = useRef(true);

  const [, execute] = useAxios<T>({ headers }, { manual: true });

  const fetchData = useCallback(async (silent: boolean) => {
    if (!url) return;
    if (!silent) setLoading(true);
    else setRevalidating(true);

    try {
      const res = await execute({ url });
      const freshData = res.data as T;
      if (mountedRef.current) {
        setData(freshData);
        dispatch(setCacheEntry({ url, data: freshData }));
      }
    } catch {
      // Garder les données du cache en cas d'erreur
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRevalidating(false);
      }
    }
  }, [url, execute, dispatch]);

  // Premier rendu : cache instantané ou fetch visible
  useEffect(() => {
    mountedRef.current = true;
    if (!url) { setData(null); setLoading(false); return; }

    if (cached) {
      setData(cached.data as T);
      setLoading(false);
      // Revalider si stale
      if (Date.now() - cached.timestamp > STALE_MS) {
        fetchData(true);
      }
    } else {
      fetchData(false);
    }

    return () => { mountedRef.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const refetch = useCallback(() => fetchData(!!data), [fetchData, data]);

  return { data, loading, revalidating, refetch };
}

// Ré-exports pour utilisation dans les composants
export { invalidateCache } from "@/redux/data";
