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
  const [loading, setLoading] = useState(false);
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

  const handleClose = () => { if (!loading) setIds([]); };

  const handleConfirm = async () => {
    const count = ids.length;
    setLoading(true);
    try {
      await Promise.all(
        ids.map((id) => execute({ url: `/api/stuff/archives/${id}` }))
      );
      dispatch(incrementVersion());
      setIds([]);
      enqueueSnackbar(
        count > 1
          ? t("notifications.archiveDeletedBulk", { count })
          : t("notifications.archiveDeletedSingle"),
        {
          variant: "success",
          title: count > 1
            ? t("notifications.archiveDeletedBulkTitle", { count })
            : t("notifications.archiveDeletedSingleTitle"),
        }
      );
    } catch {
      enqueueSnackbar(
        t("notifications.archiveDeleteFailed"),
        { variant: "error", title: t("notifications.archiveDeleteFailedTitle") }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={ids.length > 0} onClose={handleClose} maxWidth="xs" fullWidth
      BackdropProps={{ sx: { bgcolor: (theme: any) => theme.palette.background.paper + theme.customOptions.opacity, backdropFilter: (theme: any) => `blur(${theme.customOptions.blur})` } }}
      PaperProps={{ sx: { border: 1, borderColor: "divider" } }}
    >
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
        <Button onClick={handleClose} color="inherit" disabled={loading}>
          {t("common.cancel")}
        </Button>
        <Button onClick={handleConfirm} variant="contained" color="error" disabled={loading}>
          {loading ? t("notifications.archiveDeletePendingSingle") : t("common.delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
