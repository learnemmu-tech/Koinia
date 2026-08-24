"use client";

import React from "react";

import type { WorshipCatalog } from "@/lib/cached-worship-data";

const WorshipCatalogContext = React.createContext<WorshipCatalog | null>(null);

export function WorshipCatalogProvider({
  catalog,
  children,
}: React.PropsWithChildren<{ catalog: WorshipCatalog }>) {
  const value = React.useMemo(() => catalog, [catalog]);
  return (
    <WorshipCatalogContext.Provider value={value}>
      {children}
    </WorshipCatalogContext.Provider>
  );
}

export function useWorshipCatalog(): WorshipCatalog | null {
  return React.useContext(WorshipCatalogContext);
}
