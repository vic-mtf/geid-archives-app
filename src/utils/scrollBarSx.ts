import { alpha, Theme } from "@mui/material";
import { SxProps } from "@mui/system";

const scrollBarSx: SxProps<Theme> = {
  [`&::-webkit-scrollbar`]: {
    width: 6,
    height: 6,
  },
  [`&::-webkit-scrollbar-thumb`]: { backgroundColor: "transparent" },
  [`&:hover`]: {
    [`&::-webkit-scrollbar-thumb`]: {
      backgroundColor: (theme: Theme) =>
        alpha(
          theme.palette.common[
            theme.palette.mode === "light" ? "black" : "white"
          ],
          0.2
        ),
      borderRadius: 0.5,
    },
    [`&::-webkit-scrollbar-thumb:hover`]: {
      backgroundColor: (theme: Theme) =>
        alpha(
          theme.palette.common[
            theme.palette.mode === "light" ? "black" : "white"
          ],
          0.4
        ),
    },
  },
};

export default scrollBarSx;
