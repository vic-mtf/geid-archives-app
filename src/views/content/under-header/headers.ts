//import ArchiveServicesOptions from "./archive-service-option/ArchiveServicesOptions";
import ArchiveManagementOptions from "./archive-management-options/ArchiveManagementOptions";
import { ComponentType } from "react";

const headers: Record<string, ComponentType | null> = {
  archiveService: null,
  archiveManager: ArchiveManagementOptions,
};

export default headers;
