import { keyBy, merge } from "lodash";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import _columns from "../utils/columns";
import type { RootState } from "../redux/store";
import type { ColumnDef } from "../types";

export default function useColumns(): ColumnDef[] {
  const cols = useSelector((store: RootState) => (store.data as { columns?: ColumnDef[] }).columns);
  const columns = useMemo(() => {
    const _cols = merge(keyBy(_columns, "field"), keyBy(cols ?? [], "field"));
    return Object.values(_cols) as ColumnDef[];
  }, [cols]);
  return columns;
}
