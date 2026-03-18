import useAxios from "../../../hooks/useAxios";
//import useData from "../../../hooks/useData";
import useToken from "../../../hooks/useToken";
import { Box } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { frFR } from "@mui/x-data-grid/locales";
import columns from "./columns";
import ArchivingServiceHeader from "./archiving-service-header/ArchivingServiceHeader";
import { useMemo } from "react";
import scrollBarSx from "../../../utils/scrollBarSx";

export default function ArchivingServiceContent() {
  const Authorization = useToken();
  const [{ data, loading }] = useAxios({
    url: "api/stuff/archives/archived/",
    headers: { Authorization },
  });

  const rows = useMemo(
    () =>
      (data as Array<Record<string, unknown>>)?.map((data) => ({
        ...data,
        type: (data.type as { type: string }).type,
        createdAt: new Date(data.createdAt as string),
        id: data._id,
      })) || [],
    [data]
  );

  return (
    <Box display='flex' flex={1} position='relative'>
      <Box
        position='absolute'
        display='flex'
        flex={1}
        width='100%'
        height='100%'
        top={0}>
        <DataGrid
          rows={rows}
          loading={loading}
          columns={columns}
          showCellVerticalBorder={false}
          showColumnVerticalBorder={false}
          hideFooter
          sx={{
            border: "none",
            "& .MuiDataGrid-cell": {
              outline: "none",
              border: "none",
            },
            "& .MuiDataGrid-cell:focus": {
              outline: "none",
              border: "none",
            },
            "& *": scrollBarSx as Record<string, unknown>,
          }}
          onRowClick={(e) => {
            window.open(
              new URL(e.row.fileUrl, import.meta.env.VITE_SERVER_BASE_URL)
            );
          }}
          disableRowSelectionOnClick
          disableDensitySelector
          slots={{ toolbar: ArchivingServiceHeader }}
          localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
        />
      </Box>
    </Box>
  );
}
