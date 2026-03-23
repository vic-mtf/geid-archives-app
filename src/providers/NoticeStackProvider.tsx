import React, { useMemo } from "react";
import { SnackbarContent, SnackbarProvider, SnackbarProviderProps } from "notistack";
import {
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
    id,
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

  // L'action reçoit le snackbar key (id) — compatibilité avec notistack
  const resolvedAction = useMemo(
    () => (typeof action === "function" ? action(id as unknown as ReportCompleteProps) : action),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [action, id]
  );

  const borderColor = variantBorderColor[variant];

  return (
    <Box
      role="alert"
      component={SnackbarContent}
      ref={ref}
      sx={{
        boxShadow: "none",
        borderRadius: 0,
        p: "3px",
        bgcolor: "transparent",
        minWidth: { xs: "calc(100vw - 32px)", sm: 300 },
        maxWidth: { xs: "calc(100vw - 32px)", sm: 400 },
        "& .MuiSnackbarContent-root": { boxShadow: "none", borderRadius: 0, bgcolor: "transparent", p: 0 },
        "& .MuiSnackbarContent-message": { p: 0, width: "100%" },
      }}
      {...otherProps}>

      {/* Inner card */}
      <Box
        sx={{
          boxShadow: "0 2px 10px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
          borderRadius: 1.5,
          overflow: "hidden",
          borderLeft: variant !== "default" ? `3px solid ${borderColor}` : "none",
          bgcolor: "background.paper",
        }}>

        {/* Zone texte */}
        <Box sx={{ px: 2, pt: 1.5, pb: resolvedAction ? 0.75 : 1.5 }}>
          {/* Icône + titre */}
          {variant !== "default" && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: title ? 0.4 : 0 }}>
              {hideIconVariant !== true && icon && (
                <Box sx={{ color: borderColor, display: "flex", flexShrink: 0, fontSize: "1.1rem" }}>
                  {icon}
                </Box>
              )}
              {title && (
                <Box sx={{ fontWeight: 700, fontSize: "0.84rem", color: "text.primary", lineHeight: 1.3 }}>
                  {title}
                </Box>
              )}
            </Box>
          )}
          {/* Message */}
          {resolvedMessage && (
            <Box sx={{ fontSize: "0.82rem", color: "text.secondary", lineHeight: 1.55, mt: variant !== "default" && title ? 0.2 : 0 }}>
              {resolvedMessage}
            </Box>
          )}
        </Box>

        {/* Zone action : bouton pleine largeur sous le texte */}
        {resolvedAction && (
          <Box
            sx={{
              px: 1.5,
              pb: 1.25,
              pt: 0.25,
              display: "flex",
              justifyContent: "flex-end",
              gap: 1,
              "& .MuiButton-root": { fontSize: "0.78rem" },
            }}>
            {resolvedAction}
          </Box>
        )}
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
