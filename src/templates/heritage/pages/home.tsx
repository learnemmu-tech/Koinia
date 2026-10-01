import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { HeritageCommunitySection } from "@/templates/heritage/sections/heritage-community";
import { HeritageEventsSection } from "@/templates/heritage/sections/heritage-events";
import { HeritageGivingSection } from "@/templates/heritage/sections/heritage-giving";
import { HeritageHero } from "@/templates/heritage/sections/heritage-hero";
import { HeritageResourcesSection } from "@/templates/heritage/sections/heritage-resources";
import { HeritageWorshipSermonSection } from "@/templates/heritage/sections/heritage-worship-sermon";

/**
 * Heritage home: hero, worship and featured sermon, community, library, giving.
 * Ministries live on `/ministries`. About lives on `/about`.
 * Events remain when the church has upcoming gatherings.
 */
export function HeritageHomePage({ model }: { model: ChurchWebsiteViewModel }) {
  return (
    <>
      <HeritageHero model={model} />
      <HeritageWorshipSermonSection model={model} />
      <HeritageCommunitySection model={model} />
      <HeritageEventsSection model={model} />
      <HeritageResourcesSection model={model} />
      <HeritageGivingSection model={model} />
    </>
  );
}
