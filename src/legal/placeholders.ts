/** Facts that were not verified in the repository. Do not replace these with guesses. */
export const UNVERIFIED = {
  legalEntity:
    "[UNVERIFIED: legal name, registration number, registered office, and governing jurisdiction of the entity that operates Koinia]",
  address: "[UNVERIFIED: postal address]",
  phone: "[UNVERIFIED: telephone number]",
  legalEmail: "[UNVERIFIED: legal and privacy contact email]",
  grievanceOfficer:
    "[UNVERIFIED: grievance officer name and contact details, if a grievance officer is required]",
  dpo: "[UNVERIFIED: whether a data protection officer has been appointed]",
  retention:
    "[UNVERIFIED: retention period. No production retention schedule was found in the application code.]",
  refunds:
    "[UNVERIFIED: refund policy. The application does not publish a refund guarantee or a fixed refund window.]",
  governingLaw:
    "[UNVERIFIED: governing law and courts. Do not assume a forum until counsel confirms the operating entity.]",
  transferMechanism:
    "[UNVERIFIED: international transfer mechanism. Provider regions were not confirmed from production configuration in this review.]",
  children:
    "[UNVERIFIED: minimum age and any parental-consent process. No age-assurance workflow was found in the application.]",
  taxStatus:
    "[UNVERIFIED: tax registration of the operating entity. Billing code states that seller tax registration is not configured and that downloads are payment receipts, not tax invoices.]",
} as const;
