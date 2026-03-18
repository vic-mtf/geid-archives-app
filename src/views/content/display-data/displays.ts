import ArchiveManagementContent from "../archive-management-content/ArchiveManagementContent";
import ArchivingServiceContent from "../archiving-service/ArchivingServiceContent";
import { ComponentType } from "react";

const displays: Record<string, ComponentType> = {
  archiveService: ArchivingServiceContent,
  archiveManager: ArchiveManagementContent,
};

export default displays;
