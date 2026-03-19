import { useCallback } from "react";
import useAxios from "./useAxios";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";

interface UrlProps {
  token?: string;
  [key: string]: unknown;
}

interface GetDataOptions {
  urlProps?: UrlProps;
  onBeforeUpdate?: (data: unknown) => void;
  onError?: (error: unknown) => void;
}

interface GetDataArg {
  urlProps?: UrlProps;
  [key: string]: unknown;
}

export const useGetUrlData = () => {
  const token = useSelector((store: RootState) => (store.user as { token?: string }).token);
  const getUrlData = useCallback(
    ({ token: tk }: { token?: string }) => ({
      url: `/api/stuff/archives`,
      headers: {
        Authorization: `Bearer ${token || tk}`,
      },
    }),
    [token]
  );
  return getUrlData;
};

const useGetData = ({ urlProps, onBeforeUpdate, onError }: GetDataOptions): [boolean, (data?: GetDataArg) => void] => {
  const getUrlData = useGetUrlData();

  const [{ loading }, refetch] = useAxios<unknown>(null as unknown as string, { manual: true });

  const onBefore = useCallback(
    (data: unknown) =>
      typeof onBeforeUpdate === "function" ? onBeforeUpdate(data) : data,
    [onBeforeUpdate]
  );

  const onBeforeError = useCallback(
    (error: unknown) => (typeof onError === "function" ? onError(error) : error),
    [onError]
  );

  const getData = useCallback(
    (data?: GetDataArg) =>
      refetch(getUrlData({ ...(urlProps || data?.urlProps) }))
        .then(({ data: responseData }) => {
          onBefore(responseData);
        })
        .catch(onBeforeError),
    [getUrlData, refetch, onBefore, urlProps, onBeforeError]
  );

  return [loading, getData];
};

export default useGetData;
