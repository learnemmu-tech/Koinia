import { Heart } from "lucide-react";

import { HomeSectionHeader } from "./home-section-header";

export function HomePrayerCommunitySection({
  prayers,
}: {
  prayers: Array<{ id: string; text: string }>;
}) {
  return (
    <section aria-labelledby="home-prayer-heading" className="space-y-3">
      <HomeSectionHeader
        id="home-prayer-heading"
        title="Prayer & Community"
        description="Share what you're carrying, pray for one another, and stay connected as a community."
      />
      {prayers.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/70 px-5 py-8 text-sm text-muted-foreground">
          No public prayer requests yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {prayers.map((prayer) => (
            <article
              key={prayer.id}
              className="app-mobile-card flex h-full flex-col rounded-xl border border-border/50 bg-card/40 p-5 transition-colors hover-hover:hover:border-border"
            >
              <Heart className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <p className="mt-4 flex-1 text-sm leading-relaxed text-foreground">{prayer.text}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
