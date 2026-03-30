/**
 * useVideoInfo — Cache global des infos video (duree, resolution).
 *
 * Un seul fetch par URL, resultat cache en memoire pour toute la session.
 * Si les props contiennent deja les infos (du backend), pas de fetch.
 */

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

interface VideoInfo {
  duration: string | null;
  ratio: number;
}

// Cache global module-level — survit aux remontages
const videoInfoCache = new Map<string, VideoInfo>();
const pendingFetches = new Map<string, Promise<VideoInfo | null>>();

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function useVideoInfo(
  fileUrl: string | undefined | null,
  propsDuration?: string | null,
  propsWidth?: number | null,
  propsHeight?: number | null,
) {
  const token = useSelector((store: RootState) => ((store.user as any)?.token));

  // Si les props fournissent tout, pas besoin de fetch
  const hasPropsInfo = !!(propsDuration && propsWidth && propsHeight);

  const [info, setInfo] = useState<VideoInfo>(() => {
    if (hasPropsInfo) {
      return { duration: propsDuration!, ratio: propsHeight! > 0 ? propsWidth! / propsHeight! : 16 / 9 };
    }
    if (fileUrl && videoInfoCache.has(fileUrl)) {
      return videoInfoCache.get(fileUrl)!;
    }
    return { duration: propsDuration || null, ratio: propsWidth && propsHeight ? propsWidth / propsHeight : 16 / 9 };
  });

  useEffect(() => {
    if (hasPropsInfo || !fileUrl) return;
    if (videoInfoCache.has(fileUrl)) {
      setInfo(videoInfoCache.get(fileUrl)!);
      return;
    }

    // Dedup les fetches concurrents
    let pending = pendingFetches.get(fileUrl);
    if (!pending) {
      const infoUrl = fileUrl.replace("/file/", "/video-info/");
      pending = fetch(infoUrl, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.ok ? r.json() : null)
        .then((d) => {
          if (!d) return null;
          const result: VideoInfo = {
            duration: d.durationSeconds && !isNaN(d.durationSeconds)
              ? formatDuration(d.durationSeconds)
              : d.duration || null,
            ratio: d.width && d.height && d.height > 0 ? d.width / d.height : 16 / 9,
          };
          videoInfoCache.set(fileUrl, result);
          return result;
        })
        .catch(() => null)
        .finally(() => pendingFetches.delete(fileUrl));
      pendingFetches.set(fileUrl, pending);
    }

    pending.then((result) => {
      if (result) setInfo(result);
    });
  }, [fileUrl, token, hasPropsInfo]);

  return info;
}
