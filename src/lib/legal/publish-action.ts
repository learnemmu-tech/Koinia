"use server";

import { revalidatePath } from "next/cache";

import { requirePlatformSuperAdmin } from "@/lib/auth/require-platform-super-admin";
import { publishLegalDraft } from "@/lib/legal/repository";

export async function publishLegalDraftAction(formData: FormData) {
  const admin = await requirePlatformSuperAdmin();
  const result = await publishLegalDraft({
    slug: String(formData.get("slug") ?? ""),
    versionLabel: String(formData.get("versionLabel") ?? ""),
    approverName: String(formData.get("approverName") ?? ""),
    approverUserId: admin.id,
    confirmation: String(formData.get("confirmation") ?? ""),
    effectiveOn: String(formData.get("effectiveOn") ?? "") || null,
    changeSummary: String(formData.get("changeSummary") ?? ""),
    actorIsSuperAdmin: true,
  });
  if (!result.ok) {
    throw new Error(result.reason);
  }
  revalidatePath("/legal");
  revalidatePath(`/legal/${String(formData.get("slug") ?? "")}`);
}
