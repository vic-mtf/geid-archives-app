import { Toolbar, Box as MuiBox, useTheme, useMediaQuery } from "@mui/material";
import Main from "../../components/Main";
import UnderHeader from "./under-header/UnderHeader";
import DisplayData from "./display-data/DisplayData";

export default function Content() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Main>
      <Toolbar variant='dense' />
      <UnderHeader />
      <MuiBox
        overflow='hidden'
        display='flex'
        flexShrink={0}
        flex={1}
        sx={{ pb: isMobile ? "56px" : 0 }}>
        <DisplayData />
      </MuiBox>
    </Main>
  );
}
