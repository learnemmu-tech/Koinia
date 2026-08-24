import { unstable_cache } from "next/cache";

import type { FirebaseChurch } from "@/types/firebase-church";

import { getActiveChurches, getAllChurches, getChurchById } from "./church-queries";

const REVALIDATE_SECONDS = 60;

export const getAllChurchesCached = unstable_cache(
  async (): Promise<FirebaseChurch[]> => getAllChurches(),
  ["all-churches"],
  { revalidate: REVALIDATE_SECONDS, tags: ["churches"] }
);

export const getActiveChurchesCached = unstable_cache(
  async (): Promise<FirebaseChurch[]> => {
    try {
      return await getActiveChurches();
    } catch (error) {
      console.error("[churches] Failed to load active churches:", error);
      return [];
    }
  },
  ["active-churches"],
  { revalidate: REVALIDATE_SECONDS, tags: ["churches"] }
);

export async function getChurchByIdCached(
  churchId: string
): Promise<FirebaseChurch | null> {
  return unstable_cache(
    async () => getChurchById(churchId),
    ["church-by-id", churchId],
    { revalidate: REVALIDATE_SECONDS, tags: [`church-${churchId}`] }
  )();
}
