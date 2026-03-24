import ValidateForm from "./validate-form/ValidateForm";
import ArchivesForm from "./archives/ArchivesForm";
import ArchiveCreateDialog from "./archives/ArchiveCreateDialog";
import ArchiveEditForm from "./archives/ArchiveEditForm";
import ArchiveDeleteConfirm from "./archives/ArchiveDeleteConfirm";
import LinkToPhysicalRecordDialog from "./archives/LinkToPhysicalRecordDialog";
import DuaConfigDialog from "./archives/DuaConfigDialog";
import GlobalSearchDialog from "./search/GlobalSearchDialog";
import ArchiveSourcePicker from "./archives/ArchiveSourcePicker";
import WorkspaceFilePicker from "./archives/WorkspaceFilePicker";
import FileLoadingSnackbar from "./archives/FileLoadingSnackbar";

export default function Forms() {
  return (
    <>
      <ValidateForm />
      <ArchivesForm />
      <ArchiveCreateDialog />
      <ArchiveEditForm />
      <ArchiveDeleteConfirm />
      <LinkToPhysicalRecordDialog />
      <DuaConfigDialog />
      <GlobalSearchDialog />
      <ArchiveSourcePicker />
      <WorkspaceFilePicker />
      <FileLoadingSnackbar />
    </>
  );
}
