import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { completePostAuthRouting } from "@/lib/auth/complete-post-auth-server";
import { sanitizeCallbackUrl } from "@/lib/callback-url";

type AuthContinuePageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function AuthContinuePage({
  searchParams,
}: AuthContinuePageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/signin");
  }

  const { callbackUrl } = await searchParams;
  const routing = await completePostAuthRouting(
    userId,
    sanitizeCallbackUrl(callbackUrl, "")
  );

  redirect(routing.destination);
}
