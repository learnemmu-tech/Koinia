import { getTranslations } from "next-intl/server";

import { tenantContentQuery } from "@/lib/content/content-scope";
import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { listPublishedChurchVideos } from "@/lib/postgres/church-videos";
import { HeritageContentFrame } from "@/templates/heritage/components/heritage-content-frame";
import { HeritageVideosList } from "@/templates/heritage/components/heritage-videos-list";

export async function HeritageVideosPage({
  model,
}: {
  model: ChurchWebsiteViewModel;
}) {
  const t = await getTranslations("heritage.pages");
  const videos = await listPublishedChurchVideos({
    query: tenantContentQuery({
      organizationId: model.church.organizationId,
      churchId: model.church.id,
    }),
    limit: 80,
  });

  return (
    <HeritageContentFrame
      churchName={model.church.name}
      eyebrow={t("watch")}
      title={t("videos")}
      description={t("videosDescription", { name: model.church.name })}
    >
      <HeritageVideosList videos={videos} />
      <p className="mt-8 text-sm text-muted-foreground">
        {t("lookingForSermons")}{" "}
        <a className="underline" href={churchWebsitePath(model.church.slug, "/sermons")}>
          {t("browseArchive")}
        </a>
        .
      </p>
    </HeritageContentFrame>
  );
}
