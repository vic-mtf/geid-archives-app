import ArchiveManagementContent from "../archive-management-content/ArchiveManagementContent";
import DashboardContent from "../dashboard/DashboardContent";
import HelpContent from "../help/HelpContent";
import PhysicalArchiveContent from "../physical-archive/PhysicalArchiveContent";
import UserManagementContent from "../user-management/UserManagementContent";
import { ComponentType } from "react";

const displays: Record<string, ComponentType> = {
  dashboard:       DashboardContent,
  archiveManager:  ArchiveManagementContent,
  physicalArchive: PhysicalArchiveContent,
  userManagement:  UserManagementContent,
  help:            HelpContent,
};

export default displays;
