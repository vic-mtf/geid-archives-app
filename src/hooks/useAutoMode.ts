import { useCallback, useEffect, useState } from "react";

type ColorMode = "light" | "dark";

const darkThemeMediaquery = window.matchMedia(`(prefers-color-scheme: dark)`);

export default function useAutoMode(): ColorMode {
  const [mode, setMode] = useState<ColorMode>(
    darkThemeMediaquery.matches ? "dark" : "light"
  );

  const handleChange = useCallback(
    (event: MediaQueryListEvent) =>
      setMode(event.matches ? "dark" : "light"),
    []
  );

  useEffect(() => {
    darkThemeMediaquery.addEventListener("change", handleChange);
    return () =>
      darkThemeMediaquery.removeEventListener("change", handleChange);
  }, [handleChange]);

  return mode;
}
