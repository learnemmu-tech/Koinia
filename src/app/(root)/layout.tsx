import React from "react";
import { auth } from "@clerk/nextjs/server";

import { AuthenticatedAppShell } from "@/components/public-site/authenticated-app-shell";
import { PublicSiteShell } from "@/components/public-site/public-site-shell";

export default async function Layout({ children }: React.PropsWithChildren) {
  const { userId } = await auth();

  if (!userId) {
    return <PublicSiteShell>{children}</PublicSiteShell>;
  }

  return <AuthenticatedAppShell>{children}</AuthenticatedAppShell>;
}
