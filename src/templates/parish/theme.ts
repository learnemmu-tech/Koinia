/** Parish-only default hero. Never a Heritage path. */
export const PARISH_DEFAULT_HERO = "/templates/parish/hero.jpg";

export function parishHeroImage(configured?: string | null, bannerUrl?: string | null) {
  const chosen = [configured, bannerUrl].find(
    (value) => value && !value.includes("/templates/heritage/")
  );
  return chosen || PARISH_DEFAULT_HERO;
}
