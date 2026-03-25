import store from "@/redux/store";
import i18n from "@/i18n/i18n";

const BASE = (import.meta.env.VITE_SERVER_BASE_URL as string) ?? "";

let loading = false;
let activeController: AbortController | null = null;

let _onProgress: ((state: FileLoadingState) => void) | null = null;

export interface FileLoadingState {
  open: boolean;
  fileName: string;
  progress: number;
  received: number;
  total: number;
  error: string | null;
  cancelled: boolean;
}

const INITIAL_STATE: FileLoadingState = {
  open: false, fileName: "", progress: 0, received: 0, total: 0, error: null, cancelled: false,
};

export function setProgressCallback(cb: typeof _onProgress) {
  _onProgress = cb;
}

export function cancelFileLoading() {
  if (activeController) {
    activeController.abort();
    activeController = null;
    loading = false;
    _onProgress?.({ ...INITIAL_STATE, open: true, cancelled: true });
    setTimeout(() => _onProgress?.({ ...INITIAL_STATE }), 2500);
  }
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

// ── Cache mémoire — évite de re-télécharger un fichier déjà ouvert ──────────

const fileCache = new Map<string, { blob: Blob; url: string }>();
const MAX_CACHE = 20; // max 20 fichiers en cache

function getCached(archiveId: string): string | null {
  const entry = fileCache.get(archiveId);
  if (!entry) return null;
  // Vérifier que le blob URL est encore valide en testant sa taille
  if (entry.blob.size > 0) return entry.url;
  // URL révoquée — supprimer du cache
  fileCache.delete(archiveId);
  return null;
}

function addToCache(archiveId: string, blob: Blob): string {
  // Nettoyer le cache si trop plein (supprimer les plus anciens)
  if (fileCache.size >= MAX_CACHE) {
    const oldest = fileCache.keys().next().value;
    if (oldest) {
      const old = fileCache.get(oldest);
      if (old) URL.revokeObjectURL(old.url);
      fileCache.delete(oldest);
    }
  }
  const url = URL.createObjectURL(blob);
  fileCache.set(archiveId, { blob, url });
  return url;
}

// ── Fonction principale ─────────────────────────────────────────────────────

export default async function openArchiveFile(archiveId: string, fileName?: string): Promise<void> {
  if (loading) return;
  const displayName = fileName || "Fichier";

  // Cache — si déjà téléchargé, ouvrir directement
  const cachedUrl = getCached(archiveId);
  if (cachedUrl) {
    window.open(cachedUrl, "_blank");
    return;
  }

  // Pas de réseau → message clair
  if (!navigator.onLine) {
    _onProgress?.({
      ...INITIAL_STATE,
      open: true,
      fileName: displayName,
      error: i18n.t("network.offlineError"),
    });
    setTimeout(() => _onProgress?.({ ...INITIAL_STATE }), 5000);
    return;
  }

  const token = (store.getState().user as { token?: string }).token;
  if (!token) return;

  loading = true;
  activeController = new AbortController();

  _onProgress?.({ ...INITIAL_STATE, open: true, fileName: displayName });

  try {
    const res = await fetch(`${BASE}/api/stuff/archives/file/${archiveId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: activeController.signal,
    });

    if (!res.ok) {
      const errorMsg = res.status === 403
        ? i18n.t("network.forbidden")
        : res.status === 404
          ? i18n.t("network.notFound")
          : i18n.t("network.unexpectedError");
      _onProgress?.({ ...INITIAL_STATE, open: true, fileName: displayName, error: errorMsg });
      setTimeout(() => _onProgress?.({ ...INITIAL_STATE }), 5000);
      return;
    }

    const contentLength = Number(res.headers.get("content-length") ?? 0);
    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const reader = res.body?.getReader();

    if (!reader) {
      const rawBlob = await res.blob();
      _onProgress?.({ ...INITIAL_STATE });
      const blob = new Blob([rawBlob], { type: contentType });
      window.open(addToCache(archiveId, blob), "_blank");
      return;
    }

    const chunks: BlobPart[] = [];
    let received = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;

      const progress = contentLength > 0 ? Math.round((received / contentLength) * 100) : -1;
      _onProgress?.({ open: true, fileName: displayName, progress, received, total: contentLength, error: null, cancelled: false });
    }

    _onProgress?.({ ...INITIAL_STATE });
    const blob = new Blob(chunks, { type: contentType });
    window.open(addToCache(archiveId, blob), "_blank");

  } catch (err: unknown) {
    if ((err as Error).name === "AbortError") {
      // Géré dans cancelFileLoading
    } else {
      const errorMsg = !navigator.onLine
        ? i18n.t("network.connectionLost")
        : i18n.t("network.loadingFailed");
      _onProgress?.({
        ...INITIAL_STATE,
        open: true,
        fileName: displayName,
        error: errorMsg,
      });
      setTimeout(() => _onProgress?.({ ...INITIAL_STATE }), 5000);
    }
  } finally {
    loading = false;
    activeController = null;
  }
}
