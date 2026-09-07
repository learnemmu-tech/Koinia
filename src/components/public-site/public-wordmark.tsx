import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

type PublicWordmarkProps = {
  href?: string;
  className?: string;
};

export function PublicWordmark({
  href = "/",
  className,
}: PublicWordmarkProps) {
  return (
    <Link
      href={href}
      aria-label={`${siteConfig.name} home`}
      className={cn(
        "inline-flex min-w-0 items-baseline transition-opacity hover:opacity-80",
        className
      )}
    >
      <span className="font-heading text-[1.05rem] leading-none tracking-tight text-foreground sm:text-[1.125rem]">
        FaithConnect
      </span>
      <span className="font-sans text-[1.05rem] font-light leading-none tracking-wide text-foreground/70 sm:text-[1.125rem]">
        Hub
      </span>
    </Link>
  );
}
