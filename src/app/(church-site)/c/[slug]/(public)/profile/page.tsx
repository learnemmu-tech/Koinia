import { RequireAuth } from "@/components/auth/require-auth";
import { ProfilePageClient } from "@/components/profile/profile-page-client";
import { generateChurchWebsiteMetadata } from "@/lib/templates/church-page-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return generateChurchWebsiteMetadata(slug, "Profile");
}

export default function ChurchProfilePage() {
  return (
    <RequireAuth>
      <ProfilePageClient />
    </RequireAuth>
  );
}
