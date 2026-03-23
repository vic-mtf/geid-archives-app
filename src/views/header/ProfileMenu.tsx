import React from "react";
import {
  Avatar,
  Badge,
  CardContent,
  Divider,
  Menu,
  Stack,
  IconButton,
  Typography,
  Box,
  Button,
} from "@mui/material";
import AddAPhotoRoundedIcon from "@mui/icons-material/AddAPhotoRounded";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import LogoutIcon from "@mui/icons-material/Logout";
import getFile from "@/utils/getFile";
import { useCallback } from "react";
import getFullName from "@/utils/getFullName";

interface ProfileMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

export default function ProfileMenu({ anchorEl, onClose }: ProfileMenuProps) {
  const user = useSelector((store: RootState) => store.user);
  const fullname = getFullName(user as unknown as Parameters<typeof getFullName>[0]);
  const handleChangeImageProfile = useCallback(() => {
    async () => {
      const [file] = await getFile({ accept: "image/*" });
      if (file) {
        const detail = {
          file,
          name: "_edit_profile_image",
        };
        const customEvent = new CustomEvent(detail.name, {
          detail,
        });
        document.getElementById("root")!.dispatchEvent(customEvent);
      }
      onClose();
    };
  }, [onClose]);

  return (
    <Menu
      id='_apps'
      anchorEl={anchorEl}
      keepMounted
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}>
      <CardContent
        sx={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
        }}>
        <Stack divider={<Divider />} spacing={1} display='flex' flex={1}>
          <Box
            justifyContent='center'
            alignItems='center'
            display='flex'
            flexDirection='column'>
            <Badge
              overlap='rectangular'
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              sx={{ my: 3 }}
              badgeContent={
                <IconButton
                  size='small'
                  onClick={handleChangeImageProfile}
                  sx={{
                    backdropFilter: (theme) =>
                      `blur(${theme.customOptions.blur})`,
                    border: (theme) =>
                      `1px solid ${theme.palette.background.paper + "30"}`,
                  }}>
                  <AddAPhotoRoundedIcon fontSize='small' />
                </IconButton>
              }>
              <Avatar
                sx={{ width: 100, height: 100, fontSize: 50 }}
                alt={fullname}
                src={(user as Record<string, unknown>).image as string}
                variant='rounded'
              />
            </Badge>
            <Typography fontWeight='bold' variant='body1'>
              {fullname}
            </Typography>
            <Typography paragraph>{(user as Record<string, unknown>).email as string}</Typography>
          </Box>
          <Box>
            <Box
              alignItems='center'
              display='flex'
              width='100%'
              justifyContent='center'
              my={1}>
              <Button
                variant='contained'
                color='error'
                fullWidth={false}
                // size="medium"
                endIcon={React.createElement(LogoutIcon)}
                onClick={() => {
                  const detail = { name: "_disconnected" };
                  const customEvent = new CustomEvent(detail.name, { detail });
                  document.getElementById("root")!.dispatchEvent(customEvent);
                }}>
                Déconnexion
              </Button>
            </Box>
          </Box>
          <Box> </Box>
        </Stack>
        <Stack
          display='flex'
          direction='row'
          spacing={1}
          sx={{
            "& > .MuiButton-root": {
              color: "text.secondary",
              fontSize: (theme) => theme.typography.caption.fontSize,
            },
          }}>
          <Button color='inherit'>Politique de confidentialité</Button>
          <Button color='inherit'>Conditions d'utilisation</Button>
        </Stack>
      </CardContent>
    </Menu>
  );
}
