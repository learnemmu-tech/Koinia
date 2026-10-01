import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import type { FirebaseSermon } from "@/types/firebase-sermon";
import { SermonDetailView } from "@/components/sermons/sermon-detail-view";
import { HeritageDetailFrame } from "@/templates/heritage/components/heritage-content-frame";

export function HeritageSermonDetailPage({
  model,
  item,
}: {
  model: ChurchWebsiteViewModel;
  item: FirebaseSermon;
}) {
  return (
    <HeritageDetailFrame>
      <SermonDetailView
        sermon={item}
        hrefPrefix={churchWebsitePath(model.church.slug, "/sermons")}
      />
    </HeritageDetailFrame>
  );
}
