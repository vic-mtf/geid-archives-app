/**
 * ArchiveSourcePicker — Redirige vers ArchiveCreateDialog directement.
 * Le dialog ArchiveCreateDialog contient deja les deux options (appareil + workspace).
 */

import { useEffect } from "react";

const EVENT_NAME = "__open_archive_source_picker";

export default function ArchiveSourcePicker() {
  useEffect(() => {
    const root = document.getElementById("root");
    const handler = () => {
      root?.dispatchEvent(new CustomEvent("__open_archive_create", { detail: {} }));
    };
    root?.addEventListener(EVENT_NAME, handler);
    return () => root?.removeEventListener(EVENT_NAME, handler);
  }, []);

  return null;
}
