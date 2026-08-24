import { JsonLd } from "@/components/seo/json-ld";
import { PricingPageClient } from "@/components/pricing/pricing-page-client";
import { siteConfig } from "@/config/site";
import { buildBreadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Pricing",
  description: `Choose the right ${siteConfig.name} plan for your church or ministry. Compare Free, Starter, Professional, and Enterprise features.`,
  path: "/pricing",
  keywords: [
    "church software pricing",
    "ministry platform plans",
    "worship platform subscription",
  ],
});

export default function PricingPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Pricing", path: "/pricing" },
        ])}
      />
      <PricingPageClient />
    </>
  );
}
