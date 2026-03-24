/**
 * NetworkStatus — Indicateur de connexion réseau.
 *
 * Affiche une barre en bas de l'écran quand la connexion est absente.
 * Ne bloque pas la navigation ni le header.
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

  if (online && !showReconnected) return null;

  return (
    <Slide direction="up" in={!online || showReconnected} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1300,
          bgcolor: online ? "#2e7d32" : "#d32f2f",
          color: "white",
          py: 0.75,
          px: 2,
          pointerEvents: "none",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
          {online ? (
            <>
              <SignalWifiStatusbar4BarRoundedIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" fontWeight={500}>
                La connexion a été rétablie
              </Typography>
            </>
          ) : (
            <>
              <WifiOffRoundedIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" fontWeight={500}>
                Pas de connexion internet
              </Typography>
            </>
          )}
        </Stack>
      </Box>
    </Slide>
  );
});

export default NetworkStatus;
