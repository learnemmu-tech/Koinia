import Image from "next/image";
import type { ReactNode } from "react";

import type { ChurchWebsiteViewModel } from "@/lib/templates/types";

import "@/templates/parish/parish.css";

export function ParishAuthShell({
  model,
  children,
}: {
  model: ChurchWebsiteViewModel;
  children: ReactNode;
}) {
  const image = model.website.images.hero || model.church.bannerUrl;
  return (
    <div className="parish-theme parish-auth">
      <aside className="parish-auth-visual">
        {image ? (
          <Image src={image} alt="" fill className="object-cover opacity-45" sizes="50vw" />
        ) : null}
        <div className="relative">
          <p className="parish-eyebrow text-[#C6A36A]">{model.church.name}</p>
          <h2 className="parish-display mt-3 max-w-md text-5xl">
            {model.website.heroHeadline || model.church.welcomeMessage || model.church.name}
          </h2>
        </div>
      </aside>
      <section className="parish-auth-panel">
        <div className="parish-auth-card">{children}</div>
      </section>
    </div>
  );
}
