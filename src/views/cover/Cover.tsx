import { useCallback, useEffect } from "react";
import _archives_logo from "@/assets/crdoy0js-removebg-preview.webp";
import {
  CardMedia,
  Stack,
  Box,
  Divider,
  Typography,
} from "@mui/material";
import _logo_geid from "@/assets/geid_logo_blue_without_title.webp";
import BoxGradient from "@/components/BoxGradient";
import SwingAnimation from "@/components/SwingAnimation";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import openSignIn from "./openSignIn";
import channels from "@/utils/channels";
import { decrypt } from "@/utils/crypt";
import { updateUser } from "@/redux/user";

interface CoverProps {
  setOpened: (opened: boolean) => void;
}

export default function Cover({ setOpened }: CoverProps) {
  const connected = useSelector((store: RootState) => store.user.connected);
  const dispatch = useDispatch<AppDispatch>();
  const handleFinish = useCallback(() => {
    if (connected) setOpened(true);
    else openSignIn();
  }, [connected, setOpened]);

  useEffect(() => {
    const handleLogin = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data) {
        const decrypted = decrypt<Record<string, unknown>>(event.data) ?? {};
        const data: Record<string, unknown> & { connected: boolean } = {
          connected: true,
          ...decrypted,
        };
        dispatch(updateUser({ data: data as unknown as import("../../types").UserSliceState }));
        setOpened(true);
      }
    };
    SIGN_IN_CHANNEL.addEventListener("message", handleLogin);
    return () => {
      SIGN_IN_CHANNEL.removeEventListener("message", handleLogin);
    };
  }, [dispatch, setOpened]);

  return (
    <BoxGradient
      sx={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
        overflow: "hidden",
      }}>
      {/* Contenu central — logo + titre */}
      <Stack alignItems="center" spacing={{ xs: 1.5, sm: 2 }}>
        <SwingAnimation delay={2} onFinish={handleFinish}>
          <CardMedia
            component="img"
            src={_archives_logo}
            draggable={false}
            sx={{
              height: { xs: 64, sm: 80, md: 100 },
              width: { xs: 64, sm: 80, md: 100 },
            }}
          />
        </SwingAnimation>
        <Stack
          spacing={{ xs: 0.5, sm: 1 }}
          direction={{ xs: "column", sm: "row" }}
          divider={
            <Divider
              flexItem
              orientation="vertical"
              sx={{
                bgcolor: "text.primary",
                borderWidth: 1,
                display: { xs: "none", sm: "block" },
              }}
            />
          }
          alignItems="center"
          justifyContent="center">
          <CardMedia
            component="img"
            src={_logo_geid}
            sx={{ width: { xs: 60, sm: 90, md: 120 } }}
          />
          <Typography
            noWrap
            color="text.primary"
            sx={{
              fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2.125rem" },
              fontWeight: 400,
            }}>
            Archives
          </Typography>
        </Stack>
      </Stack>

      {/* Footer — toujours visible en bas */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          textAlign: "center",
          py: { xs: 1.5, sm: 2 },
          px: 2,
        }}>
        <Typography variant="caption" color="text.primary">
          {footerText}
        </Typography>
      </Box>
    </BoxGradient>
  );
}

const footerText =
  "Direction Archives et Nouvelles Technologies de l'Information et de la Communication © 2024";
const SIGN_IN_CHANNEL = new BroadcastChannel(channels.signIn);
