import { RequireAuth } from "@/components/auth/require-auth";
import { RecentlyViewedPageClient } from "@/components/library/recently-viewed-page-client";

export const metadata = {
  title: "Recently Viewed",
  description: "Your recently viewed songs, sermons, and articles",
};

export default function RecentlyViewedPage() {
  return (
    <RequireAuth>
      <RecentlyViewedPageClient />
    </RequireAuth>
  );
}
