import { RequireAuth } from "@/components/auth/require-auth";

import { EmailNotificationSettings } from "../_components/email-notification-settings";

export const metadata = {
  title: "Email Notifications",
  description: "Manage your email notification preferences.",
};

export default function EmailNotificationsSettingsPage() {
  return (
    <RequireAuth>
      <div className="space-y-4">
        <div className="space-y-1 border-b p-4">
          <h2 className="font-heading text-lg drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-xl md:text-2xl">
            Email Notifications
          </h2>

          <p className="text-sm text-muted-foreground">
            Choose which transactional emails you receive from FaithConnectHub.
            Account security emails cannot be disabled.
          </p>
        </div>

        <EmailNotificationSettings />
      </div>
    </RequireAuth>
  );
}