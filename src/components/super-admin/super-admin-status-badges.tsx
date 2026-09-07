import { Badge } from "@/components/ui/badge";
import {
  formatOrganizationStatus,
  formatPlanId,
  formatSubscriptionStatus,
} from "@/lib/super-admin/labels";

export function OrganizationAccessBadge({ status }: { status: string }) {
  return (
    <Badge
      variant={
        status === "suspended" ? "destructive"
        : status === "trial" ? "outline"
        : "secondary"
      }
      className="font-normal"
    >
      {formatOrganizationStatus(status)}
    </Badge>
  );
}

export function ChurchStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? "secondary" : "outline"} className="font-normal">
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

export function PlanBadge({ planId }: { planId: string | null }) {
  return (
    <Badge variant="secondary" className="font-normal">
      {formatPlanId(planId)}
    </Badge>
  );
}

export function SubscriptionStatusBadge({
  status,
}: {
  status: string | null;
}) {
  const variant =
    status === "past_due" || status === "canceled" ? "destructive"
    : status === "trialing" ? "outline"
    : "secondary";

  return (
    <Badge variant={variant} className="font-normal">
      {formatSubscriptionStatus(status)}
    </Badge>
  );
}

export function PlatformRoleBadge({ role }: { role: string }) {
  const variant =
    role === "super_admin" ? "default"
    : role === "admin" ? "secondary"
    : "outline";

  return (
    <Badge variant={variant} className="font-normal capitalize">
      {role.replaceAll("_", " ")}
    </Badge>
  );
}
