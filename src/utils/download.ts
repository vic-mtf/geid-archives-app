interface DownloadParams {
  url: string;
  name?: string;
}

export default function download({ url, name }: DownloadParams): void {
  const link = document.createElement("a");
  const _name = name && name.toString().toLowerCase().replace(/\s+/, "_");
  link.href = url;
  link.download = _name || url;
  link.click();
}
