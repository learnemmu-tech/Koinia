import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type AuthPlatformBrandProps = {
  className?: string;
  href?: string;
};

/**
 * Official Shepherd brand mark used across the app.
 * Keeps the original circular shepherd emblem consistent across auth screens.
 */
export function AuthPlatformBrand({
  className,
  href = "/",
}: AuthPlatformBrandProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C0623A]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F1E7]",
        className
      )}
      aria-label="FaithConnectHub"
    >
      <Image
        src="/icons/shepherd-ai.webp"
        alt="FaithConnectHub"
        width={220}
        height={220}
        priority
        className="auth-logo-img h-auto w-[min(100%,210px)] rounded-full bg-transparent object-contain object-center"
      />
    </Link>
  );
}
