import type { Metadata } from "next";

import { SermonsTabContent } from "@/components/worship/sermons-tab-content";
import { SermonsAdminBar } from "@/components/admin/inline/sermons-admin-bar";
import { getPageTenantContext } from "@/lib/church-page-data";
import { getPublishedSermonsCached } from "@/lib/cached-worship-data";
import { pageContentClass, typePageTitleClass } from "@/lib/responsive-classes";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: "Sermons & Biblical Teachings",
  description:
    "Watch and read sermons and biblical teachings on FaithConnectHub. Messages to strengthen faith and deepen your walk with God.",
  path: "/sermons",
  keywords: ["Christian sermons", "biblical teaching", "sermon archive", "faith messages"],
});

export default async function SermonsPage() {
  const { scope } = await getPageTenantContext();
  const sermons = await getPublishedSermonsCached(scope);

  return (
    <section
      className={pageContentClass}
      aria-labelledby="sermons-heading"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/60">
            Teaching
          </p>
          <h1 id="sermons-heading" className={typePageTitleClass}>
            Sermons
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Messages to strengthen your faith and deepen your walk with God.
          </p>
        </div>
        <SermonsAdminBar churchId={scope.churchId ?? ""} />
      </header>

      <SermonsTabContent initialSermons={sermons} />
    </section>
  );
}
