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
      eyebrow="Watch"
      title="Videos"
      description={`Videos from ${model.church.name}.`}
    >
      <HeritageVideosList videos={videos} />
      <p className="mt-8 text-sm text-muted-foreground">
        Looking for sermons?{" "}
        <a className="underline" href={churchWebsitePath(model.church.slug, "/sermons")}>
          Browse the sermon archive
        </a>
        .
      </p>
    </HeritageContentFrame>
  );
}
