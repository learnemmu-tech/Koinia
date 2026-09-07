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

export function SuperAdminSubscriptionsFilters({
  q,
  planId,
  subscriptionStatus,
  organizationAccess,
}: {
  q: string;
  planId: string;
  subscriptionStatus: string;
  organizationAccess: string;
}) {
  return (
    <form
      method="get"
      action={`${SUPER_ADMIN_BASE}/subscriptions`}
      className="grid gap-3 rounded-xl border border-border/50 bg-card p-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      <div className="space-y-1.5 lg:col-span-2">
        <Label htmlFor="sub-search">Organization</Label>
        <Input
          id="sub-search"
          name="q"
          defaultValue={q}
          placeholder="Organization name"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="sub-plan">Plan</Label>
        <select
          id="sub-plan"
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
        <Label htmlFor="sub-status">Subscription</Label>
        <select
          id="sub-status"
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
      <div className="space-y-1.5">
        <Label htmlFor="sub-access">Access</Label>
        <select
          id="sub-access"
          name="organizationAccess"
          defaultValue={organizationAccess}
          className={selectClass}
        >
          <option value="">All access</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>
      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
        <Button type="submit" size="sm">
          Apply
        </Button>
        <Button type="button" size="sm" variant="outline" asChild>
          <a href={`${SUPER_ADMIN_BASE}/subscriptions`}>Reset</a>
        </Button>
      </div>
    </form>
  );
}
