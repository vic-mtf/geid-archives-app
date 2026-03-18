import { styled, Typography, TypographyProps } from "@mui/material";

const Link = styled((props: TypographyProps<"a">) => (
  <Typography variant="body2" component="a" fontWeight="bold" {...props} />
))(({ theme }) => ({
  textDecoration: "none",
  color: theme.palette.primary.main,
}));

export default Link;
