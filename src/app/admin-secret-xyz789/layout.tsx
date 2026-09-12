import { ClientRedirect } from "@/components/auth/client-redirect";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata(
  "Admin Panel",
  "FaithConnectHub legacy admin content management panel."
);

/** Legacy route — middleware also redirects; keep a server-safe fallback. */
export default function AdminLayout() {
  return <ClientRedirect to="/dashboard/content?tab=songs" />;
}
