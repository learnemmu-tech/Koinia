import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EventDetailClient } from "@/components/events/event-detail-client";
import { JsonLd } from "@/components/seo/json-ld";
import { getPageTenantContext } from "@/lib/church-page-data";
import { getEventByIdCached } from "@/lib/cached-event-data";
import { eventToIsoStartDate } from "@/lib/event-firestore";
import {
  buildBreadcrumbJsonLd,
  buildEventJsonLd,
  buildPageMetadata,
} from "@/lib/seo";

export const revalidate = 60;

type EventDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const { scope } = await getPageTenantContext();
  const event = await getEventByIdCached(scope, decodedId);

  if (!event || event.status !== "published") {
    return { title: "Event Not Found" };
  }

  return buildPageMetadata({
    title: event.title,
    description: event.description.slice(0, 160),
    path: `/events/${encodeURIComponent(decodedId)}`,
    type: "website",
    keywords: [event.title, "Christian event", "ministry event", event.location ?? ""].filter(
      Boolean
    ),
  });
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const { scope } = await getPageTenantContext();
  const event = await getEventByIdCached(scope, decodedId);

  if (!event || event.status !== "published") {
    notFound();
  }

  const path = `/events/${encodeURIComponent(event.id)}`;
  const startDate = eventToIsoStartDate(event);

  return (
    <article aria-label={event.title}>
      <JsonLd
        data={[
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Events", path: "/events" },
            { name: event.title, path },
          ]),
          ...(startDate ?
            [
              buildEventJsonLd({
                title: event.title,
                description: event.description,
                path,
                startDate,
                location: event.location,
                image: event.bannerImage,
              }),
            ]
          : []),
        ]}
      />
      <EventDetailClient eventId={event.id} initialEvent={event} />
    </article>
  );
}
