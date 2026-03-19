import { CssBaseline, Box as MuiBox } from "@mui/material";
import Header from "./header/Header";
import Content from "./content/Content";
import Navigation from "./navigation/Navigation";
import Forms from "./forms/Forms";
import MobileBottomNav from "./navigation/MobileBottomNav";

export default function Archives() {
  return (
    <>
      <MuiBox sx={{ display: "flex", flex: 1, width: "100%" }}>
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
