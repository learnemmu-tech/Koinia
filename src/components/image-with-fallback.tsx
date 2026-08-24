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

  const [error, setError] = React.useState<React.SyntheticEvent<
    HTMLImageElement,
    Event
  > | null>(null);

  React.useEffect(() => {
    setError(null);
  }, [src]);

  const imageSrc = error ? fallback : src || fallback;

  if (!imageSrc) {
    return null;
  }

  return (
    <Image
      src={imageSrc}
      alt={alt || "image"}
      onError={setError}
      className={cn(className, error && "dark:invert")}
      {...restProps}
    />
  );
}
