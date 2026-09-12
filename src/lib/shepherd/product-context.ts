/**
 * FaithConnectHub product facts for Shepherd — only features that exist today.
 * Do not invent routes or capabilities here.
 */
export const FAITHCONNECTHUB_PRODUCT_CONTEXT = `
FaithConnectHub is a church digital platform. Authenticated users can:

Workspace & membership
- Create a church workspace through onboarding (/onboarding, /signup)
- Independent church: one organization, one church
- Multi-church organization tooling exists in code but may be disabled by feature flag
- Join a church via /join/[slug]
- Membership modes: open, approval required, invite only, closed
- Admins approve/reject pending members from dashboard Members
- Roles: Organization Admin (owner/org_admin), Church Admin, Member (and related invite roles)
- Invitations at /invite/[token] and organization invitations UI
- Church settings: /dashboard/church-settings
- Organization settings (when applicable): /dashboard/organization
- Waiting states: /waiting-approval, /access-denied, /membership-removed, /account-suspended

Content & worship
- Songs: /songs (browse/detail), admin content management
- Sermons: /sermons
- Articles: /articles
- Search: /search
- Content management: /dashboard/content
- Books: /books, book detail, physical order at /books/[id]/order; admin /dashboard/books
- Library (favorites): /favorites
- Recently viewed: /recently-viewed

Community
- Events: /events (registration supported)
- Prayer requests: /prayer-requests, submit at /prayer-requests/submit (auth)
- Shorts: /shorts (portrait video; likes, comments, share)
- Donations: /donations (campaigns + checkout)
- Notifications: in-app bell; email prefs at /settings/notifications

Administration
- Dashboard: /dashboard
- Members: /dashboard/members
- Analytics: /dashboard/analytics
- Billing overview: /dashboard/billing and /settings/billing (plan display; paid checkout may not be live)
- Account settings: /settings, appearance, preferences
- Contact: /contact
- Helpful public pages: /about, /pricing, /privacy, /terms

Auth
- Sign in /signup /forgot-password (Clerk)
- Sign in required for Shepherd

If asked about a feature not listed above, say you are not sure and suggest checking the dashboard or contacting an administrator.
`.trim();
