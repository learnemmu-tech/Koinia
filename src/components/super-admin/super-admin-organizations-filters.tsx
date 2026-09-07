import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUPER_ADMIN_BASE } from "@/lib/auth/auth-paths";
import { responsiveFilterSelectClass } from "@/lib/responsive-classes";
import { cn } from "@/lib/utils";

const selectClass = cn(
  responsiveFilterSelectClass,
  "rounded-md border border-input bg-background px-3 text-sm"
);

export function SuperAdminOrganizationsFilters({
  q,
  workspaceType,
  status,
  planId,
  subscriptionStatus,
}: {
  q: string;
  workspaceType: string;
  status: string;
  planId: string;
  subscriptionStatus: string;
}) {
  return (
    <form
      method="get"
      action={`${SUPER_ADMIN_BASE}/organizations`}
      className="grid gap-3 rounded-2xl border border-border/50 bg-card p-4 sm:grid-cols-2 lg:grid-cols-6"
    >
      <div className="space-y-1.5 lg:col-span-2">
        <Label htmlFor="org-search">Search</Label>
        <Input
          id="org-search"
          name="q"
          defaultValue={q}
          placeholder="Organization name"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="org-type">Type</Label>
        <select
          id="org-type"
          name="workspaceType"
          defaultValue={workspaceType}
          className={selectClass}
        >
          <option value="">All types</option>
          <option value="independent_church">Independent church</option>
          <option value="multi_church_org">Multi-church organization</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="org-status">Access</Label>
        <select
          id="org-status"
          name="status"
          defaultValue={status}
          className={selectClass}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="org-plan">Plan</Label>
        <select
          id="org-plan"
          name="planId"
          defaultValue={planId}
          className={selectClass}
        >
          <option value="">All plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="org-sub-status">Subscription</Label>
        <select
          id="org-sub-status"
          name="subscriptionStatus"
          defaultValue={subscriptionStatus}
          className={selectClass}
        >
          <option value="">All subscriptions</option>
          <option value="active">Active</option>
          <option value="trialing">Trialing</option>
          <option value="past_due">Past due</option>
          <option value="canceled">Canceled</option>
          <option value="incomplete">Incomplete</option>
        </select>
      </div>
      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
        <Button type="submit" size="sm">
          Apply
        </Button>
        <Button type="button" size="sm" variant="outline" asChild>
          <a href={`${SUPER_ADMIN_BASE}/organizations`}>Reset</a>
        </Button>
      </div>
    </form>
  );
}
