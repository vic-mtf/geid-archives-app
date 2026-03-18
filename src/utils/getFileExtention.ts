export default function getFileExtension(fileName: string | null = null): string | null {
  return fileName
    ? String(fileName)
        .slice(String(fileName).lastIndexOf(".") + 1, String(fileName).length)
        .trim()
    : null;
}

export const getName = (fileName: string | null = null): string | null =>
  fileName
    ? String(fileName).slice(0, String(fileName).lastIndexOf(".")).trim()
    : null;
