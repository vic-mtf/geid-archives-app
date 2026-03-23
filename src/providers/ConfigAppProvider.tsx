import useTheme from "@/hooks/useTheme";
import { useSelector } from "react-redux";
import { useLayoutEffect, useMemo } from "react";
import { ThemeProvider } from "@mui/material";
import type { RootState } from "@/redux/store";

interface ConfigAppProviderProps {
  children: React.ReactNode;
}

export default function ConfigAppProvider({ children }: ConfigAppProviderProps) {
  const lang = useSelector((store: RootState) => store.app.lang);
  const theme = useTheme();
  const bgcolor = useMemo(() => theme.palette.background.default, [theme]);

  useLayoutEffect(() => {
    const htmlEl = document.head.parentElement;
    if (htmlEl) {
      htmlEl.lang = lang;
      htmlEl.style.backgroundColor = bgcolor;
    }
    document.body.style.backgroundColor = bgcolor;
  }, [lang, bgcolor]);

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
