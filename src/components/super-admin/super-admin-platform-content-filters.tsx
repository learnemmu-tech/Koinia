import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUPER_ADMIN_BASE } from "@/lib/auth/auth-paths";
import { responsiveFilterSelectClass } from "@/lib/responsive-classes";
import type { PlatformContentTab } from "@/lib/super-admin/platform-content-queries";
import { cn } from "@/lib/utils";

const selectClass = cn(
  responsiveFilterSelectClass,
  "rounded-md border border-input bg-background px-3 text-sm"
);

export function SuperAdminPlatformContentFilters({
  tab,
  q,
  status,
}: {
  tab: PlatformContentTab;
  q: string;
  status: string;
}) {
  const resetHref =
    tab === "all"
      ? `${SUPER_ADMIN_BASE}/content`
      : `${SUPER_ADMIN_BASE}/content?tab=${tab}`;

  return (
    <form
      method="get"
      action={`${SUPER_ADMIN_BASE}/content`}
      className="grid gap-3 rounded-xl border border-border/50 bg-card p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {/* Keeps the active type selection when filters are applied. */}
      {tab === "all" ? null : <input type="hidden" name="tab" value={tab} />}

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="platform-content-search">Search</Label>
        <Input
          id="platform-content-search"
          name="q"
          defaultValue={q}
          placeholder="Title, speaker, author, artist…"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="platform-content-status">Status</Label>
        <select
          id="platform-content-status"
          name="status"
          defaultValue={status}
          className={selectClass}
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Unpublished</option>
        </select>
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit" size="sm">
          Apply
        </Button>
        <Button type="button" size="sm" variant="outline" asChild>
          <a href={resetHref}>Reset</a>
        </Button>
      </div>
    </form>
  );
}
