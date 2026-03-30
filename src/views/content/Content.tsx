import { Toolbar, Box as MuiBox, useTheme, useMediaQuery } from "@mui/material";
import Main from "@/components/Main";
import UnderHeader from "./under-header/UnderHeader";
import DisplayData from "./display-data/DisplayData";
import scrollBarSx from "@/utils/scrollBarSx";

export default function Content() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Main>
      <Toolbar variant='dense' />
      <UnderHeader />
      <MuiBox
        overflow='auto'
        display='flex'
        flex={1}
        sx={{ pb: isMobile ? "56px" : 0, ...scrollBarSx }}>
        <DisplayData />
      </MuiBox>
    </Main>
  );
}
