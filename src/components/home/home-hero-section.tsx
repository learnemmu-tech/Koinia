import type { FirebaseChurch } from "@/types/firebase-church";

import { getVerseOfTheDay } from "@/lib/worship-verses";

import { HomeHeroSectionClient } from "./home-hero-section-client";

type HomeHeroSectionProps = {
  church?: FirebaseChurch | null;
  isPlatformPublic?: boolean;
};

export function HomeHeroSection({
  church,
  isPlatformPublic = false,
}: HomeHeroSectionProps) {
  const verse = getVerseOfTheDay();

  return (
    <HomeHeroSectionClient
      church={church}
      verse={verse}
      isPlatformPublic={isPlatformPublic}
    />
  );
}
