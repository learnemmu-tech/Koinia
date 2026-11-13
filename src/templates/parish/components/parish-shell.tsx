import type { ReactNode } from "react";

import { ParishFooter } from "@/templates/parish/components/parish-footer";
import { ParishHeader } from "@/templates/parish/components/parish-header";
import { ParishLiveRefresh } from "@/templates/parish/components/parish-live-refresh";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";

import "@/templates/parish/parish.css";

export function ParishShell({
  model,
  children,
}: {
  model: ChurchWebsiteViewModel;
  children: ReactNode;
}) {
  return (
    <div className="parish-theme min-h-svh">
      <a href="#parish-main" className="parish-skip">
        Skip to content
      </a>
      <ParishLiveRefresh />
      <ParishHeader model={model} />
      <main id="parish-main">{children}</main>
      <ParishFooter model={model} />
    </div>
  );
}
