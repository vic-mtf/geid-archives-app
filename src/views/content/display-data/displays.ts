import ArchiveManagementContent from "../archive-management-content/ArchiveManagementContent";
import DashboardContent from "../dashboard/DashboardContent";
import HelpContent from "../help/HelpContent";
import PhysicalArchiveContent from "../physical-archive/PhysicalArchiveContent";
import { ComponentType } from "react";

const displays: Record<string, ComponentType> = {
  dashboard:       DashboardContent,
  archiveManager:  ArchiveManagementContent,
  physicalArchive: PhysicalArchiveContent,
  help:            HelpContent,
};

export default displays;
