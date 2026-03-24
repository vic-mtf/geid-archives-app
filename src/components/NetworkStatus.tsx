/**
 * NetworkStatus — Indicateur de connexion réseau.
 *
 * Affiche une barre persistante en haut de l'écran quand la connexion
 * est absente ou instable. Disparaît automatiquement quand le réseau revient.
 */

import React, { useEffect, useState } from "react";
import { Box, Slide, Stack, Typography } from "@mui/material";
import WifiOffRoundedIcon from "@mui/icons-material/WifiOffRounded";
import SignalWifiStatusbar4BarRoundedIcon from "@mui/icons-material/SignalWifiStatusbar4BarRounded";

const NetworkStatus = React.memo(function NetworkStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      if (wasOffline) {
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 4000);
      }
    };
    const goOffline = () => {
      setOnline(false);
      setWasOffline(true);
      setShowReconnected(false);
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [wasOffline]);

  // Rien à afficher si tout va bien
  if (online && !showReconnected) return null;

  return (
    <Slide direction="down" in={!online || showReconnected} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          bgcolor: online ? "#2e7d32" : "#d32f2f",
          color: "white",
          py: 0.75,
          px: 2,
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
          {online ? (
            <>
              <SignalWifiStatusbar4BarRoundedIcon sx={{ fontSize: 18 }} />
              <Typography variant="body2" fontWeight={500}>
                La connexion a été rétablie. Vos données sont à jour.
              </Typography>
            </>
          ) : (
            <>
              <WifiOffRoundedIcon sx={{ fontSize: 18 }} />
              <Typography variant="body2" fontWeight={500}>
                Pas de connexion internet. Certaines fonctionnalités ne sont pas disponibles.
              </Typography>
            </>
          )}
        </Stack>
      </Box>
    </Slide>
  );
});

export default NetworkStatus;
