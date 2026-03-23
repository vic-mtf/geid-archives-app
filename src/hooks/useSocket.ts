/**
 * useSocket — Hook d'accès au client Socket.IO.
 *
 * Retourne l'instance Socket.IO depuis le contexte.
 * Utilisé pour le rafraîchissement en temps réel du tableau de bord.
 *
 * Pattern identique à lisolona-budget.
 */

import { useContext, createContext } from "react";
import type { Socket } from "socket.io-client";

export const SocketIOContext = createContext<Socket | null>(null);

const useSocket = (): Socket | null => useContext(SocketIOContext);

export default useSocket;
