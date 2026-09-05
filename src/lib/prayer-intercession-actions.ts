"use server";

import { listUserIntercessions } from "@/lib/postgres/features";

export async function userHasPrayedForRequest(
  requestId: string,
  userId: string
): Promise<boolean> {
  const items = await listUserIntercessions(userId);
  return items.some((item) => item.requestId === requestId);
}
