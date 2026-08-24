import type { Metadata } from "next";

import {
  LegalDocumentPage,
  type LegalSection,
} from "@/components/legal/legal-document-page";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/config/site";
import { buildBreadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy Policy",
  description:
    "Privacy Policy for FaithConnectHub. Learn how we collect, use, and protect your information across worship content, prayer, donations, and community features.",
  path: "/privacy",
  keywords: ["privacy policy", "data protection", "Christian platform privacy", "user data"],
});

const EFFECTIVE_DATE = "June 22, 2026";

const sections: LegalSection[] = [
  {
    title: "Introduction",
    icon: "📋",
    paragraphs: [
      `This Privacy Policy describes how ${siteConfig.name} ("we," "us," or "our") collects, uses, stores, shares, and protects information when you access or use the ${siteConfig.name} website, applications, and related services (collectively, the "Platform").`,
      `${siteConfig.name} is a Christian worship and ministry platform designed to help believers, churches, ministries, and worship teams connect through faith-based content and community engagement.`,
      "By creating an account or using the Platform, you acknowledge that you have read and understood this Privacy Policy. If you do not agree with this policy, please discontinue use of the Platform.",
    ],
  },
  {
    title: "User Accounts",
    icon: "👤",
    paragraphs: [
      "When you register for an account on FaithConnectHub, we collect information necessary to create and maintain your account, including:",
    ],
    list: [
      "Your name and email address",
      "Account credentials and authentication identifiers",
      "Profile preferences and account settings",
      "Account creation date and activity timestamps",
      "Role or permission information if you are designated as a ministry administrator",
    ],
    footer:
      "We use account information to provide personalized access to Platform features, maintain your profile, and secure your account.",
  },
  {
    title: "Authentication",
    icon: "🔐",
    paragraphs: [
      "FaithConnectHub uses secure authentication services to verify your identity and protect your account. Depending on how you sign in, we may process:",
    ],
    list: [
      "Email address and password credentials for email-based authentication",
      "Third-party authentication tokens when you sign in through supported identity providers (such as Google)",
      "Session tokens and authentication cookies to keep you signed in securely",
      "Device and browser information associated with login activity for fraud prevention",
    ],
    footer:
      "We do not store your plain-text password. Authentication data is handled through industry-standard security practices and trusted authentication providers.",
  },
  {
    title: "Profile Information",
    icon: "🪪",
    paragraphs: [
      "Your profile may include information you choose to provide or that is generated through your use of the Platform, such as:",
    ],
    list: [
      "Display name, first name, and last name",
      "Profile photo or avatar",
      "Email address associated with your account",
      "Ministry or church affiliation, where applicable",
      "Dashboard activity summaries and engagement history",
    ],
    footer:
      "You may update certain profile information through your account settings. Some information may be visible to authorized ministry administrators for platform management purposes.",
  },
  {
    title: "Prayer Requests",
    icon: "🙏",
    paragraphs: [
      "When you submit a prayer request through FaithConnectHub, we collect and store the content you provide, which may include:",
    ],
    list: [
      "Prayer request title and description",
      "Submission date and status (pending, approved, or archived)",
      "Your user identifier associated with the request, when submitted while signed in",
      "Contact information you voluntarily include in your submission",
    ],
    footer:
      "Approved prayer requests may be visible to other Platform users to encourage intercession and community support. Please do not include sensitive personal information you do not wish to share with the community. Ministry administrators may review submissions for moderation and pastoral care purposes.",
  },
  {
    title: "Donations",
    icon: "💝",
    paragraphs: [
      "When you participate in donation campaigns on FaithConnectHub, we may collect:",
    ],
    list: [
      "Donor name and email address",
      "Donation amount, currency, and transaction date",
      "Campaign associated with your contribution",
      "Payment confirmation and transaction reference identifiers",
      "Optional messages or notes accompanying your donation",
    ],
    footer:
      "Payment processing may be handled by third-party payment providers. FaithConnectHub does not store full payment card numbers on its servers. Payment providers process transactions according to their own privacy and security policies.",
  },
  {
    title: "Notifications",
    icon: "🔔",
    paragraphs: [
      "We collect and process information related to Platform notifications to keep you informed about ministry activity, including:",
    ],
    list: [
      "Notification type (such as new content, events, or prayer updates)",
      "Notification content and linked resource identifiers",
      "Read and unread status",
      "Delivery timestamps",
    ],
    footer:
      "You may manage notification preferences where available. Some service-related notifications may still be sent for account security or important platform updates.",
  },
  {
    title: "Search Activity",
    icon: "🔍",
    paragraphs: [
      "FaithConnectHub provides global search across songs, sermons, articles, events, and other platform content. When you use search features, we may process:",
    ],
    list: [
      "Search queries and terms entered",
      "Search results interactions and selected content",
      "Session-level usage data to improve search relevance and performance",
      "Aggregated analytics about popular search terms and content discovery patterns",
    ],
    footer:
      "Search activity helps us improve content discoverability and platform performance. We do not sell individual search histories to third parties.",
  },
  {
    title: "Favorites",
    icon: "❤️",
    paragraphs: [
      "When you save content to your favorites, we store:",
    ],
    list: [
      "Your user identifier",
      "The type and identifier of favorited content (songs, sermons, articles, etc.)",
      "The date the item was saved",
    ],
    footer:
      "Favorites are linked to your account and are accessible only to you unless you explicitly share content through other Platform features.",
  },
  {
    title: "Recently Viewed Content",
    icon: "🕐",
    paragraphs: [
      "To enhance your experience, FaithConnectHub may record recently viewed content associated with your account, including:",
    ],
    list: [
      "Content type and identifier (song, sermon, article, or similar)",
      "Timestamp of when the content was viewed",
      "Your user identifier",
    ],
    footer:
      "Recently viewed content appears in your personal dashboard to help you quickly return to meaningful resources. You may clear this history through account features where available.",
  },
  {
    title: "Data Storage",
    icon: "🗄️",
    paragraphs: [
      "FaithConnectHub stores data using secure cloud infrastructure and database services. Your information may be stored in the following categories:",
    ],
    list: [
      "Account and profile records",
      "Content engagement data (favorites, recently viewed, search interactions)",
      "Prayer requests, events, donations, and ministry content metadata",
      "Notification and activity logs",
      "Technical logs for security, debugging, and performance monitoring",
    ],
    footer:
      "Data is retained for as long as necessary to provide Platform services, comply with legal obligations, resolve disputes, and enforce our agreements. When you delete your account, we will delete or anonymize your personal data within a reasonable timeframe, subject to legal and operational retention requirements.",
  },
  {
    title: "Security",
    icon: "🛡️",
    paragraphs: [
      "We implement reasonable administrative, technical, and organizational safeguards designed to protect your information against unauthorized access, alteration, disclosure, or destruction. These measures include:",
    ],
    list: [
      "Encrypted data transmission (HTTPS/TLS) for data in transit",
      "Secure authentication and access controls",
      "Role-based permissions for administrative functions",
      "Firestore security rules and server-side validation",
      "Monitoring for suspicious activity and unauthorized access attempts",
    ],
    footer:
      "While we strive to protect your information, no method of electronic storage or transmission over the Internet is completely secure. We cannot guarantee absolute security, but we continuously work to maintain and improve our safeguards.",
  },
  {
    title: "User Rights",
    icon: "✅",
    paragraphs: [
      "Depending on your location and applicable law, you may have the following rights regarding your personal information:",
    ],
    list: [
      "Access: Request a copy of the personal information we hold about you",
      "Correction: Request correction of inaccurate or incomplete information",
      "Deletion: Request deletion of your account and associated personal data",
      "Restriction: Request limitation of certain processing activities",
      "Objection: Object to processing based on legitimate interests where applicable",
      "Portability: Request transfer of your data in a structured, commonly used format where applicable",
      "Withdraw consent: Withdraw consent for processing where consent is the legal basis",
    ],
    footer: `To exercise any of these rights, contact us at ${siteConfig.author.email}. We will respond to legitimate requests within a reasonable timeframe in accordance with applicable law.`,
  },
  {
    title: "Third-Party Services",
    icon: "🔗",
    paragraphs: [
      "FaithConnectHub relies on trusted third-party services to operate the Platform, including cloud hosting, authentication, analytics, and payment processing providers. These services may process data on our behalf according to their own privacy policies.",
      "We encourage you to review the privacy policies of any third-party services you interact with through the Platform.",
    ],
  },
  {
    title: "Children's Privacy",
    icon: "👶",
    paragraphs: [
      "The Platform is not directed to children under the age of 13 (or the minimum age required in your jurisdiction). We do not knowingly collect personal information from children without appropriate parental consent. If you believe a child has provided us with personal information, please contact us and we will take appropriate steps to remove such data.",
    ],
  },
  {
    title: "Changes to This Policy",
    icon: "📝",
    paragraphs: [
      'We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. When we make material changes, we will update the "Last Updated" date at the top of this page and may provide additional notice through the Platform.',
      "Your continued use of FaithConnectHub after changes become effective constitutes acceptance of the updated Privacy Policy.",
    ],
  },
  {
    title: "Contact Us",
    icon: "📬",
    paragraphs: [
      "If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:",
    ],
    contact: {
      name: siteConfig.name,
      email: siteConfig.author.email,
      location: "Hyderabad, Telangana, India",
    },
  },
];

export default function PrivacyPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Privacy Policy", path: "/privacy" },
        ])}
      />
      <LegalDocumentPage
      title="Privacy Policy"
      description="How FaithConnectHub collects, uses, and protects your personal information across worship content, prayer, donations, and community features."
      headerIcon="🔒"
      effectiveDate={EFFECTIVE_DATE}
      lastUpdated={EFFECTIVE_DATE}
      sections={sections}
      />
    </>
  );
}
