import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type AuthPlatformBrandProps = {
  className?: string;
  href?: string;
};

/**
 * Horizontal FaithConnectHub lockup for Sign In / Sign Up only.
 * Medium display size: larger than the original compact mark, without
 * filling the form column. Aspect ratio is unchanged.
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
        src="/images/faithconnecthub-lockup-transparent.png"
        alt="FaithConnectHub"
        width={352}
        height={90}
        priority
        className="auth-logo-img h-auto w-[min(100%,18.5rem)] max-w-full bg-transparent object-contain object-left"
      />
    </Link>
  );
}
