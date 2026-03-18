import { FormControl, FormHelperText, TextField, TextFieldProps } from "@mui/material";
import React, { useLayoutEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SxProps, Theme } from "@mui/material";

interface InputControlProps extends Omit<TextFieldProps, "sx"> {
  message?: string;
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
}

const InputControl = React.forwardRef<HTMLDivElement, InputControlProps>((props, ref) => {
  const { message, fullWidth, sx, ...otherProps } = props;
  const messageRef = useRef(message);

  useLayoutEffect(() => {
    messageRef.current = message ? message : messageRef.current;
  }, [message]);

  return (
    <FormControl fullWidth={fullWidth} sx={sx}>
      <TextField
        ref={ref}
        {...otherProps}
        color={message ? "error" : "primary"}
      />
      <Show in={Boolean(message)} unmountOnExit>
        <FormHelperText sx={{ color: (theme: Theme) => theme.palette.error.main }}>
          {messageRef.current}
        </FormHelperText>
      </Show>
    </FormControl>
  );
});

InputControl.displayName = "InputControl";

interface ShowProps {
  in: boolean;
  unmountOnExit?: boolean;
  children: React.ReactNode;
}

const Show = ({ in: isOpen, children }: ShowProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InputControl;
