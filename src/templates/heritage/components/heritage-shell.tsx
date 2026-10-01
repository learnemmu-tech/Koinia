import { HeritageFooter } from "@/templates/heritage/components/heritage-footer";
import { HeritageHeader } from "@/templates/heritage/components/heritage-header";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";

import "@/templates/heritage/heritage.css";

export function HeritageShell({
  model,
  children,
}: {
  model: ChurchWebsiteViewModel;
  children: React.ReactNode;
}) {
  return (
    <div className="heritage-theme min-h-svh w-full max-w-full">
      <a href="#heritage-main" className="heritage-skip-link">
        Skip to content
      </a>
      <HeritageHeader model={model} />
      <main id="heritage-main">{children}</main>
      <HeritageFooter model={model} />
    </div>
  );
}
