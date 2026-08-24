import { RequireAuth } from "@/components/auth/require-auth";
import { pageContentClass, typePageTitleClass } from "@/lib/responsive-classes";

export const metadata = {
  title: "Groups",
  description: "Your worship groups",
};

export default function GroupsPage() {
  return (
    <RequireAuth>
      <div className={pageContentClass}>
        <h1 className={typePageTitleClass}>Groups</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Manage and join worship groups.
        </p>
      </div>
    </RequireAuth>
  );
}
