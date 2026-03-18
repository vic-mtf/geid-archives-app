import React from "react";
import defaultIcon from "./icons8-info-64.png";

interface ImgToIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  uri?: string;
  size?: number | string;
  alt?: string;
}

export default function ImgToIcon({
  src = "",
  uri = "",
  size = "",
  alt,
  ...otherProps
}: ImgToIconProps) {
  const srcUrl = src || uri || defaultIcon;
  return (
    <React.Fragment>
      <img
        src={srcUrl}
        height={size}
        width={size}
        {...otherProps}
        alt={alt || srcUrl}
      />
    </React.Fragment>
  );
}
