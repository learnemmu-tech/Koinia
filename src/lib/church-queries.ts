import "server-only";

import {
  getActiveChurches as listActive,
  getAllChurches as listAll,
  getChurchById as loadChurchById,
  getChurchBySlug as loadChurchBySlug,
} from "@/lib/postgres/tenants";
import type { FirebaseChurch } from "@/types/firebase-church";

export async function getAllChurches(): Promise<FirebaseChurch[]> {
  return listAll();
}

export async function getActiveChurches(): Promise<FirebaseChurch[]> {
  return listActive();
}

export async function getChurchById(
  churchId: string
): Promise<FirebaseChurch | null> {
  return loadChurchById(churchId);
}

export async function getChurchBySlug(
  slug: string
): Promise<FirebaseChurch | null> {
  return loadChurchBySlug(slug);
}
