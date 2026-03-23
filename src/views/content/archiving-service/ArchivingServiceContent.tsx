import useAxios from "@/hooks/useAxios";
import useToken from "@/hooks/useToken";
import { Box } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { frFR } from "@mui/x-data-grid/locales";
import { columnsWithValidate } from "./columns";
import baseColumns from "./columns";
import useArchivePermissions from "@/hooks/useArchivePermissions";
import ArchivingServiceHeader from "./archiving-service-header/ArchivingServiceHeader";
import { useEffect, useMemo } from "react";
import scrollBarSx from "@/utils/scrollBarSx";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";

export default function ArchivingServiceContent() {
  const Authorization = useToken();
  const { canWrite } = useArchivePermissions();
  const columns = canWrite ? columnsWithValidate : baseColumns;
  const dataVersion = useSelector((store: RootState) => store.data.dataVersion);
  const [{ data, loading }, refetch] = useAxios({
    url: "/api/stuff/validate",
    headers: { Authorization },
  });

  // Refetch dès qu'une mutation a eu lieu (incrementVersion)
  useEffect(() => {
    if (dataVersion > 0) refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVersion]);

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
          pageSizeOptions={[25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
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
            if (e.row.fileUrl) {
              window.open(
                new URL(e.row.fileUrl, import.meta.env.VITE_SERVER_BASE_URL)
              );
            }
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
