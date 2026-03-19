import ValidateForm from "./validate-form/ValidateForm";
import ArchivesForm from "./archives/ArchivesForm";
import ArchiveEditForm from "./archives/ArchiveEditForm";
import ArchiveDeleteConfirm from "./archives/ArchiveDeleteConfirm";

export default function Forms() {
  return (
    <>
      <ValidateForm />
      <ArchivesForm />
      <ArchiveEditForm />
      <ArchiveDeleteConfirm />
    </>
  );
}
