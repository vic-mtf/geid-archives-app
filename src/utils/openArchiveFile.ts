import store from "@/redux/store";

const BASE = (import.meta.env.VITE_SERVER_BASE_URL as string) ?? "";

let loading = false;
let activeController: AbortController | null = null;

// Callbacks injectés depuis React
let _enqueue: ((msg: string, opts?: Record<string, unknown>) => unknown) | null = null;
let _close: ((key: unknown) => void) | null = null;

// Callback de mise à jour de la progression (pour le composant React)
let _onProgress: ((state: FileLoadingState) => void) | null = null;

export interface FileLoadingState {
  open: boolean;
  fileName: string;
  progress: number; // 0-100, -1 si taille inconnue
  received: number; // octets reçus
  total: number;    // octets totaux (0 si inconnu)
  error: string | null;
  cancelled: boolean;
}

const INITIAL_STATE: FileLoadingState = {
  open: false, fileName: "", progress: 0, received: 0, total: 0, error: null, cancelled: false,
};

export function setSnackbarFunctions(
  enqueue: typeof _enqueue,
  close: typeof _close,
) {
  _enqueue = enqueue;
  _close = close;
}

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

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export { formatSize };

/**
 * Ouvre le fichier d'une archive via l'endpoint authentifié.
 */
export default async function openArchiveFile(archiveId: string, fileName?: string): Promise<void> {
  if (loading) return;
  const token = (store.getState().user as { token?: string }).token;
  if (!token) return;

  loading = true;
  activeController = new AbortController();
  const displayName = fileName || "Fichier";

  _onProgress?.({ ...INITIAL_STATE, open: true, fileName: displayName });

  try {
    const res = await fetch(`${BASE}/api/stuff/archives/file/${archiveId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: activeController.signal,
    });

    if (!res.ok) {
      const errorMsg = res.status === 403
        ? "Vous n'avez pas les droits nécessaires pour accéder à ce fichier."
        : res.status === 404
          ? "Ce fichier est introuvable. Il a peut-être été supprimé ou déplacé."
          : "Une erreur inattendue est survenue lors de la récupération du fichier.";
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
      openBlob(new Blob([rawBlob], { type: contentType }));
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
    openBlob(new Blob(chunks, { type: contentType }));

  } catch (err: unknown) {
    if ((err as Error).name === "AbortError") {
      // Déjà géré dans cancelFileLoading
    } else {
      _onProgress?.({
        ...INITIAL_STATE,
        open: true,
        fileName: displayName,
        error: "Le chargement a échoué. Vérifiez votre connexion et réessayez.",
      });
      setTimeout(() => _onProgress?.({ ...INITIAL_STATE }), 5000);
    }
  } finally {
    loading = false;
    activeController = null;
  }
}

function openBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
