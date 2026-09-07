import { Heart } from "lucide-react";

import { HomeSectionHeader } from "./home-section-header";

const SHOWCASE_PRAYERS = [
  {
    id: "prayer-family",
    text: "Please pray for my family as we walk through a difficult season. We are trusting God for wisdom, peace, and strength each day.",
  },
  {
    id: "prayer-work",
    text: "Please pray for a new opportunity in my work. I’m asking God for clarity and guidance as I make an important decision for my family.",
  },
  {
    id: "prayer-church",
    text: "Please pray for our church community—that we would continue to grow in faith, care for one another, and be a light to those around us.",
  },
] as const;

export function HomePrayerCommunitySection() {
  return (
    <section aria-labelledby="home-prayer-heading" className="space-y-3">
      <HomeSectionHeader
        id="home-prayer-heading"
        title="Prayer & Community"
        description="Share what you're carrying, pray for one another, and stay connected as a community."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SHOWCASE_PRAYERS.map((prayer) => (
          <article
            key={prayer.id}
            className="app-mobile-card flex h-full flex-col rounded-xl border border-border/50 bg-card/40 p-5 transition-colors hover-hover:hover:border-border"
          >
            <Heart
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <p className="mt-4 flex-1 text-sm leading-relaxed text-foreground">
              {prayer.text}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
