/**
 * useRealtimeRefresh — Rafraîchissement en temps réel via Socket.IO.
 *
 * Écoute les événements du serveur pour déclencher un refetch
 * quand les données changent (un autre utilisateur a modifié quelque chose).
 *
 * Événements écoutés :
 *   "archive:change"  — une archive a été créée/modifiée/supprimée
 *   "physical:change" — un élément physique a changé
 *   "user:change"     — un utilisateur a été modifié
 *
 * Usage :
 *   useRealtimeRefresh(); // dans un composant — déclenche incrementVersion()
 */

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/redux/store";
import { incrementVersion } from "@/redux/data";
import useSocket from "@/hooks/useSocket";

export default function useRealtimeRefresh() {
  const socket = useSocket();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (!socket) return;

    const handleChange = () => {
      dispatch(incrementVersion());
    };

    socket.on("archive:change", handleChange);
    socket.on("physical:change", handleChange);
    socket.on("user:change", handleChange);

    return () => {
      socket.off("archive:change", handleChange);
      socket.off("physical:change", handleChange);
      socket.off("user:change", handleChange);
    };
  }, [socket, dispatch]);
}
