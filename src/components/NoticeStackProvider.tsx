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
} from "@mui/material";

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
        {title && <AlertTitle>{title}</AlertTitle>}{" "}
        {typeof message === "function" ? message(props) : message}
      </>
    ),
    [title, message, props]
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
        boxShadow: 8,
        "& .MuiSnackbarContent-root": {
          bgcolor: "background.paper",
          backgroundImage: (theme: Theme) => {
            const color = alpha(
              theme.palette.common.white,
              theme.palette.action.activatedOpacity
            );
            return `linear-gradient(${color}, ${color})`;
          },
          color: "text.primary",
        },
        "& .MuiSnackbarContent-message": {
          color: "text.secondary",
          maxWidth: { xs: "100%", md: 400, lg: 500, xl: 600 },
        },
      }}
      {...otherProps}>
      <Box
        component={variant === "default" ? MuiSnackbarContent : Alert}
        {...snackbarProps}
        severity={variant === "default" ? undefined : variant}
        action={
          typeof action === "function"
            ? action({
                ...props,
                persist,
                anchorOrigin,
                autoHideDuration,
                iconVariant,
              })
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
      maxSnack={10}
      Components={Components as SnackbarProviderProps["Components"]}
      {...otherProps}>
      {children}
    </SnackbarProvider>
  );
}
