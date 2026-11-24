import { UNVERIFIED } from "./placeholders";
import type { LegalDocumentDraft, LegalSection } from "./types";

function section(id: string, title: string, paragraphs: string[], list?: string[]): LegalSection {
  return {
    id,
    title,
    blocks: [
      ...paragraphs.map((text) => ({ type: "p" as const, text })),
      ...(list ? [{ type: "list" as const, items: list }] : []),
    ],
  };
}

function doc(
  partial: Omit<LegalDocumentDraft, "reviewStatus" | "locale" | "materialChange"> & {
    materialChange?: boolean;
  }
): LegalDocumentDraft {
  return {
    reviewStatus: "pending_legal_review",
    locale: "en",
    materialChange: partial.materialChange ?? false,
    ...partial,
  };
}

export const MORE_LEGAL_DRAFTS: LegalDocumentDraft[] = [
  doc({
    slug: "cookies",
    title: "Cookie Policy",
    summary: "Draft notice of cookies and similar technologies used by Koinia.",
    audience: "public",
    kind: "disclosure",
    draftId: "cookies-draft-2026-11-22",
    sections: [
      section("what", "What is used", [
        "Essential cookies cover the Clerk sign-in session, the selected church workspace (fch_active_church_id, one year), the join hint (fc_join_slug, 45 minutes), and the consent record (koinia_consent, 180 days) on the current host only.",
        "The language cookie NEXT_LOCALE is set when a visitor chooses a language and lasts one year.",
        "The sidebar_state cookie remembers an open sidebar. It is optional.",
        "Vercel Analytics and, when UMAMI_WEBSITE_ID is configured, the Umami script at us.umami.is are optional analytics. They do not load until analytics consent is stored.",
        "A church video can embed YouTube or Vimeo. The player does not load until the viewer allows external media or chooses to load that video.",
        "No advertising cookie, Meta Pixel, Google tag, Hotjar, or Microsoft Clarity integration is present in the application.",
      ]),
      section("choice", "Choices", [
        "The first visit shows a banner with Cookies Settings, Reject All, and Accept All Cookies. Closing the page, scrolling, or continuing to browse is not consent.",
        "Optional categories start off. Reject All keeps only essential cookies. Cookie Settings in the church website footer reopens the same choices. A later change is stored as a new consent event and does not overwrite the earlier one.",
        "The consent cookie is limited to the host that set it. A choice on one church domain is not a choice on a different domain.",
      ]),
    ],
  }),
  doc({
    slug: "subscriptions",
    title: "Subscription and Payment Terms",
    summary: "Draft terms for Koinia software subscriptions. These are not donation terms.",
    audience: "church_customers",
    kind: "contract",
    draftId: "subscriptions-draft-2026-11-22",
    materialChange: true,
    sections: [
      section("separate", "Separate from donations", [
        "These terms cover the fee a church customer pays Koinia for the software. They do not cover money a donor sends to a church by UPI or bank transfer.",
      ]),
      section("plans", "Plans, price, and currency", [
        "The product lists a 14-day trial and paid plans with monthly and yearly prices in INR. The price the customer is shown at checkout is the price that applies to that subscription. Plan features that the product marks as future positioning are not included merely because they appear in a longer feature list.",
      ]),
      section("trial", "Trial", [
        "A newly created church workspace can receive a 14-day trial. When the trial ends, paid features that the plan gates stop unless a paid subscription is active. The trial is not described in the product as a donation or as a refundable deposit.",
      ]),
      section("activation", "Activation, renewal, and failure", [
        "Paid activation uses Razorpay subscriptions. Renewal and failed payment states follow the subscription status Razorpay and the application record. A failed payment can move the subscription to a past-due or incomplete state. The product does not promise a specific dunning sequence beyond the notices it actually sends.",
      ]),
      section("changes", "Plan changes and cancellation", [
        "Upgrades and downgrades follow the billing actions the application exposes. Cancellation can be set to the end of the current period where the subscription record stores that state. Access after cancellation follows that status. There is no additional access period in these terms.",
      ]),
      section("refunds", "Refunds, taxes, and receipts", [
        UNVERIFIED.refunds,
        UNVERIFIED.taxStatus,
        "Billing history in the product shows payment receipts. Those receipts are not tax invoices while tax registration is not configured.",
      ]),
      section("provider", "Payment provider", [
        "Razorpay processes the subscription payment between the church customer and the Koinia subscription. Razorpay’s own terms apply to that payment service. Koinia does not use Razorpay, in the reviewed donation code, to settle direct-to-church donations.",
      ]),
    ],
  }),
  doc({
    slug: "donations",
    title: "Donations Terms and Disclosures",
    summary: "Draft disclosure of the direct-to-church donation model.",
    audience: "donors",
    kind: "disclosure",
    draftId: "donations-draft-2026-11-22",
    materialChange: true,
    sections: [
      section("model", "How donations work", [
        "A church configures its own receiving method. The methods implemented are UPI QR, UPI ID, and bank transfer. The donor pays that destination directly. Koinia does not receive, hold, or settle the donation funds.",
      ]),
      section("church", "Church responsibilities", [
        "The church is responsible for the accuracy of the receiving details it publishes, for checking that a payment was actually received, and for any receipt, acknowledgement, or charitable-compliance duty that applies to it.",
        "A donor acknowledgement stored in the product is a note from the church workflow. It is not a tax invoice issued by Koinia, and the email copy used for donation notes says it is not a tax invoice.",
      ]),
      section("donor", "Donor responsibilities", [
        "The donor is responsible for sending money only to the details shown by the church and for keeping the donor’s own payment proof. Entering a donation in Koinia does not move money.",
      ]),
      section("status", "Submission and verification", [
        "A donation record can be pending verification, verified, or rejected. Pending means the church has not verified it. Rejected means the church did not accept it. Only the verified state should be shown as verified.",
      ]),
      section("disputes", "Refunds, fees, and tax treatment", [
        "Questions about a missing or mistaken donation go to the church that published the receiving details and to the donor’s bank or UPI app. Koinia cannot reverse a payment it did not receive.",
        "Banks and UPI applications may charge their own fees. Koinia does not state those fees.",
        "Koinia does not state that a donation is tax deductible or eligible for any exemption. That depends on the church’s status and the law, which this product does not certify.",
      ]),
      section("records", "Records", [
        "The church and Koinia keep the donation record according to the unverified retention schedule and any accounting duty that applies. Deleting a user account does not automatically erase a verified financial record.",
      ]),
    ],
  }),
  doc({
    slug: "church-agreement",
    title: "Church Customer Agreement",
    summary: "Draft agreement between the operating entity and a church customer.",
    audience: "church_customers",
    kind: "contract",
    draftId: "church-agreement-draft-2026-11-22",
    materialChange: true,
    sections: [
      section("parties", "Parties", [
        `This agreement would be between ${UNVERIFIED.legalEntity} and the church customer that creates a workspace. It is not an agreement between Koinia and each member.`,
      ]),
      section("roles", "Roles", [
        "The church customer is responsible for its congregation, its administrators, the lawfulness of the information it uploads, and its donation receiving details. Koinia is responsible for providing the software and for processing information only as the product and the Data Processing Agreement describe.",
        "Counsel must confirm, activity by activity, where the operating entity acts for itself and where it acts on the church’s instructions. This draft does not label Koinia a processor for every category or a controller for every category.",
      ]),
      section("admins", "Administrators", [
        "The church customer must give administrator access only to people authorized to bind it. Administrator duties are described in the administrator responsibilities document.",
      ]),
      section("end", "End of subscription or organization", [
        "When a subscription ends, the workspace loses the access that the billing state removes. When an organization is deleted, database rules may delete organization-scoped rows. Neither event is an immediate destruction of backups, invoices, or records that must be retained.",
      ]),
    ],
  }),
  doc({
    slug: "dpa",
    title: "Data Processing Agreement",
    summary: "Draft processing terms for information Koinia handles for a church.",
    audience: "church_customers",
    kind: "contract",
    draftId: "dpa-draft-2026-11-22",
    materialChange: true,
    sections: [
      section("instructions", "Instructions", [
        "The church customer instructs Koinia to host and display the information the church and its users submit in the workspace, and to apply the church’s settings for membership, content, prayer, and donations.",
      ]),
      section("confidentiality", "Confidentiality", [
        "People who operate Koinia may access customer information only to provide, secure, or support the service, or where law requires it.",
      ]),
      section("measures", "Measures", [
        "Measures that the product actually implements include account authentication, role checks, tenant-scoped queries, and private object storage with signed access where that path is used. The Security Overview lists those controls without claiming a certification.",
      ]),
      section("subprocessors", "Subprocessors", [
        "The subprocessor disclosure names the providers confirmed in the product. A change that adds a material subprocessor for church personal information should be treated as a material change.",
      ]),
      section("assistance", "Rights requests and incidents", [
        "Koinia will help a church customer respond to a request about information held in that church’s workspace, and will not use the request to reveal another church’s information. Incident cooperation follows the duty counsel identifies. No specific statutory clock is stated in this draft.",
      ]),
      section("return", "Return and deletion", [
        "At the end of the service, the church customer may request export of information the product can export. Deletion follows the retention document. Koinia does not promise that backups disappear on the same day.",
      ]),
      section("audit", "Information rights", [
        "A church customer may ask for a description of the controls that apply to its workspace. This draft does not grant an on-site audit right and does not claim an independent audit report.",
      ]),
      section("transfers", "Transfers and liability", [
        `${UNVERIFIED.transferMechanism} Liability between the parties must be set by counsel and must not waive a duty that applicable law keeps in place.`,
      ]),
    ],
  }),
  doc({
    slug: "administrator-responsibilities",
    title: "Church Administrator Responsibilities",
    summary: "What a church administrator is responsible for inside a Koinia workspace.",
    audience: "administrators",
    kind: "appendix",
    draftId: "admin-responsibilities-draft-2026-11-22",
    sections: [
      section("authority", "Act only with authority", [
        "Use administrator tools only for the church that authorized you. Do not export or reuse another congregation’s information.",
      ]),
      section("members", "Members", [
        "Removing a member removes that person from the church. It does not delete their Koinia account. Tell members that administrators can see workspace information according to each feature.",
      ]),
      section("donations", "Donations", [
        "Publish only receiving details the church is authorized to use. Verify a payment before marking a donation verified. Do not treat a donor submission as proof of payment.",
      ]),
      section("prayer", "Prayer and pastoral information", [
        "Prayer requests may reveal religious belief and private circumstances. Limit access to people who need it for the church’s purpose, and do not publish a request that the user did not share with the community.",
      ]),
    ],
  }),
  doc({
    slug: "subprocessors",
    title: "Subprocessors and Third-Party Services",
    summary: "Providers confirmed in the Koinia product. This is not a claim that each provider has been contracted in a particular country.",
    audience: "public",
    kind: "disclosure",
    draftId: "subprocessors-draft-2026-11-22",
    sections: [
      section("list", "Confirmed providers", [
        "Clerk — authentication.",
        "PostgreSQL — application database. The hosting vendor for a given deployment is an operational fact and is not stated here.",
        "Amazon S3 — file storage for uploaded objects.",
        "Razorpay — subscription payments for Koinia plans, not direct-to-church donation settlement.",
        "Resend — transactional email when an API key is configured.",
        "Vercel Analytics — product analytics loaded in the application shell.",
        "Upstash — rate limiting where that code path is used.",
        "Model providers used by Shepherd AI — only when that feature is invoked and a provider key is configured.",
      ]),
      section("not-included", "Not a donation processor", [
        "UPI applications and banks that a church names are the church’s receiving channel. They are not Koinia subprocessors for holding donation funds, because Koinia does not hold those funds.",
      ]),
    ],
  }),
  doc({
    slug: "community",
    title: "Community Guidelines and Acceptable Use",
    summary: "Rules for posts, comments, messages, and other community features.",
    audience: "all_users",
    kind: "public_policy",
    draftId: "community-draft-2026-11-22",
    sections: [
      section("rules", "Expected conduct", [
        "Be honest about who you are. Do not harass, threaten, or defraud others. Do not post another person’s pastoral or donation information without authority. Do not present unverified donations as verified.",
        "Church administrators may remove content in their workspace. Platform super admins may act on platform content.",
      ]),
    ],
  }),
  doc({
    slug: "children",
    title: "Children’s Privacy Notice",
    summary: "Draft notice. Koinia has not implemented an age check or parental-consent flow.",
    audience: "public",
    kind: "disclosure",
    draftId: "children-draft-2026-11-22",
    sections: [
      section("status", "Current product behavior", [
        UNVERIFIED.children,
        "If a church invites a child into a workspace, the church customer is responsible for having any authority the law requires. Koinia does not claim a children’s-consent procedure it does not operate.",
      ]),
    ],
  }),
  doc({
    slug: "communications",
    title: "Messaging and Communications Policy",
    summary: "How operational email and optional messages are treated.",
    audience: "all_users",
    kind: "disclosure",
    draftId: "communications-draft-2026-11-22",
    sections: [
      section("operational", "Operational messages", [
        "Koinia and church workspaces send email for invitations, account events, and features the user or church has turned on. Email preferences on the user record can turn categories on or off. Those preferences are not the same as accepting the Terms.",
      ]),
      section("optional", "Optional outreach", [
        "Marketing email and WhatsApp consent are optional, start unset, and are not required to register. Withdrawal is recorded on the consent preference. Delivery of WhatsApp is not a claim that a WhatsApp integration is active unless the product sends that message.",
      ]),
    ],
  }),
  doc({
    slug: "security",
    title: "Security Overview",
    summary: "Controls that were confirmed in the product. This is not a certification.",
    audience: "public",
    kind: "disclosure",
    draftId: "security-draft-2026-11-22",
    sections: [
      section("controls", "Controls in the product", [
        "Authentication is delegated to Clerk. Authorization is checked on the server, including a platform super-admin role stored in PostgreSQL rather than trusted from the browser. Church and organization queries are scoped so one church’s ordinary screens do not read another church’s rows.",
        "Uploaded files use private object storage and signed URLs where that storage path is implemented. Sessions are the provider’s cookies. Acceptance records do not contain secrets.",
      ]),
      section("not-claimed", "What is not claimed", [
        "Koinia does not claim end-to-end encryption, zero-knowledge storage, ISO 27001, SOC 2, a completed independent penetration test, or that a breach cannot happen. Encryption at rest is a property of the database and object-storage deployment and is not stated here as a verified certificate.",
      ]),
    ],
  }),
  doc({
    slug: "retention",
    title: "Data Retention and Deletion",
    summary: "What the product does and does not do when information is removed.",
    audience: "public",
    kind: "disclosure",
    draftId: "retention-draft-2026-11-22",
    sections: [
      section("criteria", "Criteria", [
        UNVERIFIED.retention,
        "Until a schedule is approved, the operating rule is: keep information while the account or church workspace needs it for the feature, and keep financial, acceptance, and security records while a legal or accounting reason remains.",
      ]),
      section("events", "Specific events", [
        "An administrator removing a member does not delete the Koinia account. A subscription ending removes paid access according to billing status and does not wipe every member row. Organization deletion follows database foreign keys and can cascade organization-owned content. Offline donation submission creates a record even when no card payment occurs. Backups can remain after a live-row delete.",
      ]),
    ],
  }),
  doc({
    slug: "privacy-rights",
    title: "Privacy Rights and Requests",
    summary: "How to ask for access, correction, deletion, export, or a complaint.",
    audience: "all_users",
    kind: "procedure",
    draftId: "privacy-rights-draft-2026-11-22",
    sections: [
      section("how", "Submitting a request", [
        "A signed-in user can submit a request from this page. The request stores the type, a description, and the user id. It does not search other churches. Status starts as submitted and changes only when an authorized operator updates it.",
        "Someone asking on behalf of another person must be authorized. The product does not yet verify representative authority automatically. That gap is listed for counsel and operations.",
      ]),
      section("limits", "Limits", [
        "Correction of a church’s pastoral record may require the church to act. Deletion may be refused for payment receipts, verified donation records, and acceptance history that must be retained. Export is a request, not a completed download of every system.",
      ]),
    ],
  }),
  doc({
    slug: "grievances",
    title: "Grievance and Complaint Process",
    summary: "How to raise a complaint. Contact details are not yet verified.",
    audience: "public",
    kind: "procedure",
    draftId: "grievances-draft-2026-11-22",
    sections: [
      section("contact", "Contact", [
        `Write to ${UNVERIFIED.legalEmail}. ${UNVERIFIED.grievanceOfficer} Postal address: ${UNVERIFIED.address}. Telephone: ${UNVERIFIED.phone}.`,
        "A signed-in user may also file a complaint as a privacy request of type complaint. There is no published response deadline until counsel sets one that matches the law in force.",
      ]),
    ],
  }),
];
