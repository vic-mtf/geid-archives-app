/**
 * NetworkStatus — Indicateur de connexion réseau via Alert MUI.
 *
 * Affiche une Alert en bas de l'écran, ne bloque pas la navigation.
 */

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Collapse } from "@mui/material";
import WifiOffOutlinedIcon from "@mui/icons-material/WifiOffOutlined";
import SignalWifiStatusbar4BarOutlinedIcon from "@mui/icons-material/SignalWifiStatusbar4BarOutlined";

const NetworkStatus = React.memo(function NetworkStatus() {
  const { t } = useTranslation();
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
    <Collapse in={!online || showReconnected} sx={{
      position: "fixed",
      bottom: 16,
      left: 16,
      right: 16,
      zIndex: 1300,
      pointerEvents: "none",
      "& .MuiAlert-root": { pointerEvents: "auto" },
    }}>
      <Alert
        severity={online ? "success" : "warning"}
        variant="filled"
        icon={online
          ? <SignalWifiStatusbar4BarOutlinedIcon fontSize="inherit" />
          : <WifiOffOutlinedIcon fontSize="inherit" />
        }
        sx={{ borderRadius: 2, boxShadow: 4 }}
      >
        {online
          ? t("network.connectionRestored")
          : t("network.noConnection")
        }
      </Alert>
    </Collapse>
  );
});

export default NetworkStatus;
