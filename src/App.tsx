import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import { Box } from "@mui/material";
import BoxGradient from "./components/BoxGradient";
import router from "./router/router";
import Cover from "./views/cover/Cover";
import NetworkStatus from "./components/NetworkStatus";
import type { RootState, AppDispatch } from "./redux/store";
import { disconnected } from "./redux/user";
import { removeData } from "./redux/data";

export default function App() {
  const connected = useSelector((store: RootState) => store.user.connected);
  const dispatch = useDispatch<AppDispatch>();
  const [opened, setOpened] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();

  // Écouter l'expiration de session (déclenché par l'intercepteur axios)
  useEffect(() => {
    const root = document.getElementById("root");
    const handler = () => {
      enqueueSnackbar(t("notifications.errorSessionExpired"), {
        variant: "warning",
        title: t("notifications.sessionExpiredTitle"),
        autoHideDuration: 6000,
      });
      // Déconnexion propre
      dispatch(disconnected());
      dispatch(removeData());
      sessionStorage.clear();
      setOpened(false);
    };
    root?.addEventListener("_session_expired", handler);
    return () => root?.removeEventListener("_session_expired", handler);
  }, [dispatch, enqueueSnackbar, t]);

  return connected && opened ? (
    <Box sx={{ display: "flex", flex: 1, width: "100%", height: "100%", overflow: "hidden" }}>
      <NetworkStatus />
      <RouterProvider router={router} />
    </Box>
  ) : (
    <BoxGradient>
      <NetworkStatus />
      <Cover setOpened={setOpened} />
    </BoxGradient>
  );
}
