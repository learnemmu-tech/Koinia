"use client";

import React from "react";

import type { Type } from "@/types";

type PlayButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "type"
> & {
  type: Type;
  token: string | string[];
};

export function PlayButton({
  type: _type,
  token: _token,
  children,
  ...restProps
}: PlayButtonProps) {
  return (
    <button type="button" aria-label="Play" disabled {...restProps}>
      {children}
    </button>
  );
}
