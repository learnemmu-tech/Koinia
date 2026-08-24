import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { buildNoIndexMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";

export const metadata = buildNoIndexMetadata(
  "Admin Panel",
  "FaithConnectHub legacy admin content management panel."
);

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header
        className="sticky top-0 z-50 w-full border-b bg-background"
        suppressHydrationWarning
      >
        <div className="container flex h-14 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <div className="flex items-center gap-3">
            <Image
              src={siteConfig.image}
              alt={siteConfig.name}
              width={120}
              height={36}
              className="h-8 w-auto object-contain"
            />
            <div className="hidden xl:flex xl:flex-col">
              <span className="font-heading text-base font-semibold text-white">
                {siteConfig.name}
              </span>
              <span className="text-xs text-muted-foreground">Admin Panel</span>
            </div>
          </div>
          <div className="w-12" />
        </div>
      </header>
      <main id="admin-content">{children}</main>
    </div>
  );
}
