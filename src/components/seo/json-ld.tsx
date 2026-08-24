import {
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
} from "@/lib/seo";

type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function SiteJsonLd() {
  return (
    <JsonLd data={[buildOrganizationJsonLd(), buildWebSiteJsonLd()]} />
  );
}
