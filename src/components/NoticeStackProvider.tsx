import React, { useMemo } from "react";
import { SnackbarContent, SnackbarProvider, SnackbarProviderProps } from "notistack";
import {
  Alert,
  AlertTitle,
  SnackbarContent as MuiSnackbarContent,
  Box,
  SxProps,
  Theme,
} from "@mui/material";

// Permet de passer `title` dans les options de enqueueSnackbar
declare module "notistack" {
  interface OptionsObject {
    title?: string;
  }
}

type SnackbarVariant = "success" | "error" | "warning" | "info" | "default";

interface AnchorOrigin {
  horizontal: "left" | "center" | "right";
  vertical: "top" | "bottom";
}

interface IconVariant {
  [key: string]: React.ReactNode;
}

interface ReportCompleteProps {
  id?: string;
  sx?: SxProps<Theme>;
  icon?: React.ReactNode;
  action?: ((props: ReportCompleteProps) => React.ReactNode) | React.ReactNode;
  variant?: SnackbarVariant;
  message?: ((props: ReportCompleteProps) => React.ReactNode) | React.ReactNode;
  title?: string;
  persist?: boolean;
  iconVariant?: IconVariant;
  anchorOrigin?: AnchorOrigin;
  hideIconVariant?: boolean;
  autoHideDuration?: number;
}

// Couleurs de bordure gauche par variante
const variantBorderColor: Record<SnackbarVariant, string> = {
  success: "#4caf50",
  error:   "#f44336",
  warning: "#ff9800",
  info:    "#2196f3",
  default: "transparent",
};

const ReportComplete = React.forwardRef<HTMLDivElement, ReportCompleteProps>((props, ref) => {
  const {
    icon,
    title,
    action,
    variant = "default",
    message,
    hideIconVariant,
    persist,
    anchorOrigin,
    autoHideDuration,
    iconVariant,
    ...otherProps
  } = props;

  const resolvedMessage = typeof message === "function" ? message(props) : message;

  const children = useMemo(
    () => (
      <>
        {title && <AlertTitle sx={{ fontWeight: 700, mb: 0.25, fontSize: "0.85rem" }}>{title}</AlertTitle>}
        <span style={{ fontSize: "0.82rem", lineHeight: 1.5 }}>{resolvedMessage}</span>
      </>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [title, resolvedMessage]
  );

  const snackbarProps = useMemo(
    () => (variant === "default" ? { message: children } : { children }),
    [children, variant]
  );

  return (
    <Box
      role="alert"
      component={SnackbarContent}
      ref={ref}
      sx={{
        // Pas de shadow sur le wrapper notistack (coupée par son container overflow:hidden)
        // La shadow est portée par l'inner Box
        boxShadow: "none",
        borderRadius: 0,
        p: "3px",                          // marge interne pour que la shadow ne soit pas coupée
        bgcolor: "transparent",
        minWidth: { xs: "calc(100vw - 32px)", sm: 320 },
        maxWidth: { xs: "calc(100vw - 32px)", sm: 420 },
        "& .MuiSnackbarContent-root": {
          boxShadow: "none",
          borderRadius: 0,
          bgcolor: "transparent",
          p: 0,
        },
        "& .MuiSnackbarContent-message": {
          p: 0,
          width: "100%",
        },
      }}
      {...otherProps}>

      {/* Inner card avec shadow contenue */}
      <Box
        sx={{
          boxShadow: "0 2px 10px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
          borderRadius: 1.5,
          overflow: "hidden",
          borderLeft: variant !== "default" ? `3px solid ${variantBorderColor[variant]}` : "none",
          bgcolor: "background.paper",
        }}>
        <Box
          component={variant === "default" ? MuiSnackbarContent : Alert}
          {...snackbarProps}
          severity={variant === "default" ? undefined : variant}
          action={
            typeof action === "function"
              ? action({ ...props, persist, anchorOrigin, autoHideDuration, iconVariant })
              : action
          }
          icon={hideIconVariant === true ? false : icon}
          sx={{
            borderRadius: 0,
            alignItems: "flex-start",
            bgcolor: "background.paper",
            color: "text.primary",
            fontSize: "0.82rem",
            "& .MuiAlert-action": { pt: 0.5 },
            "& .MuiSnackbarContent-root": { bgcolor: "background.paper", p: "10px 16px" },
            "& .MuiSnackbarContent-message": { p: 0 },
          }}
        />
      </Box>
    </Box>
  );
});

ReportComplete.displayName = "ReportComplete";

const Components = {
  success: ReportComplete,
  error: ReportComplete,
  warning: ReportComplete,
  info: ReportComplete,
  default: ReportComplete,
};

interface NoticeStackProviderProps extends Partial<SnackbarProviderProps> {
  children: React.ReactNode;
}

export default function NoticeStackProvider({ children, ...otherProps }: NoticeStackProviderProps) {
  return (
    <SnackbarProvider
      maxSnack={5}
      autoHideDuration={5000}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      Components={Components as SnackbarProviderProps["Components"]}
      {...otherProps}>
      {children}
    </SnackbarProvider>
  );
}
