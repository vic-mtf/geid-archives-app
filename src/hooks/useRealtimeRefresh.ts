/**
 * useRealtimeRefresh — Rafraîchissement en temps réel via Socket.IO.
 *
 * Écoute les événements du serveur pour déclencher un refetch
 * quand les données changent (un autre utilisateur a modifié quelque chose).
 * Joue un son de notification pour les événements importants.
 *
 * Événements écoutés :
 *   "archive:change"      — une archive a été créée/modifiée/supprimée
 *   "physical:change"     — un élément physique a changé
 *   "user:change"         — un utilisateur a été modifié
 *   "elimination:change"  — un PV d'élimination a changé
 */

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/redux/store";
import { incrementVersion } from "@/redux/data";
import useSocket from "@/hooks/useSocket";
import playSound from "@/utils/notificationSound";

export default function useRealtimeRefresh() {
  const socket = useSocket();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (!socket) return;

    const handleChange = () => {
      dispatch(incrementVersion());
    };

    const handleArchiveChange = () => {
      handleChange();
      playSound("notification", 0.2);
    };

    const handleEliminationChange = () => {
      handleChange();
      playSound("alert", 0.25);
    };

    socket.on("archive:change", handleArchiveChange);
    socket.on("physical:change", handleChange);
    socket.on("user:change", handleChange);
    socket.on("elimination:change", handleEliminationChange);

    return () => {
      socket.off("archive:change", handleArchiveChange);
      socket.off("physical:change", handleChange);
      socket.off("user:change", handleChange);
      socket.off("elimination:change", handleEliminationChange);
    };
  }, [socket, dispatch]);
}
