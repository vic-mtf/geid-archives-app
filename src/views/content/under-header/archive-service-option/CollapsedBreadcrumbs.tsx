/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";
import { Breadcrumbs, Box as MuiBox } from "@mui/material";

function handleClick(event: React.MouseEvent<HTMLDivElement>) {
  event.preventDefault();
  console.info("You clicked a breadcrumb.");
}

export default function CollapsedBreadcrumbs() {
  return (
    <MuiBox
      role='presentation'
      onClick={handleClick}
      sx={{
        flexGrow: 1,
        mx: 1,
      }}>
      <Breadcrumbs maxItems={5} aria-label='breadcrumb'>
        {/* <Link underline='hover' color='inherit' href='#'>
          Directions
        </Link>
        <Link underline='hover' color='inherit' href='#'>
          Sous direction
        </Link>
        <Link underline='hover' color='inherit' href='#'>
          Archives
        </Link>
        <Link underline='hover' color='inherit' href='#'>
          Documents
        </Link>
        <Typography color='text.primary'>Dantic</Typography> */}
      </Breadcrumbs>
    </MuiBox>
  );
}
