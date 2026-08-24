import { RequireAuth } from "@/components/auth/require-auth";
import { ProfileForm } from "./_components/profile-form";

export const metadata = {
  title: "Profile Settings",
  description: "Edit your profile settings.",
};

export default function SettingsProfilePage() {
  return (
    <RequireAuth>
      <div className="space-y-4">
        <div className="space-y-1 border-b p-4">
          <h2 className="font-heading text-lg drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-xl md:text-2xl">
            Account Settings
          </h2>

          <p className="text-sm text-muted-foreground">
            This is how others will see you on the site.
          </p>
        </div>

        <ProfileForm />
      </div>
    </RequireAuth>
  );
}
