interface NameObject {
  lname?: string;
  lastname?: string;
  lastName?: string;
  fname?: string;
  firstname?: string;
  firstName?: string;
  mname?: string;
  middlename?: string;
  middleName?: string;
  name?: string;
  [key: string]: string | undefined;
}

export default function getFullName(obj: NameObject | null | undefined): string {
  const lname =
    obj?.lname?.trim() || obj?.lastname?.trim() || obj?.lastName?.trim();
  const fname =
    obj?.fname?.trim() || obj?.firstname?.trim() || obj?.firstName?.trim();
  const mname =
    obj?.mname?.trim() || obj?.middlename?.trim() || obj?.middleName?.trim();
  const name = obj?.name?.trim();

  if (lname || fname || mname)
    return `${fname || ""} ${mname || ""} ${lname || ""}`.trim();
  else return name || "";
}
