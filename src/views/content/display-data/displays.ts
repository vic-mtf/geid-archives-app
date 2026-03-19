import ArchiveManagementContent from "../archive-management-content/ArchiveManagementContent";
import ArchivingServiceContent from "../archiving-service/ArchivingServiceContent";
import DashboardContent from "../dashboard/DashboardContent";
import PhysicalArchiveContent from "../physical-archive/PhysicalArchiveContent";
import HelpContent from "../help/HelpContent";
import { ComponentType } from "react";

const displays: Record<string, ComponentType> = {
  dashboard: DashboardContent,
  physicalArchive: PhysicalArchiveContent,
  archiveService: ArchivingServiceContent,
  archiveManager: ArchiveManagementContent,
  help: HelpContent,
};

export default displays;
