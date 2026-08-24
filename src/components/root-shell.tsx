"use client";

import React from "react";

import { cn } from "@/lib/utils";

type RootShellProps = {
  children: React.ReactNode;
};

export function RootShell({ children }: RootShellProps) {
  return (
    <main className={cn("mx-auto w-full max-w-7xl overflow-x-hidden p-3 sm:p-4 md:p-6")}>
      {children}
    </main>
  );
}
