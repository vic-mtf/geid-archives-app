/**
 * useAdaptiveThumbnail — Chargement progressif des miniatures.
 *
 * Cache a 3 niveaux :
 * 1. thumbCache (memoire JS) — instantane, survit aux remontages
 * 2. Cache API navigateur — persiste entre les sessions
 * 3. Fetch reseau — en dernier recours
 *
 * Dedup : pendingFetches evite les requetes concurrentes identiques.
 */

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

type Quality = "low" | "medium" | "high";
interface CacheEntry { url: string; quality: Quality; }

// Cache memoire module-level — survit aux remontages, 500 entrees max
const thumbCache = new Map<string, CacheEntry>();
const MAX_CACHE = 500;
const pendingFetches = new Map<string, Promise<string | null>>();

const CACHE_NAME = "geid-thumbnails-v2";

// Nettoyer l'ancien cache
caches.delete("geid-thumbnails-v1").catch(() => {});

function cacheKey(fileUrl: string, q: Quality) { return `${fileUrl}::${q}`; }

function getCached(fileUrl: string): CacheEntry | null {
  for (const q of ["high", "medium", "low"] as Quality[]) {
    const e = thumbCache.get(cacheKey(fileUrl, q));
    if (e) return e;
  }
  return null;
}

function evict() {
  if (thumbCache.size <= MAX_CACHE) return;
  const k = thumbCache.keys().next().value;
  if (k) { const e = thumbCache.get(k); if (e) URL.revokeObjectURL(e.url); thumbCache.delete(k); }
}

function getNetworkSpeed(): "fast" | "medium" | "slow" {
  const conn = (navigator as any).connection;
  if (!conn) return "medium";
  if (conn.effectiveType === "4g") return "fast";
  if (conn.effectiveType === "3g") return "medium";
  return "slow";
}

export default function useAdaptiveThumbnail(fileUrl: string | undefined | null) {
  const token = useSelector((store: RootState) => ((store.user as any)?.token));
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quality, setQuality] = useState<Quality | null>(null);

  useEffect(() => {
    if (!fileUrl) { setSrc(null); setQuality(null); return; }

    // 1. Cache memoire (instantane)
    const cached = getCached(fileUrl);
    if (cached) { setSrc(cached.url); setQuality(cached.quality); if (cached.quality === "high") return; }

    let cancelled = false;

    const fetchQ = async (q: Quality): Promise<string | null> => {
      const key = cacheKey(fileUrl, q);
      const ex = thumbCache.get(key);
      if (ex) return ex.url;

      // Dedup
      let pending = pendingFetches.get(key);
      if (pending) return pending;

      pending = (async () => {
        const ep = fileUrl.replace("/file/", "/thumbnail/") + `?quality=${q}`;
        try {
          // 2. Cache API navigateur
          const cache = await caches.open(CACHE_NAME).catch(() => null);
          if (cache) {
            const cachedResp = await cache.match(ep);
            if (cachedResp) {
              const blob = await cachedResp.blob();
              const url = URL.createObjectURL(blob);
              thumbCache.set(key, { url, quality: q }); evict();
              return url;
            }
          }

          // 3. Fetch reseau
          const res = await fetch(ep, { headers: { Authorization: `Bearer ${token}` } });
          if (res.status === 204 || !res.ok) return null;

          // Cloner pour le cache navigateur
          const resClone = res.clone();
          if (cache) cache.put(ep, resClone).catch(() => {});

          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          thumbCache.set(key, { url, quality: q }); evict();
          return url;
        } catch { return null; }
        finally { pendingFetches.delete(key); }
      })();

      pendingFetches.set(key, pending);
      return pending;
    };

    const run = async () => {
      if (!cached) setLoading(true);
      if (!cached || cached.quality === "low") {
        const start = performance.now();
        const low = await fetchQ("low");
        if (cancelled) return;
        if (low && (!cached || cached.quality !== "low")) { setSrc(low); setQuality("low"); }
        const elapsed = performance.now() - start;
        const speed = getNetworkSpeed();
        if (speed === "fast" || elapsed < 400) {
          const h = await fetchQ("high");
          if (!cancelled && h) { setSrc(h); setQuality("high"); }
        } else if (speed === "medium" || elapsed < 1000) {
          const m = await fetchQ("medium");
          if (!cancelled && m) { setSrc(m); setQuality("medium"); }
        }
      } else if (cached.quality === "medium" && getNetworkSpeed() === "fast") {
        const h = await fetchQ("high");
        if (!cancelled && h) { setSrc(h); setQuality("high"); }
      }
      if (!cancelled) setLoading(false);
    };

    run();
    return () => { cancelled = true; };
  }, [fileUrl, token]);

  return { src, loading, isBlurred: quality === "low" };
}
