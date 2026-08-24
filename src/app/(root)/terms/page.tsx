import type { Metadata } from "next";

import {
  LegalDocumentPage,
  type LegalSection,
} from "@/components/legal/legal-document-page";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/config/site";
import { buildBreadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Terms of Service",
  description:
    "Terms of Service for FaithConnectHub. Read the terms governing your use of our Christian worship and ministry platform.",
  path: "/terms",
  keywords: ["terms of service", "user agreement", "platform terms", "acceptable use"],
});

const EFFECTIVE_DATE = "June 22, 2026";

const sections: LegalSection[] = [
  {
    title: "Introduction",
    icon: "📜",
    paragraphs: [
      `These Terms of Service ("Terms") govern your access to and use of ${siteConfig.name} ("we," "us," or "our"), including our website, applications, and related services (collectively, the "Platform").`,
      `${siteConfig.name} is a Christian worship and ministry platform that provides access to worship content, sermons, articles, prayer requests, events, donations, and community features.`,
      "By accessing or using the Platform, you agree to be bound by these Terms. If you do not agree, you may not use the Platform.",
    ],
  },
  {
    title: "Acceptable Use",
    icon: "✓",
    paragraphs: [
      "You agree to use FaithConnectHub only for lawful purposes and in a manner consistent with Christian values and community standards. You must not:",
    ],
    list: [
      "Use the Platform to harass, abuse, threaten, or harm others",
      "Post content that is hateful, obscene, defamatory, or contrary to biblical Christian principles",
      "Upload or distribute malware, spam, or unauthorized promotional material",
      "Attempt to gain unauthorized access to accounts, systems, or data",
      "Scrape, crawl, or automate access to the Platform without permission",
      "Impersonate another person, ministry, or organization",
      "Interfere with or disrupt the integrity or performance of the Platform",
      "Use the Platform for any illegal activity under applicable law",
    ],
    footer:
      "We reserve the right to investigate violations and take appropriate action, including content removal and account suspension.",
  },
  {
    title: "User Responsibilities",
    icon: "👤",
    paragraphs: [
      "As a user of FaithConnectHub, you are responsible for:",
    ],
    list: [
      "Maintaining the confidentiality of your account credentials",
      "All activity that occurs under your account",
      "Providing accurate and truthful information in your profile and submissions",
      "Ensuring that content you submit respects the rights and dignity of others",
      "Complying with these Terms and all applicable laws and regulations",
      "Reporting suspicious activity, abuse, or security concerns to us promptly",
    ],
    footer:
      "You must notify us immediately if you suspect unauthorized access to your account.",
  },
  {
    title: "Content Ownership",
    icon: "©",
    paragraphs: [
      "FaithConnectHub respects intellectual property rights and expects users to do the same.",
    ],
    list: [
      "Platform Content: Songs, sermons, articles, events, and other materials published by FaithConnectHub or authorized ministries remain the property of their respective owners. You may not copy, reproduce, distribute, or create derivative works without proper authorization.",
      "User Submissions: By submitting prayer requests, comments, or other content, you grant FaithConnectHub a non-exclusive, royalty-free license to display, store, and distribute that content on the Platform for ministry and community purposes.",
      "Your Responsibility: You represent that you have the right to submit any content you provide and that your submissions do not infringe third-party rights.",
      "Takedown: We may remove content that violates these Terms, infringes intellectual property, or is otherwise inappropriate at our discretion.",
    ],
  },
  {
    title: "Prayer Requests",
    icon: "🙏",
    paragraphs: [
      "FaithConnectHub provides prayer request features to encourage intercession and community support. By submitting a prayer request, you acknowledge that:",
    ],
    list: [
      "Approved requests may be visible to other Platform users",
      "You should not include information you are not comfortable sharing publicly",
      "Prayer requests are shared for spiritual encouragement and are not confidential pastoral counseling",
      "Ministry administrators may review, approve, decline, or remove requests at their discretion",
      "FaithConnectHub does not guarantee that every request will receive a response or specific outcome",
    ],
    footer:
      "Submit prayer requests with sincerity and respect for the privacy and dignity of others.",
  },
  {
    title: "Donations",
    icon: "💝",
    paragraphs: [
      "FaithConnectHub may facilitate donation campaigns on behalf of ministries and Christian organizations. By making a donation, you agree that:",
    ],
    list: [
      "Donations are voluntary and generally non-refundable unless required by law or stated campaign terms",
      "Payment processing is handled by third-party providers subject to their terms",
      "FaithConnectHub is not responsible for how recipient ministries use funds beyond stated campaign purposes",
      "Tax deductibility of donations depends on the status of the receiving organization and applicable law; consult a tax professional",
      "You will provide accurate donor information for receipt and record-keeping purposes",
    ],
    footer:
      "We strive to operate donation features with transparency and integrity, but we do not guarantee the financial or tax outcomes of any contribution.",
  },
  {
    title: "User Accounts",
    icon: "🔑",
    paragraphs: [
      "To access certain features, you must create an account. Regarding accounts:",
    ],
    list: [
      "You must provide accurate registration information and keep it up to date",
      "You must be at least 13 years of age (or the minimum age in your jurisdiction) to create an account",
      "One person may not maintain multiple accounts for abusive purposes",
      "We may suspend or terminate accounts that violate these Terms",
      "You may delete your account through available account settings or by contacting us",
    ],
    footer:
      "Account termination may result in loss of access to favorites, recently viewed content, prayer history, and other associated data.",
  },
  {
    title: "Platform Availability",
    icon: "⚡",
    paragraphs: [
      "We strive to keep FaithConnectHub available and reliable, but we do not guarantee uninterrupted or error-free operation. The Platform may be temporarily unavailable due to:",
    ],
    list: [
      "Scheduled maintenance and updates",
      "Technical issues or infrastructure failures",
      "Security incidents requiring immediate action",
      "Events beyond our reasonable control (force majeure)",
    ],
    footer:
      "We may modify, suspend, or discontinue any part of the Platform at any time with or without notice. We are not liable for any modification, suspension, or discontinuation of services.",
  },
  {
    title: "Limitation of Liability",
    icon: "⚖️",
    paragraphs: [
      `To the fullest extent permitted by applicable law, ${siteConfig.name} and its operators, affiliates, and service providers shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.`,
      "The Platform is provided on an \"as is\" and \"as available\" basis without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.",
      "Our total liability for any claim arising from these Terms or your use of the Platform shall not exceed the amount you paid to us, if any, in the twelve (12) months preceding the claim.",
    ],
    footer:
      "Some jurisdictions do not allow certain limitations of liability; in such cases, our liability is limited to the maximum extent permitted by law.",
  },
  {
    title: "Account Suspension",
    icon: "🚫",
    paragraphs: [
      "We may suspend or terminate your access to FaithConnectHub, with or without notice, if we reasonably believe that you have:",
    ],
    list: [
      "Violated these Terms or our Privacy Policy",
      "Engaged in fraudulent, abusive, or harmful conduct",
      "Infringed intellectual property or other legal rights",
      "Posed a security risk to the Platform or other users",
      "Used the Platform in a manner inconsistent with its Christian ministry purpose",
    ],
    footer:
      "You may appeal a suspension by contacting us at the email address below. We will review appeals in good faith but are not obligated to reinstate accounts.",
  },
  {
    title: "Policy Updates",
    icon: "📝",
    paragraphs: [
      'We may revise these Terms from time to time. When we make material changes, we will update the "Last Updated" date at the top of this page and may provide notice through the Platform or by email.',
      "Your continued use of FaithConnectHub after updated Terms take effect constitutes your acceptance of the revised Terms. If you do not agree to the updated Terms, you must stop using the Platform.",
    ],
  },
  {
    title: "Governing Law",
    icon: "🏛️",
    paragraphs: [
      "These Terms shall be governed by and construed in accordance with the laws of India, without regard to conflict of law principles. Any disputes arising from these Terms or your use of the Platform shall be subject to the exclusive jurisdiction of the courts located in Hyderabad, Telangana, India, unless otherwise required by applicable law.",
    ],
  },
  {
    title: "Contact Us",
    icon: "📬",
    paragraphs: [
      "If you have questions about these Terms of Service, please contact us:",
    ],
    contact: {
      name: siteConfig.name,
      email: siteConfig.author.email,
      location: "Hyderabad, Telangana, India",
    },
  },
];

export default function TermsPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Terms of Service", path: "/terms" },
        ])}
      />
      <LegalDocumentPage
      title="Terms of Service"
      description="The terms and conditions governing your use of FaithConnectHub, our Christian worship and ministry platform."
      headerIcon="📜"
      effectiveDate={EFFECTIVE_DATE}
      lastUpdated={EFFECTIVE_DATE}
      sections={sections}
      />
    </>
  );
}
