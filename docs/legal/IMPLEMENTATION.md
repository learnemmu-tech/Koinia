# Koinia legal center — implementation record

Date of this implementation review: 22 November 2026.

This document is internal. It is not a legal opinion and it is not a published policy.

## Architecture

- Product name on the legal experience: **Koinia**.
- The brand is not treated as the contracting legal entity. The operating entity is an explicit unverified placeholder.
- Authored document text lives in `src/legal/documents.ts` and `src/legal/documents-more.ts`.
- Every authored document has review status `pending_legal_review`. None is `approved` or `published`.
- Public routes are `/legal` and `/legal/[slug]`. If a database row is `published`, that snapshot is shown, including its effective date. If none is published, the page shows that document’s own authored text and version id, and it does not invent an effective date or an approval. `ebenezer_test` currently has no published rows.
- Member navigation is Legal Center, Terms, Privacy, Community Guidelines, and Cookie Policy. Church administrators also see the church agreement, subscriptions, DPA, and donations. Super-admin publishing stays at `/super-admin/legal`.
- Auth links pass a validated `returnTo` path. External return targets are rejected. The back label is Sign In, Create Account, or Website. The public footer does not show an internal company-verification warning. Company legal name, address, and contact email are still unverified and are omitted from the public page.
- Super admins preview drafts at `/super-admin/legal`. Publishing requires the platform super-admin role, the confirmation text `PUBLISH`, and an approver name. The previous published row is archived. The snapshot is stored in `legal_document_versions` and is not overwritten.
- Historical published or archived snapshots are readable at `/legal/[slug]/versions/[version]`.
- English is the authoritative language. The locale switcher is the existing one. If the UI locale is not English, the page says a reviewed translation is not available. No unreviewed translation is presented as the legal text.
- `/terms` and `/privacy` redirect to `/legal/terms` and `/legal/privacy`.

## Document inventory

| Document | Audience | Kind | Public before publication |
| --- | --- | --- | --- |
| Terms of Service | All users | Policy | Status only |
| Privacy Policy | All users | Policy | Status only |
| Cookie Policy | Public | Disclosure | Status only |
| Subscription and Payment Terms | Church customers | Contract | Status only |
| Donations Terms and Disclosures | Donors | Disclosure | Status only |
| Church Customer Agreement | Church customers | Contract | Status only |
| Data Processing Agreement | Church customers | Contract | Status only |
| Church Administrator Responsibilities | Administrators | Appendix | Status only |
| Subprocessors | Public | Disclosure | Status only |
| Community Guidelines | All users | Policy | Status only |
| Children’s Privacy Notice | Public | Disclosure | Status only |
| Messaging and Communications | All users | Disclosure | Status only |
| Security Overview | Public | Disclosure | Status only |
| Data Retention and Deletion | Public | Disclosure | Status only |
| Privacy Rights and Requests | Account holders | Procedure | Status plus request form |
| Grievance and Complaint Process | Public | Procedure | Status only |

## Data-processing inventory (verified from product code)

Collected and stored in the application database unless noted:

- Account: first name, last name, email, Clerk id, email verification time, profile photo URL, platform role, organization and church links, onboarding flags, email category preferences.
- Authentication credentials: held by Clerk, not in the legal-acceptance table.
- Membership: role and status per church. Removing a member does not delete the Koinia user. The English copy already says the account is not deleted.
- Content: songs, sermons, articles, videos, shorts, books, comments, likes, community and group messages.
- Prayer requests: name, optional email, title, body, category, anonymity flag, community-sharing flag, status. This can reveal religious belief. Anonymity is not a promise that church administrators cannot see the row.
- Events: church-authored event records. Registration is not enabled on every plan.
- Donations: campaign and donation rows, including verification status (`pending`, verified, rejected). Receiving methods implemented for the church are UPI QR, UPI ID, and bank transfer. The donor pays the church. Koinia does not receive or settle those funds. A submission is not a verified donation.
- Subscriptions: plan, status, Razorpay identifiers, payment receipts. Currency in the plan catalog is INR. Trial length in code is 14 days. Receipts are not tax invoices while seller tax registration is unset. No refund window is defined in code.
- Files: uploaded objects in Amazon S3, with private access and signed URLs on that path.
- Cookies: session (Clerk), locale, active church, join intent. Vercel Analytics is loaded in the root layout.
- Email: Resend when configured. Invitation and billing messages exist.
- Optional AI: Shepherd features can call a configured model provider when used.

