import { useCallback, useEffect } from "react";
import Box from "../../components/Box";
import _archives_logo from "../../assets/crdoy0js-removebg-preview.webp";
import {
  CardMedia,
  Stack,
  Box as MuiBox,
  CircularProgress,
  Divider,
  Typography,
} from "@mui/material";
import _logo_geid from "../../assets/geid_logo_blue_without_title.webp";
import SwingAnimation from "../../components/SwingAnimation";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../redux/store";
import openSignIn from "./openSignIn";
import channels from "../../utils/channels";
import useGetData from "../../hooks/useGetData";
import { decrypt } from "../../utils/crypt";
import { updateUser } from "../../redux/user";
import { updateData } from "../../redux/data";

interface CoverProps {
  setOpened: (opened: boolean) => void;
}

export default function Cover({ setOpened }: CoverProps) {
  const connected = useSelector((store: RootState) => store.user.connected);

  const dispatch = useDispatch<AppDispatch>();
  const [loading, getData] = useGetData({
    onBeforeUpdate(docs: unknown) {
      setOpened(true);
      dispatch(updateData({ data: { docs: docs as import("../../types").ArchiveDocument[] } }));
    },
  });

  const handleFinish = useCallback(() => {
    if (connected) getData();
    else openSignIn();
  }, [connected, getData]);

  useEffect(() => {
    const handleLogin = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data) {
        const decrypted = decrypt<Record<string, unknown>>(event.data) ?? {};
        const data: Record<string, unknown> & { connected: boolean } = {
          connected: true,
          ...decrypted,
        };
        dispatch(updateUser({ data: data as unknown as import("../../types").UserSliceState }));
        getData({ urlProps: { token: data?.token as string | undefined } });
      }
    };
    SIGN_IN_CHANNEL.addEventListener("message", handleLogin);
    return () => {
      SIGN_IN_CHANNEL.removeEventListener("message", handleLogin);
    };
  }, [dispatch, setOpened, getData]);

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
      }}>
      <Stack
        display='flex'
        justifyContent='center'
        alignItems='center'
        flex={1}
        spacing={1}>
        <SwingAnimation delay={2} onFinish={handleFinish}>
          <CardMedia
            component='img'
            src={_archives_logo}
            draggable={false}
            sx={{ height: 100, width: 100 }}
          />
        </SwingAnimation>
        <MuiBox
          display='flex'
          justifyContent='center'
          alignItems='center'
          flexDirection='column'
          position='relative'>
          <Stack
            spacing={1}
            direction='row'
            width={500}
            my={1}
            divider={
              <Divider
                flexItem
                orientation='vertical'
                sx={{
                  bgcolor: "text.primary",
                  borderWidth: 1,
                }}
              />
            }
            display='flex'
            justifyContent='center'>
            <CardMedia component='img' src={_logo_geid} sx={{ width: 120 }} />
            <Typography noWrap variant='h4' color='text.primary'>
              Archives
            </Typography>
          </Stack>
          {loading && (
            <CircularProgress
              size={15}
              sx={{
                position: "absolute",
                top: "150%",
                color: "text.primary",
              }}
            />
          )}
        </MuiBox>
      </Stack>
      <Typography variant='caption' paragraph color='text.primary'>
        {footerText}
      </Typography>
    </Box>
  );
}

const footerText =
  "Direction Archives et Nouvelles Technologie de l'Information et de la Communication ©2022";
const SIGN_IN_CHANNEL = new BroadcastChannel(channels.signIn);
