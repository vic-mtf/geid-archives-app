import _AXIOS from "axios";
import { makeUseAxios } from "axios-hooks";
import queryString from "query-string";

import type { ResponseType } from "axios";

export const axios = _AXIOS.create({
  baseURL: import.meta.env.VITE_SERVER_BASE_URL as string,
  responseType: import.meta.env.VITE_RESPONSE_TYPE as ResponseType,
  responseEncoding: import.meta.env.VITE_RESPONSE_ENCODING as string,
  maxContentLength: Number(import.meta.env.VITE_MAX_CONTENT_LENGTH),
  proxy: queryString.parse(import.meta.env.VITE_PROXY as string) as unknown as false,
});

const useAxios = makeUseAxios({ axios });

export default useAxios;
