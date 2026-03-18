import { useMemo } from "react";
import type { ArchiveDocument } from "../types";

interface DataRow {
  id: number;
  createdAt: Date;
  classNum: string;
  code: string;
  destination: string;
  urgence: string;
  refNum: string;
  numServiceDis: string;
  origin: string | undefined;
  type: string | undefined;
  designation: string | undefined;
  object: string | undefined;
  description: string | undefined;
  secrete: string;
  status: string;
  subType: string;
  [key: string]: unknown;
}

export default function useRows(data: ArchiveDocument[] = []): DataRow[] {
  const rows = useMemo(
    () =>
      data.map((item, index) => ({
        ...item,
        id: index + 1,
        createdAt: new Date(item.createdAt as string),
        classNum: "---------",
        code: "---------",
        destination: "---------",
        urgence: "---------",
        refNum: "---------",
        numServiceDis: "---------",
        origin: item.createdBy?.role,
        type: (item.type as { type?: string } | undefined)?.type,
        designation: item?.designation,
        object: item?.object as string | undefined,
        description: item?.description as string | undefined,
        secrete: "---------",
        status: "---------",
        subType: (item.type as { subType?: string } | undefined)?.subType || "---------",
      })),
    [data]
  );

  return rows;
}
