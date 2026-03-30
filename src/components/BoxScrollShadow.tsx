import * as React from "react";
import { Box, List, SxProps, Theme } from "@mui/material";
import scrollBarSx from "@/utils/scrollBarSx";

const useScrollTop = (): [number, { onScroll: React.UIEventHandler<HTMLUListElement> }] => {
  const [scrollTop, setScrollTop] = React.useState(0);
  const onScroll: React.UIEventHandler<HTMLUListElement> = (event) =>
    setScrollTop((event.target as HTMLElement).scrollTop);
  return [scrollTop, { onScroll }];
};

interface BoxScrollShadowProps {
  children?: React.ReactNode;
  sx?: SxProps<Theme>;
  [key: string]: unknown;
}

const BoxScrollShadow = ({ children, sx, ...otherProps }: BoxScrollShadowProps) => {
  const [scrollTop, scrollProps] = useScrollTop();

  return (
    <Box
      {...scrollProps}
      {...otherProps}
      component={List}
      sx={{
        boxShadow: (theme: Theme) =>
          scrollTop > 0
            ? `inset 0 3px 5px -2.5px ${theme.palette.divider}`
            : "none",
        transition: "box-shadow 0.2s",
        overflow: "auto",
        ...(scrollBarSx as Record<string, unknown>),
        ...sx as Record<string, unknown>,
      } as SxProps<Theme>}>
      {children}
    </Box>
  );
};

export default BoxScrollShadow;
