import ArchiveManagementOptions from "./archive-management-options/ArchiveManagementOptions";
import { ComponentType } from "react";

const headers: Record<string, ComponentType | null> = {
  dashboard: null,
  physicalArchive: null,
  archiveService: null,
  archiveManager: ArchiveManagementOptions,
};

export default headers;
