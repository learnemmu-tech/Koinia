import { RequireAuth } from "@/components/auth/require-auth";
import { ProfilePageClient } from "@/components/profile/profile-page-client";

export const metadata = {
  title: "Profile",
  description: "Your profile and saved library",
};

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfilePageClient />
    </RequireAuth>
  );
}
