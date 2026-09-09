import { RequireAuth } from "@/components/auth/require-auth";
import { ProfileForm } from "./_components/profile-form";
import { SettingsAccountHeading } from "./_components/settings-account-heading";

export const metadata = {
  title: "Profile Settings",
  description: "Edit your profile settings.",
};

export default function SettingsProfilePage() {
  return (
    <RequireAuth>
      <div className="space-y-4">
        <SettingsAccountHeading />

        <ProfileForm />
      </div>
    </RequireAuth>
  );
}
