import { createTheme, Theme } from "@mui/material";
import appConfig from "../configs/app-config.json";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import useAutoMode from "./useAutoMode";
import MuiDialogTransition from "../components/MuiDialogTransition";
import type { RootState } from "../redux/store";

// Augment MUI theme to include customOptions
declare module "@mui/material/styles" {
  interface Theme {
    customOptions: {
      opacity: string;
      blur: string;
    };
  }
  interface ThemeOptions {
    customOptions?: {
      opacity?: string;
      blur?: string;
    };
  }
}

const MuiBase = createTheme();

type ThemeMode = "light" | "dark" | "auto";

const useTheme = (defaultMode?: ThemeMode): Theme => {
  const autoMode = useAutoMode();
  const { mode: themeMode, opacity, blur } = useSelector((store: RootState) => store.app);

  const mode = useMemo<"light" | "dark">(
    () => {
      const resolved = defaultMode ?? themeMode;
      return resolved === "auto" ? autoMode : (resolved as "light" | "dark");
    },
    [themeMode, autoMode, defaultMode]
  );

  interface PrimaryColorConfig {
    main: string;
    paper: string;
    [key: string]: string;
  }

  const { main, paper, ...otherKey } = useMemo(
    () => {
      const cfg = appConfig.colors.primary as unknown as Record<string, PrimaryColorConfig>;
      return (cfg[mode] ?? cfg["dark"]) as PrimaryColorConfig;
    },
    [mode]
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: main as string },
          background: {
            ...(otherKey as Record<string, string>),
            paper: paper as string,
          },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: { textTransform: "none" },
            },
          },
          MuiTypography: {
            defaultProps: {
              variant: "body2",
              color: "text.primary",
              component: "div",
            },
          },
          MuiChip: {
            styleOverrides: {
              root: { borderRadius: MuiBase.shape.borderRadius },
            },
          },
          MuiAvatar: {
            defaultProps: { variant: "rounded" },
          },
          MuiIconButton: {
            styleOverrides: {
              root: {
                borderRadius: MuiBase.shape.borderRadius,
                "& .MuiTouchRipple-root span": {
                  borderRadius: MuiBase.shape.borderRadius,
                },
              },
            },
          },
          MuiMenu: {
            defaultProps: {
              transformOrigin: { horizontal: "left", vertical: "top" },
              anchorOrigin: { horizontal: "right", vertical: "bottom" },
              onContextMenu: (event: React.MouseEvent) => event.preventDefault(),
            },
          },
          MuiBadge: {
            defaultProps: {
              overlap: "rectangular",
              anchorOrigin: { vertical: "bottom", horizontal: "right" },
            },
          },
          MuiTooltip: {
            defaultProps: { arrow: true },
          },
          MuiDialog: {
            defaultProps: {
              TransitionComponent: MuiDialogTransition,
              PaperProps: {
                sx: {
                  position: "relative",
                  overflow: "hidden",
                },
              },
            },
            styleOverrides: {
              root: {
                "& .MuiBackdrop-root": {
                  backdropFilter: "blur(10px)",
                },
              },
            },
          },
          MuiBackdrop: {
            styleOverrides: {
              root: {
                userSelect: "none",
                "& *": { userSelect: "none" },
              },
            },
          },
          MuiFab: {
            defaultProps: {
              size: "small",
              variant: "extended",
            },
            styleOverrides: {
              root: {
                boxShadow: "none",
                borderRadius: MuiBase.shape.borderRadius,
              },
            },
          },
          MuiTextField: {
            defaultProps: { variant: "outlined" },
          },
        },
        customOptions: {
          opacity: Math.round(255 * opacity).toString(16),
          blur: `${blur}px`,
        },
      }),
    [mode, main, paper, opacity, blur, otherKey]
  );

  return theme;
};

export default useTheme;
