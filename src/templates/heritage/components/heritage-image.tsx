"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { HERITAGE_FALLBACK_IMAGES } from "@/templates/heritage/theme";

type HeritageImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  fallback?: string;
};

export function HeritageImage({
  src,
  alt,
  className,
  sizes = "(max-width: 768px) 100vw, 80vw",
  priority = false,
  quality = 90,
  fallback = HERITAGE_FALLBACK_IMAGES.hero,
}: HeritageImageProps) {
  const [current, setCurrent] = useState(src || fallback);

  useEffect(() => {
    setCurrent(src || fallback);
  }, [src, fallback]);

  return (
    <Image
      src={current}
      alt={alt}
      fill
      sizes={sizes}
      quality={quality}
      priority={priority}
      className={cn("object-cover object-center", className)}
      onError={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (current !== fallback) setCurrent(fallback);
      }}
    />
  );
}

type HeritageMediaProps = HeritageImageProps & {
  ratioClassName?: string;
};

export function HeritageMedia({
  ratioClassName = "aspect-[16/10]",
  className,
  ...image
}: HeritageMediaProps) {
  return (
    <div className={cn("heritage-media relative overflow-hidden", ratioClassName, className)}>
      <HeritageImage {...image} />
    </div>
  );
}
