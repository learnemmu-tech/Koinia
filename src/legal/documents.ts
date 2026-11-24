import { MORE_LEGAL_DRAFTS } from "./documents-more";
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

const identity = section("identity", "Who operates Koinia", [
  "Koinia is the name of the software platform. The brand name is not, by itself, the contracting legal entity.",
  `The legal entity that operates the platform is ${UNVERIFIED.legalEntity}.`,
  "A church that subscribes to Koinia is a customer. Church administrators act for that church. Members and donors are individuals who use a church workspace or a public church page. Those roles are not the same as the entity that operates Koinia.",
]);

export const LEGAL_DRAFTS: LegalDocumentDraft[] = [
  {
    slug: "terms",
    title: "Terms of Service",
    summary:
      "Draft terms for use of the Koinia platform. This draft is not approved and is not in effect.",
    audience: "all_users",
    kind: "public_policy",
    draftId: "terms-draft-2026-11-22",
    reviewStatus: "pending_legal_review",
    locale: "en",
    materialChange: true,
    sections: [
      section("introduction", "Introduction and agreement", [
        "These Terms of Service describe the conditions on which the Koinia platform is offered. They apply to the websites, church sites, and signed-in workspaces that Koinia operates.",
        "This copy is a draft for legal review. It is not an effective agreement until an authorized person approves a version and that version is published.",
      ]),
      section("definitions", "Definitions", [
        "“Platform” means the Koinia software, including church websites, member accounts, content tools, events, prayer requests, community features, donation record-keeping, and subscription billing.",
        "“Church customer” means the organization that registers a church workspace. “Administrator” means a person the church customer authorizes to manage that workspace. “Member” means a person with a membership in a church workspace. “Donor” means a person who submits a donation record to a church.",
      ]),
      identity,
      section("eligibility", "Eligibility and minimum age", [
        `${UNVERIFIED.children} Until counsel sets an age rule, Koinia does not represent that it has verified a user’s age or collected parental consent.`,
        "Church customers are responsible for deciding who they invite into their congregation’s workspace.",
      ]),
      section("acceptance", "Acceptance of Terms", [
        "When a published version of these Terms requires acceptance, account registration asks for an explicit, unchecked acceptance of that exact version. Optional communication preferences are separate and are not required to create an account.",
        "Using the platform before a version is published does not create a record that the user accepted this draft.",
      ]),
      section("organizations", "Organizational accounts", [
        "A church workspace belongs to an organization record. The organization owner and administrators control church settings, membership, and content for that organization. Koinia does not become the church.",
      ]),
      section("verification", "Church registration and verification", [
        "Creating a church workspace collects the details the onboarding flow asks for. Unless a specific screen states that a church has been independently verified, registration is not a representation that Koinia has verified the church’s legal status, charitable status, or authority to receive donations.",
      ]),
      section("admins", "Authority of church administrators", [
        "Administrators can manage members, content, events, prayer requests, donation settings, and other features their plan allows. Members should assume administrators of their church can access information submitted inside that church workspace, according to the permissions implemented for each feature.",
        "Removing a member from a church ends that membership. It does not, by itself, delete the person’s Koinia account.",
      ]),
      section("members", "Member accounts and invitations", [
        "People may be invited by email or may ask to join a church. Membership can remain pending until the church accepts it. An invitation does not make Koinia the employer or minister of the invitee.",
      ]),
      section("security", "Authentication and account security", [
        "Sign-in is provided through Clerk. You are responsible for the credentials you use and for activity under your account. Koinia does not ask you to store a raw password in its own application database as part of legal acceptance.",
      ]),
      section("websites", "Church websites and public pages", [
        "Churches can publish public pages using the Signature, Heritage, or Parish presentation. The church is responsible for the accuracy of the content it publishes. Koinia’s platform-wide legal documents are Koinia’s documents, not a church’s own branded terms.",
      ]),
      section("media", "Sermons, worship songs, and media", [
        "Churches and users may upload sermons, songs, videos, shorts, books, and related media. Those materials are stored for the features the church uses, including object storage where a file is uploaded. You may only upload material you have the rights to use.",
      ]),
      section("articles", "Articles and Christian resources", [
        "Articles and other written resources can be published to a church audience or, where the product allows, as platform content by a platform super admin. Publication does not mean Koinia endorses every theological statement in the material.",
      ]),
      section("events", "Events and registrations", [
        "Churches may create events. Event registration is not enabled on every plan. Where registration is offered, the church is responsible for the event itself.",
      ]),
      section("prayer", "Prayer requests", [
        "Prayer requests can include a name, email, title, request text, category, anonymity choice, and whether the request is shared with the community. This information can reveal religious belief. It is visible according to the request’s settings and the church’s permissions. An anonymous flag is not a promise that administrators cannot see the submission.",
        "Koinia does not provide pastoral counselling, medical advice, or emergency response. A prayer request is not a request for those services.",
      ]),
      section("community", "Community posts, comments, and interactions", [
        "The product includes community messages, group messages, comments, and likes where those features are enabled. The same acceptable-use rules apply to that content.",
      ]),
      section("ugc", "User-generated content", [
        "You retain whatever rights you already have in content you submit. You give the church customer and Koinia the permission needed to host, display, and moderate that content for the feature you used. This permission ends when the content is removed, except for copies kept where retention is required.",
      ]),
      section("copyright", "Copyright and intellectual property", [
        "You must not upload content that infringes someone else’s rights. A notice of alleged infringement can be sent to the legal contact once that contact is verified. Koinia may remove content that appears to infringe rights or these Terms.",
      ]),
      section("ownership", "Content ownership and platform licences", [
        "Koinia and its licensors own the platform software and Koinia branding. Church branding on a church site belongs to the church. Neither party receives the other’s trademarks except for the limited right to display them while providing or using the service.",
      ]),
      section("moderation", "Content moderation and reporting", [
        "Church administrators moderate their workspace. Platform super admins can moderate platform-scoped content. Koinia may remove content or suspend access that violates these Terms or applicable law. There is no promise of a particular response time.",
      ]),
      section("aup", "Acceptable and prohibited use", [
        "Do not use Koinia to break the law, to harass or threaten people, to impersonate a church or person, to upload malware, to attempt unauthorized access, or to misrepresent a donation as verified when it is not.",
      ]),
      section("privacy", "Privacy and data processing", [
        "The Privacy Policy, when published, describes personal information processing. Where Koinia processes congregation information for a church’s purposes, the Church Customer Agreement and Data Processing Agreement describe that relationship. Those roles still require confirmation by counsel.",
      ]),
      section("donations", "Donations", [
        "In the current direct-to-church model, a church configures its own UPI QR, UPI ID, or bank-transfer details. The donor pays the church directly. Koinia does not receive, hold, or settle those donation funds.",
        "A submitted donation record can be pending verification, verified, or rejected. Submission is not proof that money was received. Only a verified record is a verified donation in the product.",
        "Koinia subscription fees are separate from church donations.",
      ]),
      section("billing", "Subscription plans and billing", [
        "Paid church plans are billed in INR through Razorpay as a subscription for the software. Displayed plan prices are the prices configured in the product. A new church workspace can have a 14-day trial. The trial is not a donation product.",
      ]),
      section("trials", "Trials, renewals, and cancellations", [
        "The trial length implemented in the product is 14 days from the workspace trial start. When a paid subscription is cancelled, access follows the subscription state the billing system records, including cancellation at period end where that state is set. Do not assume access continues for a grace period that the product does not implement.",
      ]),
      section("refunds", "Refunds and consumer rights", [
        UNVERIFIED.refunds,
        "Nothing in these Terms is intended to remove rights that applicable law does not allow to be waived, including rights under the Consumer Protection Act, 2019, where that Act applies to a particular user.",
      ]),
      section("availability", "Platform availability and maintenance", [
        "Koinia may change, suspend, or maintain features. Plans describe feature availability, and some features listed as future positioning are not enabled. The service is not warranted to be uninterrupted.",
      ]),
      section("third-parties", "Third-party services", [
        "The platform uses service providers for authentication, hosting, storage, email, analytics, and subscription payments. The subprocessor disclosure lists the providers confirmed in the product. Churches choose their own banks or UPI apps for donations. Koinia is not the donor’s bank.",
      ]),
      section("suspension", "Account suspension and termination", [
        "Koinia may suspend a user or an organization that violates these Terms, creates risk, or fails to pay subscription fees. Church customers may remove members. Suspension of a church subscription does not state that every member record is deleted immediately.",
      ]),
      section("deletion", "Data export and deletion consequences", [
        "Account closure and privacy requests are handled through the privacy-request workflow when that workflow is available. Deletion does not extend to records Koinia or the church must keep, such as subscription payment records or verified donation records, for as long as a lawful reason remains.",
        "Deleting an organization can remove organization-scoped records that the database deletes with that organization. That is not a promise that backups are erased at the same moment.",
      ]),
      section("disclaimers", "Disclaimers", [
        "Koinia provides software for churches. It does not provide pastoral care, medical advice, emergency services, or a guaranteed spiritual outcome. Content on the platform is the responsibility of the person or church that published it.",
        "Security controls reduce risk. They are not a guarantee that a breach cannot occur.",
      ]),
      section("liability", "Limitation of liability", [
        "Any limit on liability must be set by counsel for the operating entity and must preserve liability that applicable law does not allow to be limited. This draft does not set a monetary cap and does not exclude liability for fraud or for any non-waivable statutory duty.",
      ]),
      section("indemnity", "Indemnification", [
        "A church customer is responsible for its congregation’s use of the workspace and for the payment details it publishes. A specific indemnity, if any, must be written by counsel. This draft does not add a blanket indemnity.",
      ]),
      section("changes", "Changes to the service and Terms", [
        "A published version is immutable. A change creates a new version. If the change is marked material, existing users are asked to accept the new version. They are not marked as having accepted it automatically. Typographical corrections need not require re-acceptance.",
      ]),
      section("law", "Governing law and jurisdiction", [
        UNVERIFIED.governingLaw,
        "India is the primary intended market. That fact does not name a court.",
      ]),
      section("contact", "Contact and complaints", [
        `Legal contact: ${UNVERIFIED.legalEmail}. Address: ${UNVERIFIED.address}. Telephone: ${UNVERIFIED.phone}.`,
        `Grievance contact: ${UNVERIFIED.grievanceOfficer}. Complaints can also be submitted through the grievance process once a contact exists.`,
      ]),
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    summary:
      "Draft description of personal information Koinia and church customers process. Not approved and not in effect.",
    audience: "all_users",
    kind: "public_policy",
    draftId: "privacy-draft-2026-11-22",
    reviewStatus: "pending_legal_review",
    locale: "en",
    materialChange: true,
    sections: [
      section("controller", "Who is responsible", [
        `The operating entity is ${UNVERIFIED.legalEntity}. Counsel must confirm when that entity is a data fiduciary or controller for its own purposes, and when it processes information on a church’s instructions.`,
        "Church customers decide why they collect congregation information in their workspace. Koinia decides why it collects account, security, and subscription information for operating the platform.",
      ]),
      section("scope", "Scope", [
        "This policy describes processing in the Koinia product reviewed in this codebase: accounts, church membership, content, prayer, community, events, direct-to-church donation records, and Razorpay subscriptions. It does not describe a church’s offline ministry unless the information is entered into Koinia.",
      ]),
      section("categories", "Categories of personal information", [
        "Identifiers and contact details, account credentials held by the authentication provider, membership and role, profile name and photo, content you submit, prayer requests, event information, donation records, subscription billing records, and technical logs needed to operate and protect the service.",
      ]),
      section("direct", "Information collected from users", [
        "Sign-up collects first name, last name, and email address, and the authentication provider collects the credential. Profile and onboarding screens collect the church and personal fields those forms show. Donation submission collects the fields on the donation form, which the donor enters for the church.",
      ]),
      section("churches", "Information received from churches", [
        "Churches supply member invitations, roles, content, donation receiving details, and pastoral or community material they choose to store. Koinia receives that information because the church entered it.",
      ]),
      section("auth", "Authentication information", [
        "Clerk provides authentication. Koinia stores a Clerk user id, email, name, and email-verification time on the application user record. Acceptance records do not store passwords or session tokens.",
      ]),
      section("profiles", "Member profiles", [
        "A profile can include name and photo. Email notification preferences are stored on the user record. Users can change preferences where the settings screens allow it.",
      ]),
      section("membership", "Church membership", [
        "Membership records link a user to a church and organization with a role and status. Administrators of that church can view and manage membership. Other churches do not receive that membership through the product’s tenant queries.",
      ]),
      section("prayer", "Prayer requests and religious information", [
        "Prayer requests can reveal religious belief and other sensitive life circumstances. Treat them as information that needs particular care. Who can read a request depends on anonymity, community-sharing, and church staff permissions. Do not assume a prayer request is hidden from the church’s administrators.",
      ]),
      section("ugc", "Posts, comments, and user-generated content", [
        "Community posts, group messages, comments, and likes are stored for the church or platform area where they were made. People who can open that area can see them, subject to the feature’s rules.",
      ]),
      section("events", "Events and registrations", [
        "Event records may include the information the church enters and, where registration exists, the information a registrant submits. Event registration is plan-dependent.",
      ]),
      section("donations", "Donation records", [
        "Donation records can include donor identity, amount, currency, method, verification status, and an acknowledgement note. The church’s administrators process those records. Koinia hosts the records and does not receive the donation funds in the direct-to-church model.",
        "A pending or rejected record must not be described as a verified donation.",
      ]),
      section("billing", "Subscription and billing", [
        "Subscription records include plan, status, Razorpay identifiers, and payment receipt data. Razorpay processes the subscription payment. Receipts are not tax invoices while seller tax registration is not configured.",
      ]),
      section("technical", "Technical information", [
        "Servers and the host may process IP address and user agent as part of ordinary HTTP logging. Legal acceptance stores locale and a source label such as sign-up. It does not store a device fingerprint.",
      ]),
      section("cookies", "Cookies and similar technologies", [
        "The product uses cookies for sign-in session, locale, active church, and join intent. Vercel Analytics is loaded in the root layout. Details are in the Cookie Policy draft.",
      ]),
      section("purposes", "Purposes", [
        "Purposes are providing the church workspace, authenticating users, hosting content, recording donations for the church, billing the church for the software, securing the service, and sending operational email the user or church has requested.",
      ]),
      section("bases", "Lawful bases and permitted grounds", [
        "Counsel must map each purpose to the Digital Personal Data Protection Act, 2023, and to any other law that applies. This draft does not assert that every purpose is already on a permitted ground, and it does not assert that every rule of the Act and the 2025 Rules is in force.",
      ]),
      section("consent", "Consent and withdrawal", [
        "Where a purpose relies on consent, the control for that purpose must be separate from acceptance of the Terms. Marketing and WhatsApp preferences are optional and must not be preselected. Withdrawal stops future optional processing. It does not erase records that must be kept.",
      ]),
      section("church-access", "Who at the church can see information", [
        "Church administrators and other roles with the relevant permission can access member and content information in their own church. They cannot use the product to read another church’s records. Koinia platform super admins can access platform administration tools.",
      ]),
      section("koinia-purposes", "Koinia’s own purposes", [
        "Koinia processes account, security, and subscription data to provide and protect the software and to collect its own fees.",
      ]),
      section("processor", "Processing for churches", [
        "Hosting a church’s member lists, prayer requests, and donation records is processing for the church’s purposes. The DPA draft describes that role, subject to counsel confirming the role for each activity.",
      ]),
      section("providers", "Service providers", [
        "Confirmed in the product: Clerk for authentication, PostgreSQL for application data, Amazon S3 for stored files, Razorpay for SaaS subscription payments, Resend when email is configured, and Vercel Analytics. Upstash is a dependency used for rate limiting where that code path runs. Shepherd AI features can call a configured model provider. Donation payments go to the church’s own UPI or bank destination, not to these providers as a donation settlement.",
      ]),
      section("transfers", "International transfers", [
        UNVERIFIED.transferMechanism,
      ]),
      section("security", "Safeguards", [
        "The product uses authenticated sessions, server-side authorization, organization and church scoping on tenant data, and signed access for private stored objects where that storage path is used. Transport encryption depends on HTTPS in deployment. These controls are not a certification and not a promise that loss is impossible.",
      ]),
      section("retention", "Retention", [
        UNVERIFIED.retention,
        "Subscription receipts, donation verification records, acceptance records, and security logs can outlive an account where a legal, accounting, or security reason remains. Backups are not the same as the live database.",
      ]),
      section("account-deletion", "Account deletion", [
        "Closing a Koinia account is different from a church administrator removing a member. Ending a subscription does not mean every member’s personal information is deleted the same day. A privacy-request record is the supported request path, and fulfillment still depends on the data category.",
      ]),
      section("rights", "Access, correction, and deletion requests", [
        "An authenticated user can submit an access, correction, deletion, export, or complaint request. The request is stored for the user who submitted it. Fulfillment is manual until an operator completes it. The product does not promise an automated full export of every church-held pastoral record.",
      ]),
      section("portability", "Portability", [
        "Where the law requires portability, the privacy-request type “export” records the request. An automated machine-readable export of all personal information is not fully implemented.",
      ]),
      section("withdrawal", "Withdrawal of consent", [
        "Optional consent can be withdrawn from the consent preference record. Withdrawal does not cancel a church subscription or delete financial records.",
      ]),
      section("children", "Children", [
        UNVERIFIED.children,
      ]),
      section("breaches", "Incidents", [
        "Koinia will assess a personal-data incident and notify the church customer and individuals when the law that counsel identifies requires it. The product does not contain a public claim of a specific notification deadline.",
      ]),
      section("third-sites", "Third-party websites", [
        "Church pages may link to YouTube, banks, UPI apps, or other sites. Those sites have their own notices. A donation app is the donor’s and the church’s payment channel.",
      ]),
      section("changes", "Changes", [
        "A change to this policy is a new version. The previous published version remains readable. Users are not silently treated as having accepted a material change.",
      ]),
      section("contact", "Privacy contact", [
        `Privacy contact: ${UNVERIFIED.legalEmail}. ${UNVERIFIED.dpo} ${UNVERIFIED.grievanceOfficer}`,
      ]),
    ],
  },
  ...MORE_LEGAL_DRAFTS,
];

export function getLegalDraft(slug: string): LegalDocumentDraft | null {
  return LEGAL_DRAFTS.find((document) => document.slug === slug) ?? null;
}
