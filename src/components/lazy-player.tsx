"use client";

import dynamic from "next/dynamic";

export const LazyPlayer = dynamic(
  () => import("@/components/player").then((mod) => mod.Player),
  { ssr: false }
);
