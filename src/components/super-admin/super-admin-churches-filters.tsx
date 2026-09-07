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

export function SuperAdminChurchesFilters({
  q,
  organizationQ,
  isActive,
}: {
  q: string;
  organizationQ: string;
  isActive: string;
}) {
  return (
    <form
      method="get"
      action={`${SUPER_ADMIN_BASE}/churches`}
      className="grid gap-3 rounded-xl border border-border/50 bg-card p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="space-y-1.5">
        <Label htmlFor="church-search">Church</Label>
        <Input
          id="church-search"
          name="q"
          defaultValue={q}
          placeholder="Church name"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="church-org-search">Organization</Label>
        <Input
          id="church-org-search"
          name="organizationQ"
          defaultValue={organizationQ}
          placeholder="Organization name"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="church-status">Status</Label>
        <select
          id="church-status"
          name="isActive"
          defaultValue={isActive}
          className={selectClass}
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>
      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
        <Button type="submit" size="sm">
          Apply
        </Button>
        <Button type="button" size="sm" variant="outline" asChild>
          <a href={`${SUPER_ADMIN_BASE}/churches`}>Reset</a>
        </Button>
      </div>
    </form>
  );
}
