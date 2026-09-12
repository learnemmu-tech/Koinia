import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { ShepherdChat } from "@/components/shepherd/shepherd-chat";
import { resolveShepherdUserContext } from "@/lib/shepherd/resolve-context";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Shepherd AI",
  description: `Scripture, faith, and ministry companion inside ${siteConfig.name}.`,
};

export default async function ShepherdPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/signin?callbackUrl=/shepherd");
  }

  const context = await resolveShepherdUserContext(userId, undefined);
  if (!context) {
    redirect("/auth/continue");
  }

  return (
    <div
      data-page-fullbleed
      className="shepherd-theme flex h-full min-h-0 flex-col"
    >
      <ShepherdChat
        initialMode={context.mode}
        displayName={context.displayName}
      />
    </div>
  );
}
