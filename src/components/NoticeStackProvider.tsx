import React, { useMemo } from "react";
import { SnackbarContent, SnackbarProvider, SnackbarProviderProps } from "notistack";
import {
  Alert,
  AlertTitle,
  SnackbarContent as MuiSnackbarContent,
  Box,
  alpha,
  SxProps,
  Theme,
  Typography,
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

  const children = useMemo(
    () => (
      <>
        {title && <AlertTitle sx={{ fontWeight: 700, mb: 0.25 }}>{title}</AlertTitle>}
        <Typography variant="body2" component="span" sx={{ lineHeight: 1.5 }}>
          {typeof message === "function" ? message(props) : message}
        </Typography>
      </>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [title, message]
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
        boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
        borderRadius: 2,
        overflow: "hidden",
        minWidth: { xs: "calc(100vw - 32px)", sm: 320 },
        maxWidth: { xs: "calc(100vw - 32px)", sm: 400 },
        "& .MuiSnackbarContent-root": {
          bgcolor: "background.paper",
          backgroundImage: (theme: Theme) => {
            const color = alpha(theme.palette.common.white, theme.palette.action.activatedOpacity);
            return `linear-gradient(${color}, ${color})`;
          },
          color: "text.primary",
          borderRadius: 2,
          p: 0,
        },
        "& .MuiSnackbarContent-message": {
          color: "text.secondary",
          width: "100%",
          p: 0,
        },
        "& .MuiAlert-root": {
          borderRadius: 2,
          alignItems: "flex-start",
        },
        "& .MuiAlert-action": {
          pt: 0.5,
        },
      }}
      {...otherProps}>
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
      />
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
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      Components={Components as SnackbarProviderProps["Components"]}
      {...otherProps}>
      {children}
    </SnackbarProvider>
  );
}
