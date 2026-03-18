import { styled } from "@mui/material";

interface MainProps {
  openLeft?: boolean;
  openRight?: boolean;
  drawerWidth?: number;
}

const customProps = ["openLeft", "openRight", "drawerWidth"];

const Main = styled("main", {
  shouldForwardProp: (prop) => !customProps.includes(prop as string),
})<MainProps>(({ theme, openLeft, openRight, drawerWidth = 0 }) => ({
  overflow: "hidden",
  flexGrow: 1,
  flexShrink: 1,
  flex: 1,
  display: "flex",
  flexDirection: "column",
  transition: theme.transitions.create("margin", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth * 2}px`,
  ...(openLeft && {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: `-${openRight ? drawerWidth : 0}px`,
  }),
}));

export default Main;
