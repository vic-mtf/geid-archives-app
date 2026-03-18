import CollapsedBreadcrumbs from "./CollapsedBreadcrumbs";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import { IconButton } from "@mui/material";

export default function ArchiveServicesOptions() {
  return (
    <>
      <CollapsedBreadcrumbs />
      <IconButton>
        <FilterAltOutlinedIcon fontSize='small' />
      </IconButton>
    </>
  );
}
