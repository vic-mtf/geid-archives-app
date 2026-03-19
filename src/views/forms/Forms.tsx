import ValidateForm from "./validate-form/ValidateForm";
import ArchivesForm from "./archives/ArchivesForm";
import ArchiveEditForm from "./archives/ArchiveEditForm";
import ArchiveDeleteConfirm from "./archives/ArchiveDeleteConfirm";
import LinkToPhysicalRecordDialog from "./archives/LinkToPhysicalRecordDialog";

export default function Forms() {
  return (
    <>
      <ValidateForm />
      <ArchivesForm />
      <ArchiveEditForm />
      <ArchiveDeleteConfirm />
      <LinkToPhysicalRecordDialog />
    </>
  );
}
