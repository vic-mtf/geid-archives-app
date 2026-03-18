import {
  CardActionArea,
  CardContent,
  Grid,
  Menu,
  Stack,
  Typography,
} from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import checkAuth from "../../utils/checkAuth";
//import inArray from '../../../utils/inArray';
import appsList from "./appsList";

interface AppsMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

export default function AppsMenu({ anchorEl, onClose }: AppsMenuProps) {
  const auth = useSelector((store: RootState) => store?.user?.auth) as Parameters<typeof checkAuth>[0];

  return (
    <Menu
      id='_apps'
      anchorEl={anchorEl}
      keepMounted
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "center",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      slotProps={{
        paper: {
          sx: {
            height: 400,
            width: 300,
          },
        },
      }}>
      <CardContent component='div'>
        <Grid container spacing={1} component='div'>
          {appsList.map(
            (app, index) =>
              checkAuth(auth, app.permissions) && (
                <Grid
                  item
                  xs={4}
                  display='flex'
                  justifyContent='center'
                  key={index}
                  component='div'
                  position='relative'
                  height={90}>
                  <CardActionArea
                    sx={{ borderRadius: 1, position: "absolute" }}
                    LinkComponent={app.component || "a"}
                    href={app.href}
                    title={app.name}>
                    <Stack
                      display='flex'
                      m={0.25}
                      alignItems='center'
                      spacing={0.2}
                      component='div'
                      sx={{
                        "& .app-name": {
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          width: 60,
                        },
                        "&: hover": {
                          zIndex: (theme) => theme.zIndex.tooltip,
                          "& .app-name": {
                            whiteSpace: "normal",
                            overflow: "visible",
                            textOverflow: "clip",
                            width: "auto",
                          },
                        },
                      }}>
                      <img
                        src={app.src}
                        srcSet={app.src}
                        draggable={false}
                        style={{
                          height: 60,
                          width: 60,
                        }}
                      />
                      <Typography
                        align='center'
                        variant='caption'
                        className='app-name'>
                        {app.name}
                      </Typography>
                    </Stack>
                  </CardActionArea>
                </Grid>
              )
          )}
        </Grid>
      </CardContent>
    </Menu>
  );
}
