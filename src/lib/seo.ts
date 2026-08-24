import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { absoluteUrl } from "@/lib/utils";

/** Default platform keywords for Christian worship & ministry SEO. */
export const SEO_KEYWORDS = [
  "Christian worship",
  "worship songs",
  "worship lyrics",
  "Christian sermons",
  "biblical teaching",
  "Christian articles",
  "prayer requests",
  "ministry events",
  "Christian donations",
  "faith community",
  "church platform",
  "worship ministry",
  "FaithConnectHub",
] as const;

export type PageMetadataOptions = {
  /** Page title without site suffix — root template adds `| FaithConnectHub`. */
  title: string;
  description: string;
  /** URL path starting with `/`. */
  path: string;
  keywords?: string[];
  /** Absolute or site-relative image URL for OG/Twitter. */
  image?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  type?: "website" | "article" | "music.song";
  noIndex?: boolean;
  /** When true, use `/api/og` even if a default image exists. */
  useDynamicOg?: boolean;
};

export function buildOgImageUrl(options: {
  title: string;
  description: string;
  image?: string;
}): string {
  const image =
    options.image ?
      options.image.startsWith("http") ?
        options.image
      : absoluteUrl(options.image)
    : absoluteUrl(siteConfig.image);

  const params = new URLSearchParams({
    title: options.title,
    description: options.description,
    image,
  });

  return `/api/og?${params.toString()}`;
}

function resolveImageUrl(image?: string): string {
  if (!image) return absoluteUrl(siteConfig.image);
  return image.startsWith("http") ? image : absoluteUrl(image);
}

export function buildPageMetadata(options: PageMetadataOptions): Metadata {
  const canonicalUrl = absoluteUrl(options.path);
  const keywords = options.keywords ?? [...SEO_KEYWORDS];

  const hasCustomImage = Boolean(options.image);
  const imageUrl =
    hasCustomImage && !options.useDynamicOg ?
      resolveImageUrl(options.image)
    : absoluteUrl(
        buildOgImageUrl({
          title: options.title,
          description: options.description,
          image: options.image,
        })
      );

  return {
    title: options.title,
    description: options.description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: options.noIndex ?
      { index: false, follow: false, googleBot: { index: false, follow: false } }
    : { index: true, follow: true },
    openGraph: {
      title: options.title,
      description: options.description,
      url: canonicalUrl,
      siteName: siteConfig.name,
      type: options.type ?? "website",
      locale: "en_US",
      images: [
        {
          url: imageUrl,
          width: options.imageWidth ?? (hasCustomImage ? 800 : 1200),
          height: options.imageHeight ?? (hasCustomImage ? 800 : 630),
          alt: options.imageAlt ?? options.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: options.title,
      description: options.description,
      images: [imageUrl],
    },
  };
}

export function buildNoIndexMetadata(title: string, description?: string): Metadata {
  return buildPageMetadata({
    title,
    description: description ?? `${title} — ${siteConfig.name}`,
    path: "/",
    noIndex: true,
  });
}

// ─── JSON-LD builders ───────────────────────────────────────────────────────

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: absoluteUrl(siteConfig.image),
    description: siteConfig.description,
    email: siteConfig.author.email,
    sameAs: [siteConfig.author.url].filter(Boolean),
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(siteConfig.image),
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/search")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildArticleJsonLd(options: {
  title: string;
  description: string;
  path: string;
  image?: string;
  author?: string;
  datePublished?: string;
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: options.title,
    description: options.description,
    url: absoluteUrl(options.path),
    image: options.image ? resolveImageUrl(options.image) : absoluteUrl(siteConfig.image),
    author: {
      "@type": "Person",
      name: options.author ?? siteConfig.name,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(siteConfig.image),
      },
    },
    datePublished: options.datePublished,
    dateModified: options.dateModified ?? options.datePublished,
    mainEntityOfPage: absoluteUrl(options.path),
  };
}

export function buildEventJsonLd(options: {
  title: string;
  description: string;
  path: string;
  startDate: string;
  endDate?: string;
  location?: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: options.title,
    description: options.description,
    url: absoluteUrl(options.path),
    startDate: options.startDate,
    endDate: options.endDate,
    image: options.image ? resolveImageUrl(options.image) : absoluteUrl(siteConfig.image),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: options.location ?? siteConfig.name,
    },
    organizer: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };
}

export function buildMusicRecordingJsonLd(options: {
  title: string;
  description: string;
  path: string;
  image?: string;
  artist?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    name: options.title,
    description: options.description,
    url: absoluteUrl(options.path),
    image: options.image ? resolveImageUrl(options.image) : absoluteUrl(siteConfig.image),
    byArtist: {
      "@type": "MusicGroup",
      name: options.artist ?? siteConfig.ministry.author,
    },
    inLanguage: ["en", "te"],
  };
}

/** Platform-wide church scope for sitemap and SEO data fetching. */
export const SEO_CHURCH_SCOPE = "";

export const STATIC_SITEMAP_PATHS = [
  { path: "/", priority: 1, changeFrequency: "daily" as const },
  { path: "/songs", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/sermons", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/articles", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/prayer-requests", priority: 0.8, changeFrequency: "daily" as const },
  { path: "/events", priority: 0.8, changeFrequency: "daily" as const },
  { path: "/donations", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
];