Access:

- Church administrators access their own church’s workspace according to feature permissions.
- Ordinary queries are organization- and church-scoped.
- Platform super admins use `/super-admin`.
- Privacy requests are stored against the signed-in user id and listed only for that user.

Not verified, and therefore not stated as fact on a public page: legal entity, address, phone, legal email, grievance officer, DPO, retention durations, refund rules, governing law, transfer mechanism, age rule, tax registration, certifications, and whether every DPDP duty is in force.

## Acceptance and consent

- Terms acceptance, privacy acknowledgement, marketing email, and WhatsApp are separate.
- If no Terms version is published, sign-up does not record acceptance and does not block registration.
- If a Terms version is published, the checkbox starts unchecked and registration is blocked until it is checked. The acceptance row stores user id, version id, action, time, locale, and source. The idempotency key prevents a retry from inserting a second row.
- Marketing and WhatsApp checkboxes start unchecked and are not required.
- A published Terms version marked as a material change shows a re-acceptance banner to users who have no acceptance row for that version. They are not marked accepted automatically.

## Privacy workflows

Implemented: authenticated create and list of the user’s own access, correction, deletion, export, complaint, and consent-withdrawal requests, plus an event row. Not implemented: automated fulfillment, representative-authority checks, a full data export file, or deletion that overrides financial retention. Those gaps are stated in the draft.

## Legal-readiness checklist

- Confirm the legal entity, registration, office, phone, and legal email.
- Appoint or decline a grievance officer and DPO, and record the lawful basis.
- Confirm which DPDP Act sections and DPDP Rules are in force on the go-live date. Do not treat the whole Act and the 2025 Rules as operative merely because they were notified.
- Set retention periods for accounts, prayer requests, donation records, receipts, acceptance logs, and backups.
- Write a refund position that does not invent a guarantee.
- Choose governing law and courts.
- Confirm Razorpay, Clerk, AWS, Resend, Vercel, and Upstash regions and transfer mechanism.
- Decide minimum age and any children’s process before inviting minors.
- Counsel reviews controller/processor roles per activity before the DPA is published.
- Do not claim tax deductibility of donations or issue tax invoices until registration exists.
- Have a named person approve and publish each document. Until then, public pages stay “not in effect”.

## Research references

Checked as sources to read, not as conclusions copied into the public pages. Official gazette fetch was not completed in this session; commencement dates must be read from the Gazette before anyone relies on them.

| Source | Jurisdiction | URL | Date noted | Subject |
| --- | --- | --- | --- | --- |
| Digital Personal Data Protection Act, 2023 | India | https://www.meity.gov.in/ | 22 Nov 2026 | Personal data duties. Commencement is staggered. |
| DPDP Rules, 2025 notification | India | https://egazette.gov.in/WriteReadData/2025/267647.pdf | 22 Nov 2026 | Rules text. Operative dates must be confirmed. |
| Commencement notification | India | https://egazette.gov.in/WriteReadData/2025/267650.pdf | 22 Nov 2026 | Different provisions start on different dates. |
| Press Information Bureau | India | https://www.pib.gov.in/ | 22 Nov 2026 | Government explanation of the rules. |
| Consumer Protection Act, 2019 | India | https://consumeraffairs.gov.in/ | 22 Nov 2026 | Non-waivable consumer rights. E-commerce rules may apply to the SaaS checkout, not to direct-to-church donations. |
| Planning Center terms | United States product | https://www.planningcenter.com/terms | 22 Nov 2026 | Structure reference only. Not copied. |
| Subsplash terms | United States product | https://www.subsplash.com/legal/terms-and-conditions | 22 Nov 2026 | Structure reference only. Not copied. |
| Slack DPA | Product reference | https://slack.com/intl/en-in/trust/data-processing-agreement | 22 Nov 2026 | Processor-term structure only. Not copied. |
| Stripe legal | Product reference | https://stripe.com/legal | 22 Nov 2026 | Separation of payment terms only. Not copied. |

GDPR and UK GDPR are not asserted. They become relevant if Koinia offers the service to people in those places or monitors them. That market decision was not verified.

## Operational gaps

- No lawyer has approved these drafts.
- No company identity is verified.
- Privacy requests are recorded, not fulfilled automatically.
- There is no cookie-preference banner beyond essential product cookies.
- Translations are not legally reviewed.
- Publishing is possible for a super admin who types the confirmation. The product cannot tell whether that person is a lawyer. Operations must restrict who receives the super-admin role.
