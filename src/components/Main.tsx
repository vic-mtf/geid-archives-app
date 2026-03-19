import { styled } from "@mui/material";

/**
 * Zone de contenu principale.
 * Le flex layout gère l'espace — la sidebar persistante prend sa largeur,
 * Main prend le reste via flex:1. Pas de margin manuelle nécessaire.
 */
const Main = styled("main")({
  overflow: "hidden",
  flexGrow: 1,
  flexShrink: 1,
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
});

export default Main;
