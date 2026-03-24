import { useCallback, useEffect } from "react";
import Box from "@/components/Box";
import _archives_logo from "@/assets/crdoy0js-removebg-preview.webp";
import {
  CardMedia,
  Stack,
  Box as MuiBox,
  Divider,
  Typography,
} from "@mui/material";
import _logo_geid from "@/assets/geid_logo_blue_without_title.webp";
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
    <Box
      sx={{
        justifyContent: "center",
        alignItems: "center",
        userSelect: "none",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        p: { xs: 2, sm: 3, md: 4 },
      }}>
      <Stack
        display="flex"
        justifyContent="center"
        alignItems="center"
        flex={1}
        spacing={{ xs: 1.5, sm: 2 }}>
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
        <MuiBox
          display="flex"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
          position="relative"
          width="100%">
          <Stack
            spacing={{ xs: 0.5, sm: 1 }}
            direction={{ xs: "column", sm: "row" }}
            maxWidth={500}
            width="100%"
            my={{ xs: 0.5, sm: 1 }}
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
            display="flex"
            justifyContent="center"
            alignItems="center">
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
        </MuiBox>
      </Stack>
      <Typography
        variant="caption"
        color="text.primary"
        textAlign="center"
        sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 1, sm: 2 }, opacity: 0.7, flexShrink: 0 }}>
        {footerText}
      </Typography>
    </Box>
  );
}

const footerText =
  "Direction Archives et Nouvelles Technologies de l'Information et de la Communication © 2024";
const SIGN_IN_CHANNEL = new BroadcastChannel(channels.signIn);
