import { getTranslations } from "next-intl/server";

import { tenantContentQuery } from "@/lib/content/content-scope";
import { getPublishedEventsGroupedCached } from "@/lib/cached-event-data";
import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import type { FirebaseEvent } from "@/types/firebase-event";
import { EventsListClient } from "@/components/events/events-list-client";
import { EventDetailClient } from "@/components/events/event-detail-client";
import {
  HeritageContentFrame,
  HeritageDetailFrame,
} from "@/templates/heritage/components/heritage-content-frame";

export async function HeritageEventsPage({
  model,
}: {
  model: ChurchWebsiteViewModel;
}) {
  const t = await getTranslations("heritage.events");
  const { upcoming, past } = await getPublishedEventsGroupedCached(
    tenantContentQuery({
      organizationId: model.church.organizationId,
      churchId: model.church.id,
    })
  );

  return (
    <HeritageContentFrame
      churchName={model.church.name}
      eyebrow={t("eyebrow")}
      title={t("pageTitle")}
      description={t("pageDescription", { name: model.church.name })}
    >
      <EventsListClient
        initialUpcoming={upcoming}
        initialPast={past}
        isPlatformPublic
        hrefPrefix={churchWebsitePath(model.church.slug, "/events")}
      />
    </HeritageContentFrame>
  );
}

export function HeritageEventDetailPage({
  model,
  item,
}: {
  model: ChurchWebsiteViewModel;
  item: FirebaseEvent;
}) {
  return (
    <HeritageDetailFrame>
      <EventDetailClient
        eventId={item.id}
        initialEvent={item}
        listHref={churchWebsitePath(model.church.slug, "/events")}
      />
    </HeritageDetailFrame>
  );
}
