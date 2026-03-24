/**
 * exportCSV — Exporte la liste d'archives filtrée en CSV (UTF-8 BOM pour Excel).
 */

import { STATUS_LABEL, normalizeStatus } from "@/constants/lifecycle";

interface ExportableRow {
  designation?: string;
  classNumber?: string;
  refNumber?: string;
  folder?: string;
  status?: string;
  validated?: boolean;
  createdAt?: string | Date | null;
  [key: string]: unknown;
}

export function exportArchivesCSV(rows: ExportableRow[]): void {
  const cols = [
    { key: "designation",   label: "Désignation" },
    { key: "classNumber",   label: "N° de classe" },
    { key: "refNumber",     label: "N° référence" },
    { key: "folder",        label: "Dossier" },
    { key: "status",        label: "Statut" },
    { key: "createdAt",     label: "Date création" },
  ];
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = cols.map((c) => escape(c.label)).join(";");
  const body = rows.map((r) =>
    cols.map((c) => {
      const raw = r[c.key];
      if (c.key === "status") return escape(STATUS_LABEL[normalizeStatus(r.status, r.validated)] ?? raw);
      if (c.key === "createdAt" && raw) return escape(new Date(raw as string).toLocaleDateString("fr-FR"));
      return escape(raw);
    }).join(";")
  ).join("\n");
  const csv = "\uFEFF" + header + "\n" + body; // BOM UTF-8 pour Excel
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `archives_export_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
