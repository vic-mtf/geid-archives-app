import store from "@/redux/store";

const BASE = (import.meta.env.VITE_SERVER_BASE_URL as string) ?? "";

/** Verrou pour empêcher les doubles clics */
let loading = false;

/** Callback snackbar — injecté depuis un composant React */
let _enqueue: ((msg: string, opts?: Record<string, unknown>) => unknown) | null = null;
let _close: ((key: unknown) => void) | null = null;

export function setSnackbarFunctions(
  enqueue: typeof _enqueue,
  close: typeof _close,
) {
  _enqueue = enqueue;
  _close = close;
}

/**
 * Ouvre le fichier d'une archive via l'endpoint authentifié.
 * Affiche un snackbar de chargement. Double clic protégé.
 */
export default async function openArchiveFile(archiveId: string): Promise<void> {
  if (loading) {
    _enqueue?.("Un fichier est déjà en cours de chargement, veuillez patienter.", { variant: "warning" });
    return;
  }
  const token = (store.getState().user as { token?: string }).token;
  if (!token) return;

  loading = true;

  const snackKey = _enqueue?.("Chargement du fichier en cours, veuillez patienter…", {
    variant: "info",
    autoHideDuration: null,
    title: "Ouverture du fichier",
  });

  try {
    const res = await fetch(`${BASE}/api/stuff/archives/file/${archiveId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    _close?.(snackKey);

    if (!res.ok) {
      _enqueue?.(
        res.status === 403
          ? "Vous n'avez pas les droits nécessaires pour accéder à ce fichier."
          : "Le fichier est introuvable ou une erreur est survenue.",
        { variant: "error" }
      );
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch {
    _close?.(snackKey);
    _enqueue?.("Le chargement du fichier a échoué. Vérifiez votre connexion.", { variant: "error" });
  } finally {
    loading = false;
  }
}
