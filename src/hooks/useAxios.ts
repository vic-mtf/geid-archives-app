import _AXIOS from "axios";
import { makeUseAxios } from "axios-hooks";
import type { ResponseType } from "axios";

const proxyEnv = import.meta.env.VITE_PROXY as string | undefined;

export const axios = _AXIOS.create({
  baseURL: import.meta.env.VITE_SERVER_BASE_URL as string,
  responseType: (import.meta.env.VITE_RESPONSE_TYPE as ResponseType) ?? "json",
  responseEncoding: (import.meta.env.VITE_RESPONSE_ENCODING as string) ?? "utf8",
  maxContentLength: Number(import.meta.env.VITE_MAX_CONTENT_LENGTH) || 10_485_760,
  ...(proxyEnv ? { proxy: Object.fromEntries(new URLSearchParams(proxyEnv)) as unknown as false } : {}),
});

// Intercepteur global : détection de session expirée (401)
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // Déclencher la déconnexion automatique (une seule fois)
      if (!sessionExpiredTriggered) {
        sessionExpiredTriggered = true;
        document.getElementById("root")?.dispatchEvent(
          new CustomEvent("_session_expired")
        );
      }
    }
    if (import.meta.env.VITE_DEBUG === "true") {
      console.error("[GEID API]", err?.response?.status, err?.config?.url);
    }
    return Promise.reject(err);
  }
);

let sessionExpiredTriggered = false;

/** Réinitialise le flag (appelé après reconnexion) */
export function resetSessionExpiredFlag() {
  sessionExpiredTriggered = false;
}

const useAxios = makeUseAxios({ axios });

export default useAxios;
