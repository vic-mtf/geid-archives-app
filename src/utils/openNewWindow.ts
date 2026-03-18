const width = window.innerWidth * 10;
const height = window.innerHeight * 10;
const left = (window.innerWidth - width) / 2;
const top = (window.innerHeight - height) / 2;

interface OpenWindowArgs {
  url?: string;
  width?: number;
  height?: number;
  top?: number;
  left?: number;
  target?: string;
  popup?: string;
  location?: string;
  menubar?: string;
  status?: string;
  [key: string]: string | number | undefined;
}

const _defaults: OpenWindowArgs = {
  width,
  height,
  top,
  left,
  target: "_blank",
  popup: "yes",
  location: "no",
  menubar: "no",
  status: "no",
};

const BASE_URL = import.meta.env.BASE_URL as string;

const getFullUrl = (input: string | undefined): string => {
  if (!input) return BASE_URL;
  try {
    const url = new URL(input);
    return url.href;
  } catch {
    return `${BASE_URL}/${input.replace(/^\/+/, "")}`;
  }
};

export default function openNewWindow(args: OpenWindowArgs = _defaults): Window | null {
  const { url, target, ...otherProps } = { ..._defaults, ...args };
  const options = Object.keys(otherProps)
    .map((key) => `${key}=${otherProps[key]}`)
    .join(", ");
  const uri = getFullUrl(url);
  const win = window.open(uri, target ?? "_blank", options);
  window.addEventListener("beforeunload", () => {
    if (win && !win.closed) win.close();
  });
  return win;
}
