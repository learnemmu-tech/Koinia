import type { TenantScope } from "@/lib/organization/tenant-scope";

import { SearchMenuClient } from "./search-menu-client";

type NavbarSearchSectionProps = {
  className?: string;
  placeholder?: string;
  enableShortcut?: boolean;
  scope: TenantScope;
};

export function NavbarSearchSection({
  className,
  placeholder,
  enableShortcut,
  scope,
}: NavbarSearchSectionProps) {
  return (
    <SearchMenuClient
      className={className}
      scope={scope}
      placeholder={placeholder}
      enableShortcut={enableShortcut}
    />
  );
}
