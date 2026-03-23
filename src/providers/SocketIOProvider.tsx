/**
 * SocketIOProvider — Fournit l'instance Socket.IO à toute l'application.
 *
 * Se connecte au serveur avec le token JWT.
 * Singleton : une seule connexion WebSocket par session.
 * Pattern identique à lisolona-budget.
 */

import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { io, Socket } from "socket.io-client";
import type { RootState } from "@/redux/store";
import { SocketIOContext } from "@/hooks/useSocket";

const BASE_URL = import.meta.env.VITE_SERVER_BASE_URL as string ?? "";
const OPTIONS = { transports: ["websocket" as const] };

let socketIO: Socket | null = null;

interface Props {
  children: React.ReactNode;
}

export default React.memo(function SocketIOProvider({ children }: Props) {
  const token = useSelector((store: RootState) =>
    (store.user as Record<string, unknown>).token as string | undefined
  );
  const connected = useSelector((store: RootState) =>
    (store.user as Record<string, unknown>).connected as boolean | undefined
  );

  const socket = useMemo(() => {
    if (connected && token && !socketIO) {
      socketIO = io(`${BASE_URL}?token=${token}`, OPTIONS);
    }
    return socketIO;
  }, [connected, token]);

  return (
    <SocketIOContext.Provider value={socket}>
      {children}
    </SocketIOContext.Provider>
  );
});
