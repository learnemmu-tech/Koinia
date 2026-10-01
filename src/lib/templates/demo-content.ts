import { DEFAULT_TEMPLATE_ID } from "@/lib/templates/registry";
import type {
  ChurchWebsiteViewModel,
  TemplateId,
} from "@/lib/templates/types";
import { parseWebsiteVisibility } from "@/lib/templates/visibility";

const DEMO_SLUG = "heritage-demonstration";

export function getDemoChurchWebsite(
  templateId: TemplateId = DEFAULT_TEMPLATE_ID
): ChurchWebsiteViewModel {
  return {
    isDemo: true,
    templateId,
    viewer: { isAuthenticated: false, isMember: false },
    church: {
      id: "demo-church",
      organizationId: "demo-organization",
      name: "Heritage Demonstration Parish",
      slug: DEMO_SLUG,
      description:
        "A welcoming congregation gathered around Word, table, and neighborhood — this is sample content used only for template previews.",
      welcomeMessage: "Come as you are. Stay as family.",
      pastorName: "Rev. Sample Pastor",
      establishedYear: 1894,
      denomination: "Demonstration",
      address: "100 Heritage Way",
      city: "Riverside",
      state: "Demonstration",
      country: "United States",
      phone: "(555) 010-1894",
      email: "hello@example.invalid",
      logoUrl: "/templates/heritage/mark.svg",
    },
    website: {
      churchId: "demo-church",
      organizationId: "demo-organization",
      activeTemplate: templateId,
      siteTitle: "Heritage Demonstration Parish",
      metaDescription:
        "Preview of the Heritage church website template with sample content. This data is not stored on a real church.",
      indexable: false,
      logoUrl: "/templates/heritage/mark.svg",
      images: {
        logo: "/templates/heritage/mark.svg",
        hero: "/templates/heritage/hero-fallback.jpg",
        about: "/templates/heritage/about-fallback.jpg",
        featuredMinistry: "/templates/heritage/ministry-fallback.jpg",
        worship: "/templates/heritage/worship-fallback.jpg",
        socialPreview: "/templates/heritage/hero-fallback.jpg",
        favicon: "/templates/heritage/mark.svg",
      },
      heroEyebrow: "Welcome to Heritage Demonstration Parish",
      heroHeadline: "Find hope, community,\nand purpose.",
      heroSubheadline:
        "Welcome to a community rooted in faith, filled with grace, and open to everyone.",
      scriptureReference: "Psalm 84:1",
      scriptureText: "How lovely is your dwelling place, O Lord of hosts!",
      serviceLabel: "Sunday Worship",
      serviceTime: "10:00 AM",
      serviceLocation: "Main Sanctuary",
      socialLinks: {
        instagram: "https://www.instagram.com/instagram",
        youtube: "https://www.youtube.com",
      },
      visibility: parseWebsiteVisibility({}),
      aboutValues: [],
      aboutBeliefs: [],
    },
    sermons: [
      {
        id: "demo-sermon-1",
        churchId: "demo-church",
        title: "The Kindness of God",
        scriptureReference: "Titus 3:4–7",
        speaker: "Rev. Sample Pastor",
        shortDescription:
          "A message on the mercy that finds us and the hope that holds us.",
        content: "",
        tags: ["Gospel"],
        coverImage: "/templates/heritage/sermon-fallback.jpg",
        dateCreated: Date.UTC(2026, 8, 14),
        createdBy: "",
        isPublished: true,
      },
    ],
    events: [
      {
        id: "demo-event-1",
        churchId: "demo-church",
        title: "Evening Prayer",
        description: "A quiet hour of Scripture, silence, and song.",
        bannerImage: "/templates/heritage/event-fallback.svg",
        eventType: "Prayer Meeting",
        speakerName: "",
        eventDate: "2026-10-02",
        eventTime: "7:00 PM",
        location: "Chapel",
        status: "published",
        createdAt: Date.UTC(2026, 8, 1),
        updatedAt: Date.UTC(2026, 8, 1),
      },
    ],
    articles: [
      {
        id: "demo-article-1",
        churchId: "demo-church",
        title: "Learning to Pray Slowly",
        category: "Prayer",
        shortDescription:
          "A short reflection on unhurried prayer in a hurried age.",
        content: "",
        author: "Pastoral Team",
        tags: ["Prayer"],
        featured: true,
        dateCreated: Date.UTC(2026, 8, 8),
        createdBy: "",
        isPublished: true,
      },
    ],
    videos: [],
    campaigns: [
      {
        id: "demo-campaign-1",
        churchId: "demo-church",
        title: "Neighborhood Care Fund",
        description:
          "Support meals, visitation, and practical help for families nearby.",
        targetAmount: 10000,
        currentAmount: 4200,
        currency: "USD",
        status: "active",
        createdAt: Date.UTC(2026, 7, 1),
        updatedAt: Date.UTC(2026, 8, 1),
      },
    ],
    ministries: [
      {
        id: "demo-ministry-1",
        name: "Children & Families",
        description: "A gentle home for the youngest among us.",
        imageUrl: "/templates/heritage/ministry-fallback.svg",
      },
      {
        id: "demo-ministry-2",
        name: "Neighborhood Care",
        description: "Meals, visits, and practical love on our street.",
        imageUrl: "/templates/heritage/worship-fallback.svg",
      },
    ],
  };
}
