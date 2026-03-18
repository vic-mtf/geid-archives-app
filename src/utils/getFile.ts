import { isPlainObject } from "lodash";

type InputFileProps = Partial<Pick<HTMLInputElement, "accept" | "multiple">>;

export default async function getFile(
  props?: InputFileProps
): Promise<FileList> {
  const inputFile = document.createElement("input");
  return await new Promise((resolve, reject) => {
    if (props && isPlainObject(props)) {
      (Object.keys(props) as (keyof InputFileProps)[]).forEach((prop) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (inputFile as any)[prop] = props[prop];
      });
    }
    inputFile.type = "file";
    inputFile.value = "";
    inputFile.onchange = (event) => {
      const target = event.target as HTMLInputElement;
      const { files } = target;
      if (files?.length) resolve(files);
      else reject(new Error("impossible to get files"));
    };
    inputFile.click();
  });
}
