"use client";

import React from "react";
import Image from "next/image";

import type { ImageProps } from "next/image";

import { cn } from "@/lib/utils";

type ImageWithFallbackProps = ImageProps & {
  fallback: ImageProps["src"];
};

export function ImageWithFallback(props: ImageWithFallbackProps) {
  const { fallback, alt = "", src, className, ...restProps } = props;

  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    setFailed(false);
  }, [src]);

  const imageSrc = failed ? fallback : src || fallback;

  if (!imageSrc) {
    return null;
  }

  return (
    <Image
      {...restProps}
      src={imageSrc}
      alt={alt || "image"}
      onError={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!failed) setFailed(true);
      }}
      className={cn(className, failed && "dark:invert")}
    />
  );
}
