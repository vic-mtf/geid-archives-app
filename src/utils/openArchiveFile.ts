import store from "@/redux/store";

const BASE = (import.meta.env.VITE_SERVER_BASE_URL as string) ?? "";

let loading = false;
let activeController: AbortController | null = null;

let _enqueue: ((msg: string, opts?: Record<string, unknown>) => unknown) | null = null;
let _close: ((key: unknown) => void) | null = null;

export function setSnackbarFunctions(
  enqueue: typeof _enqueue,
  close: typeof _close,
) {
  _enqueue = enqueue;
  _close = close;
}

/** Annule le chargement en cours */
export function cancelFileLoading() {
  if (activeController) {
    activeController.abort();
    activeController = null;
    loading = false;
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

/**
 * Ouvre le fichier d'une archive via l'endpoint authentifié.
 * Affiche la progression + possibilité d'annuler.
 */
export default async function openArchiveFile(archiveId: string): Promise<void> {
  if (loading) {
    _enqueue?.("Un fichier est déjà en cours de chargement, veuillez patienter.", { variant: "warning" });
    return;
  }
  const token = (store.getState().user as { token?: string }).token;
  if (!token) return;

  loading = true;
  activeController = new AbortController();
  let snackKey: unknown = null;

  // Premier snackbar — début du chargement
  snackKey = _enqueue?.("Connexion au serveur…", {
    variant: "info",
    autoHideDuration: null,
    title: "Ouverture du fichier",
  });

  try {
    const res = await fetch(`${BASE}/api/stuff/archives/file/${archiveId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: activeController.signal,
    });

    if (!res.ok) {
      _close?.(snackKey);
      if (res.status === 403) {
        _enqueue?.("Vous n'avez pas les droits nécessaires pour accéder à ce fichier.", { variant: "error", title: "Accès refusé" });
      } else if (res.status === 404) {
        _enqueue?.("Ce fichier est introuvable. Il a peut-être été supprimé.", { variant: "error", title: "Fichier introuvable" });
      } else {
        _enqueue?.("Une erreur est survenue lors de la récupération du fichier.", { variant: "error" });
      }
      return;
    }

    // Lire le stream avec progression
    const contentLength = Number(res.headers.get("content-length") ?? 0);
    const reader = res.body?.getReader();

    if (!reader) {
      // Fallback si pas de stream
      const blob = await res.blob();
      _close?.(snackKey);
      openBlob(blob);
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

      // Mettre à jour le snackbar avec la progression
      const progress = contentLength > 0
        ? `${Math.round((received / contentLength) * 100)} %`
        : formatSize(received);

      _close?.(snackKey);
      snackKey = _enqueue?.(`Chargement en cours… ${progress}`, {
        variant: "info",
        autoHideDuration: null,
        title: "Ouverture du fichier",
      });
    }

    _close?.(snackKey);

    const blob = new Blob(chunks);
    openBlob(blob);

  } catch (err: unknown) {
    _close?.(snackKey);
    if ((err as Error).name === "AbortError") {
      _enqueue?.("Le chargement du fichier a été annulé.", { variant: "warning", title: "Annulé" });
    } else {
      _enqueue?.("Le chargement du fichier a échoué. Vérifiez votre connexion et réessayez.", { variant: "error", title: "Erreur de chargement" });
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
