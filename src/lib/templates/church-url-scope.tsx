"use client";

import { createContext, useContext } from "react";

export type ChurchUrlScopeValue = {
  organizationId: string;
  churchId: string;
  name: string;
  slug: string;
  logoUrl?: string;
};

const ChurchUrlScopeContext = createContext<ChurchUrlScopeValue | null>(null);

/** Church resolved from `/c/[slug]`. Absent on the normal app routes. */
export function ChurchUrlScopeProvider({
  organizationId,
  churchId,
  name,
  slug,
  logoUrl,
  children,
}: ChurchUrlScopeValue & { children: React.ReactNode }) {
  return (
    <ChurchUrlScopeContext.Provider
      value={{ organizationId, churchId, name, slug, logoUrl }}
    >
      {children}
    </ChurchUrlScopeContext.Provider>
  );
}

export function useChurchUrlScope(): ChurchUrlScopeValue | null {
  return useContext(ChurchUrlScopeContext);
}
