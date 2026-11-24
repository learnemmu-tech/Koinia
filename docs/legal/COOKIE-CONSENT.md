# Koinia cookie consent

Date: 22 November 2026. This is an implementation note, not a legal opinion.

## Inventory confirmed in code

| Name | Provider | Category | Duration in code | Consent |
| --- | --- | --- | --- | --- |
| koinia_consent | Koinia, current host only | Necessary | 180 days | No |
| Clerk session cookies | Clerk | Necessary | Set by Clerk | No |
| fch_active_church_id | Koinia | Necessary | 1 year | No |
| fc_join_slug | Koinia | Necessary | 45 minutes | No |
| NEXT_LOCALE | Koinia | Preference, set when the visitor picks a language | 1 year | Language choice itself |
| sidebar_state | Koinia | Preferences | Sidebar component | Yes |
| Vercel Analytics | Vercel | Analytics | Set by Vercel | Yes, script not mounted until allowed |
| Umami `us.umami.is` | Umami | Analytics | Set by Umami | Yes, and only if UMAMI_WEBSITE_ID is set |
| YouTube or Vimeo iframe | External host | External media | Set by that host if loaded | Click to load, or external-media consent |

Not found: Google tags, Google Consent Mode, Meta Pixel, Hotjar, Microsoft Clarity, advertising cookies. Those controls are not shown.

## Behaviour

One provider in the root layout serves Signature, Heritage, and Parish. The banner appears when no valid `koinia_consent` cookie exists for this host and version `2026-11-22`. Reject All, Accept All, and Save My Preferences write that cookie and POST a new `cookie_consent_events` row. Retries with the same idempotency key do not insert twice. Query parameters cannot grant consent.

Analytics components render only after `choices.analytics` is true. Rejecting analytics does not clear Clerk or church session cookies. It expires cookies whose names start with `umami` when the browser can see them.

Church footers include Cookie Settings, which reopens the same dialog.

Migration `0033_cookie_consent.sql` is for `ebenezer_test` only.

Counsel still needs to confirm whether India, the EEA, or the UK requires this banner for Koinia's actual traffic. The banner is not a claim of compliance.
