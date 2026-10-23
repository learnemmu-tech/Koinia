"use client";

import { useEffect } from "react";

import { persistActiveChurchCookie } from "@/lib/church-cookies";

/** Keep the existing app scoped to the church in the URL. */
export function SyncActiveChurch({ churchId }: { churchId: string }) {
  useEffect(() => {
    persistActiveChurchCookie(churchId);
  }, [churchId]);
  return null;
}
