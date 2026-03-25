import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { incrementVersion } from "@/redux/data";
import useAxios from "@/hooks/useAxios";

const EVENT_NAME = "__delete_archive_docs";

export default function ArchiveDeleteConfirm() {
  const { t } = useTranslation();
  const [ids, setIds] = useState<(string | number)[]>([]);
  const { enqueueSnackbar } = useSnackbar();
  const token = useSelector((store: RootState) => (store.user as Record<string, unknown>).token as string);
  const dispatch = useDispatch<AppDispatch>();

  const [, execute] = useAxios(
    { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
    { manual: true }
  );

  useEffect(() => {
    const root = document.getElementById("root");
    const handleEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ ids: (string | number)[] }>).detail;
      if (detail?.ids?.length) setIds(detail.ids);
    };
    root?.addEventListener(EVENT_NAME, handleEvent);
    return () => root?.removeEventListener(EVENT_NAME, handleEvent);
  }, []);

  const handleClose = () => setIds([]);

  const handleConfirm = async () => {
    const count = ids.length;
    const key = enqueueSnackbar(
      count > 1
        ? t("notifications.archiveDeletePendingBulk", { count })
        : t("notifications.archiveDeletePendingSingle"),
      { autoHideDuration: null }
    );
    try {
      await Promise.all(
        ids.map((id) => execute({ url: `/api/stuff/archives/${id}` }))
      );
      enqueueSnackbar(
        count > 1
          ? t("notifications.archiveDeletedBulk", { count })
          : t("notifications.archiveDeletedSingle"),
        { variant: "success", title: count > 1 ? t("notifications.archiveDeletedBulkTitle", { count }) : t("notifications.archiveDeletedSingleTitle") }
      );
      dispatch(incrementVersion());
      handleClose();
    } catch {
      enqueueSnackbar(
        t("notifications.archiveDeleteFailed"),
        { variant: "error", title: t("notifications.archiveDeleteFailedTitle") }
      );
    } finally {
      enqueueSnackbar("", { key, persist: false });
    }
  };

  return (
    <Dialog open={ids.length > 0} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle component="div" fontWeight="bold">
        {t("dialogs.confirmDeletion")}
      </DialogTitle>
      <DialogContent>
        <Typography>
          {ids.length > 1
            ? t("dialogs.deleteArchiveBulk", { count: ids.length })
            : t("dialogs.deleteArchiveSingle")}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          {t("common.cancel")}
        </Button>
        <Button onClick={handleConfirm} variant="contained" color="error">
          {t("common.delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
