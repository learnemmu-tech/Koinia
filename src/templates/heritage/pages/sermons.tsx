import { getTranslations } from "next-intl/server";

import { tenantContentQuery } from "@/lib/content/content-scope";
import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { listSermons } from "@/lib/postgres/features";
import { SermonsTabContent } from "@/components/worship/sermons-tab-content";
import { HeritageContentFrame } from "@/templates/heritage/components/heritage-content-frame";

export async function HeritageSermonsPage({
  model,
}: {
  model: ChurchWebsiteViewModel;
}) {
  const t = await getTranslations("heritage.pages");
  const sermons = await listSermons(
    tenantContentQuery({
      organizationId: model.church.organizationId,
      churchId: model.church.id,
    }),
    { publishedOnly: true, limit: 80 }
  );

  return (
    <HeritageContentFrame
      churchName={model.church.name}
      eyebrow={t("messages")}
      title={t("sermons")}
      description={t("sermonsDescription", { name: model.church.name })}
    >
      <SermonsTabContent
        initialSermons={sermons}
        isPlatformPublic
        hrefPrefix={churchWebsitePath(model.church.slug, "/sermons")}
        showCollectionHeader={false}
      />
    </HeritageContentFrame>
  );
}
