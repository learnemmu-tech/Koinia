import Image from "next/image";
import type { ReactNode } from "react";

import { PARISH_DEFAULTS } from "@/templates/parish/defaults";

function bannerImage(label: string, explicit?: string) {
  if (explicit) return explicit;
  const key = label.toLowerCase();
  if (key.includes("sermon")) return PARISH_DEFAULTS.sermons[0];
  if (key.includes("song")) return PARISH_DEFAULTS.services[0];
  if (key.includes("article") || key.includes("stor")) return PARISH_DEFAULTS.stories[0];
  if (key.includes("event")) return PARISH_DEFAULTS.events[0];
  if (key.includes("ministr")) return PARISH_DEFAULTS.ministries[0];
  if (key.includes("book")) return PARISH_DEFAULTS.stories[1];
  if (key.includes("video") || key.includes("short")) return PARISH_DEFAULTS.sermons[2];
  if (key.includes("prayer")) return PARISH_DEFAULTS.quote;
  if (key.includes("community") || key.includes("shepherd")) return PARISH_DEFAULTS.gallery[0];
  return PARISH_DEFAULTS.about;
}

function ParishBanner({
  image,
  eyebrow,
  title,
  description,
}: {
  image: string;
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="parish-inner-banner">
      <Image src={image} alt="" fill className="object-cover object-[center_40%]" sizes="100vw" />
      <div className="parish-inner-scrim" />
      <div className="parish-inner-copy">
        {eyebrow ? <p className="parish-eyebrow text-[#e6c98a]">{eyebrow}</p> : null}
        <h1 className="parish-display mt-2 text-4xl text-white sm:text-5xl">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-white/90">{description}</p> : null}
      </div>
    </section>
  );
}

export function ParishContentFrame({
  churchName,
  eyebrow,
  title,
  description,
  image,
  children,
}: {
  churchName: string;
  eyebrow: string;
  title: string;
  description?: string;
  image?: string;
  children: ReactNode;
}) {
  return (
    <>
      <ParishBanner
        image={bannerImage(`${eyebrow} ${title}`, image)}
        eyebrow={churchName}
        title={title}
        description={description}
      />
      <section className="parish-page">
        <div className="mt-2">{children}</div>
      </section>
    </>
  );
}

export function ParishDetailFrame({ children }: { children: ReactNode }) {
  return <div className="parish-page">{children}</div>;
}
