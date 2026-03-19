import { alpha, createTheme, Theme } from "@mui/material";
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

  const opacityHex = useMemo(
    () => Math.round(255 * opacity).toString(16).padStart(2, "0"),
    [opacity]
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
            defaultProps: {
              disableElevation: true,
            },
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
          MuiToggleButton: {
            styleOverrides: {
              root: {
                border: "none",
                "&.Mui-disabled": { border: "none" },
                textTransform: "none",
              },
            },
          },
          MuiMenu: {
            defaultProps: {
              transformOrigin: { horizontal: "left", vertical: "top" },
              anchorOrigin: { horizontal: "right", vertical: "bottom" },
              onContextMenu: (event: React.MouseEvent) => event.preventDefault(),
            },
            styleOverrides: {
              root: {
                "& .MuiBackdrop-root": { backdropFilter: "none" },
              },
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
              root: ({ theme: t }) => ({
                "& .MuiBackdrop-root": {
                  backgroundColor: t.palette.background.paper + opacityHex,
                  backdropFilter: `blur(${blur}px)`,
                },
              }),
            },
          },
          MuiModal: {
            styleOverrides: {
              root: {
                "& .MuiBackdrop-root": {
                  backdropFilter: `blur(${blur}px)`,
                  backgroundColor: alpha(paper, 0.2),
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
            defaultProps: {
              variant: "outlined",
              size: "small",
            },
          },
          MuiSwitch: {
            defaultProps: { size: "small" },
          },
          MuiSelect: {
            defaultProps: { size: "small" },
          },
          MuiFormControl: {
            defaultProps: { size: "small" },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
              },
            },
          },
          MuiListItemButton: {
            styleOverrides: {
              root: {
                borderRadius: MuiBase.shape.borderRadius,
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: {
                borderColor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
              },
            },
          },
        },
        customOptions: {
          opacity: opacityHex,
          blur: `${blur}px`,
        },
      }),
    [mode, main, paper, opacity, blur, otherKey, opacityHex]
  );

  return theme;
};

export default useTheme;
