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

export function SuperAdminMembersFilters({
  q,
  organizationId,
  churchId,
  platformRole,
}: {
  q: string;
  organizationId: string;
  churchId: string;
  platformRole: string;
}) {
  return (
    <form
      method="get"
      action={`${SUPER_ADMIN_BASE}/members`}
      className="grid gap-3 rounded-xl border border-border/50 bg-card p-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      <div className="space-y-1.5 lg:col-span-2">
        <Label htmlFor="member-search">Search</Label>
        <Input
          id="member-search"
          name="q"
          defaultValue={q}
          placeholder="Name or email"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="member-org">Organization ID</Label>
        <Input
          id="member-org"
          name="organizationId"
          defaultValue={organizationId}
          placeholder="UUID"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="member-church">Church ID</Label>
        <Input
          id="member-church"
          name="churchId"
          defaultValue={churchId}
          placeholder="UUID"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="member-role">Platform role</Label>
        <select
          id="member-role"
          name="platformRole"
          defaultValue={platformRole}
          className={selectClass}
        >
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super admin</option>
        </select>
      </div>
      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
        <Button type="submit" size="sm">
          Apply
        </Button>
        <Button type="button" size="sm" variant="outline" asChild>
          <a href={`${SUPER_ADMIN_BASE}/members`}>Reset</a>
        </Button>
      </div>
    </form>
  );
}
