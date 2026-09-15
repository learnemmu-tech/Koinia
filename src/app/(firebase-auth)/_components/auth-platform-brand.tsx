import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type AuthPlatformBrandProps = {
  className?: string;
  href?: string;
};

/**
 * Horizontal FaithConnectHub lockup for Sign In / Sign Up only.
 * Intrinsic size is 327×85; displayed width stays modest on all viewports.
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
        width={327}
        height={85}
        priority
        className="auth-logo-img h-auto w-[min(100%,248px)] max-w-full bg-transparent object-contain object-left"
      />
    </Link>
  );
}
