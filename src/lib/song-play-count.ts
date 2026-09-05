"use server";

import { incrementPlayCount as bumpPlayCount } from "@/lib/postgres/features";

export async function incrementPlayCount(songId: string): Promise<void> {
  const trimmedId = songId?.trim();
  if (!trimmedId) return;
  await bumpPlayCount(trimmedId);
}
