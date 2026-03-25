import React from "react";
import { useTranslation } from "react-i18next";
import InputsDoc from "./InputsDoc";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  useMediaQuery,
  useTheme,
} from "@mui/material";

interface FormContentProps {
  file: unknown;
  findError: (field: string) => boolean;
  handleSendFile: (file: unknown) => (event: React.FormEvent) => void;
  docFields: {
    type?: React.MutableRefObject<string | null | undefined>;
    designation?: React.MutableRefObject<string | null | undefined>;
    subType?: React.MutableRefObject<string | null | undefined>;
    description?: React.MutableRefObject<string | null | undefined>;
  };
  onClose: (event: React.MouseEvent) => void;
}

export default function FormContent({
  file,
  findError,
  handleSendFile,
  docFields,
  onClose,
}: FormContentProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <React.Fragment>
      <Dialog
        open={!!file}
        fullScreen={fullScreen}
        PaperProps={{
          sx: { overflow: "hidden" },
        }}
        BackdropProps={{
          sx: {
            bgcolor: (theme) =>
              theme.palette.background.paper + theme.customOptions.opacity,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            backdropFilter: (theme) => `blur(${theme.customOptions.blur})`,
          },
        }}>
        <DialogTitle component='div'>
          <Typography variant='h6' fontWeight='bold' fontSize={18}>
            {t("forms.submitDialog.title")}
          </Typography>
        </DialogTitle>
        <form onSubmit={handleSendFile(file)}>
          <DialogContent
            sx={{
              maxHeight: "75vh",
            }}>
            <InputsDoc {...docFields} findError={findError} />
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} color='primary'>
              {t("common.cancel")}
            </Button>
            <Button type='submit' variant='outlined' color='primary'>
              {t("forms.submitDialog.sendArticle")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </React.Fragment>
  );
}
