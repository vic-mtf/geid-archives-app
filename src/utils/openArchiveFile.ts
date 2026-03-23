import store from "@/redux/store";

const BASE = (import.meta.env.VITE_SERVER_BASE_URL as string) ?? "";

/**
 * Ouvre le fichier d'une archive via l'endpoint authentifie.
 * Fait un fetch avec le token JWT, cree un blob URL et l'ouvre dans un nouvel onglet.
 */
export default async function openArchiveFile(archiveId: string): Promise<void> {
  const token = (store.getState().user as { token?: string }).token;
  if (!token) return;

  const res = await fetch(`${BASE}/api/stuff/archives/file/${archiveId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");

  // Liberer la memoire apres un delai
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
