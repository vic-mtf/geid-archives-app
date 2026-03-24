import { useEffect } from "react";
import { CssBaseline, Box as MuiBox } from "@mui/material";
import { useSnackbar } from "notistack";
import Header from "./header/Header";
import Content from "./content/Content";
import Navigation from "./navigation/Navigation";
import Forms from "./forms/Forms";
import MobileBottomNav from "./navigation/MobileBottomNav";
import { setSnackbarFunctions, cancelFileLoading } from "@/utils/openArchiveFile";

export default function Archives() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  useEffect(() => {
    setSnackbarFunctions(
      enqueueSnackbar as (msg: string, opts?: Record<string, unknown>) => unknown,
      (key: unknown) => { closeSnackbar(key as string | number); cancelFileLoading(); },
    );
  }, [enqueueSnackbar, closeSnackbar]);

  return (
    <>
      <MuiBox sx={{ display: "flex", flex: 1, width: "100%", height: "100%", minHeight: 0 }}>
        <CssBaseline />
        <Header />
        <Navigation />
        <Content />
      </MuiBox>
      <MobileBottomNav />
      <Forms />
    </>
  );
}
