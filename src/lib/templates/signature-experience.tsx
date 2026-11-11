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
  publicVisitor = false,
  children,
}: {
  churchId: string;
  organizationId: string;
  churchName: string;
  churchSlug: string;
  logoUrl?: string;
  publicVisitor?: boolean;
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
      <AuthenticatedAppShell publicVisitor={publicVisitor}>
        <SyncActiveChurch churchId={churchId} />
        {children}
      </AuthenticatedAppShell>
    </ChurchUrlScopeProvider>
  );
}
