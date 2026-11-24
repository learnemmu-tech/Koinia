import React from "react";
import { auth } from "@clerk/nextjs/server";

import { AuthenticatedAppShell } from "@/components/public-site/authenticated-app-shell";
import { userNeedsTermsAcceptance } from "@/lib/legal/repository";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { PublicSiteShell } from "@/components/public-site/public-site-shell";
import { traceRequestStage } from "@/lib/nav-trace-server";

export default async function Layout({ children }: React.PropsWithChildren) {
  const { userId } = await traceRequestStage("app.auth", () => auth());

  if (!userId) {
    return <PublicSiteShell>{children}</PublicSiteShell>;
  }

  const appUser = await getAppUserByClerkId(userId);
  const acceptance = appUser
    ? await userNeedsTermsAcceptance(appUser.id).catch(() => null)
    : null;

  return (
    <AuthenticatedAppShell termsVersionToAccept={acceptance?.required ? acceptance.versionLabel : null}>
      {children}
    </AuthenticatedAppShell>
  );
}
