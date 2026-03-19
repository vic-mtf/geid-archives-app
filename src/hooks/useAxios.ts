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

// Intercepteur : log des erreurs en développement
if (import.meta.env.VITE_DEBUG === "true") {
  axios.interceptors.response.use(
    (res) => res,
    (err) => {
      console.error("[GEID API]", err?.response?.status, err?.config?.url, err?.response?.data);
      return Promise.reject(err);
    }
  );
}

const useAxios = makeUseAxios({ axios });

export default useAxios;
