import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type AuthPlatformBrandProps = {
  className?: string;
  href?: string;
};

/**
 * Official FaithConnectHub platform lockup (transparent, content-cropped).
 * Sits on cream #F6F1E7 with no white rectangular plate.
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
        src="/images/faithconnecthub-lockup-auth.png"
        alt="FaithConnectHub"
        width={260}
        height={47}
        priority
        className="auth-logo-img h-auto w-[min(100%,232px)] bg-transparent object-contain object-left lg:w-[244px]"
      />
    </Link>
  );
}
