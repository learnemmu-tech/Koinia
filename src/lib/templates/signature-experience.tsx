import { AuthenticatedAppShell } from "@/components/public-site/authenticated-app-shell";
import { ChurchUrlScopeProvider } from "@/lib/templates/church-url-scope";

import { SyncActiveChurch } from "@/lib/templates/sync-active-church";

export { usesSignatureAppExperience } from "@/lib/templates/church-renderer";

/** Existing Signature application chrome. Does not restyle it. */
export function SignatureExperienceShell({
  churchId,
  organizationId,
  churchName,
  churchSlug,
  logoUrl,
  children,
}: {
  churchId: string;
  organizationId: string;
  churchName: string;
  churchSlug: string;
  logoUrl?: string;
  children: React.ReactNode;
}) {
  return (
    <ChurchUrlScopeProvider
      organizationId={organizationId}
      churchId={churchId}
      name={churchName}
      slug={churchSlug}
      logoUrl={logoUrl}
    >
      <AuthenticatedAppShell>
        <SyncActiveChurch churchId={churchId} />
        {children}
      </AuthenticatedAppShell>
    </ChurchUrlScopeProvider>
  );
}
