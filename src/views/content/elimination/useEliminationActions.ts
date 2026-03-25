/**
 * useEliminationActions — Hook pour les actions CRUD sur les PV d'elimination.
 *
 * Chaque action appelle l'endpoint, affiche un snackbar et
 * declenche incrementVersion() pour rafraichir les donnees.
 */

import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import { axios } from "@/hooks/useAxios";
import useToken from "@/hooks/useToken";
import { incrementVersion } from "@/redux/data";
import type { AppDispatch } from "@/redux/store";

const BASE = "/api/stuff/archives/elimination";

export default function useEliminationActions() {
  const Authorization = useToken();
  const dispatch = useDispatch<AppDispatch>();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const run = useCallback(
    async (label: string, config: { url: string; method: string; data?: unknown }) => {
      setLoading(true);
      try {
        await axios({
          ...config,
          headers: { Authorization: Authorization ?? "" },
        });
        dispatch(incrementVersion());
        enqueueSnackbar(t(`elimination.success.${label}`), { variant: "success" });
      } catch {
        enqueueSnackbar(t(`elimination.error.${label}`), { variant: "error" });
      } finally {
        setLoading(false);
      }
    },
    [Authorization, dispatch, enqueueSnackbar, t],
  );

  const createPv = useCallback(
    (archives: string[], motif: string, administrativeUnit: string) =>
      run("create", { url: BASE, method: "POST", data: { archives, motif, administrativeUnit } }),
    [run],
  );

  const submitPv = useCallback(
    (id: string) => run("submit", { url: `${BASE}/${id}/submit`, method: "PATCH" }),
    [run],
  );

  const approveProducer = useCallback(
    (id: string, note?: string) =>
      run("approveProducer", { url: `${BASE}/${id}/approve-producer`, method: "PATCH", data: { note } }),
    [run],
  );

  const approveDantic = useCallback(
    (id: string, note?: string) =>
      run("approveDantic", { url: `${BASE}/${id}/approve-dantic`, method: "PATCH", data: { note } }),
    [run],
  );

  const rejectPv = useCallback(
    (id: string, note?: string) =>
      run("reject", { url: `${BASE}/${id}/reject`, method: "PATCH", data: { note } }),
    [run],
  );

  const executePv = useCallback(
    (id: string) => run("execute", { url: `${BASE}/${id}/execute`, method: "POST" }),
    [run],
  );

  const getPdfUrl = useCallback(
    (id: string) => `${import.meta.env.VITE_SERVER_BASE_URL as string}${BASE}/${id}/pdf`,
    [],
  );

  return {
    createPv,
    submitPv,
    approveProducer,
    approveDantic,
    rejectPv,
    executePv,
    getPdfUrl,
    loading,
  };
}
