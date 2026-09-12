import Image from "next/image";
import Link from "next/link";

import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { cn } from "@/lib/utils";

import { AuthBrandPanel } from "./_components/auth-brand-panel";
import { AuthLightShell } from "./_components/auth-light-shell";
import { AuthPlatformBrand } from "./_components/auth-platform-brand";

type FirebaseAuthLayoutProps = {
  children: React.ReactNode;
};

export default function FirebaseAuthLayout({
  children,
}: FirebaseAuthLayoutProps) {
  return (
    <AuthLightShell>
      {/*
        Desktop: exact viewport shell (100dvh) — both columns equal height,
        no page scrollbar. Content is compacted to fit; mobile may scroll.
      */}
      <div
        className={cn(
          "auth-shell grid w-full overflow-x-hidden bg-[#F6F1E7] text-[#1C2B3A]",
          "min-h-dvh",
          "lg:h-dvh lg:max-h-dvh lg:grid-cols-2 lg:overflow-hidden"
        )}
      >
        <div className="relative flex min-h-dvh flex-col bg-[#F6F1E7] lg:h-full lg:min-h-0 lg:overflow-hidden">
          <div className="relative h-[6.5rem] w-full shrink-0 overflow-hidden sm:h-28 lg:hidden">
            <Image
              src="/images/auth-hero.png"
              alt=""
              fill
              priority
              quality={95}
              sizes="100vw"
              className="object-cover object-[center_42%]"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-[#F6F1E7] via-[#F6F1E7]/35 to-transparent"
            />
            <div className="absolute right-3 top-3 z-10">
              <LocaleSwitcher
                className={cn(
                  "border-[#E2D9CC] bg-white text-[#1C2B3A] shadow-none",
                  "hover:bg-[#FBF8F3] hover:text-[#1C2B3A]",
                  "focus-visible:bg-white focus-visible:text-[#1C2B3A]",
                  "data-[state=open]:bg-white data-[state=open]:text-[#1C2B3A]",
                  "dark:border-[#E2D9CC] dark:bg-white dark:text-[#1C2B3A]",
                  "dark:hover:bg-[#FBF8F3] dark:hover:text-[#1C2B3A]",
                  "dark:focus-visible:bg-white dark:focus-visible:text-[#1C2B3A]",
                  "dark:data-[state=open]:bg-white dark:data-[state=open]:text-[#1C2B3A]"
                )}
              />
            </div>
          </div>

          <div className="auth-panel flex min-h-0 flex-1 flex-col px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-5 sm:px-8 sm:pt-6 lg:px-12 lg:pb-5 lg:pt-7 xl:px-16 xl:pb-6 xl:pt-8">
            <div className="mx-auto flex min-h-0 w-full max-w-[490px] flex-1 flex-col">
              <div className="auth-logo mb-6 flex shrink-0 items-center lg:mb-7">
                <AuthPlatformBrand />
              </div>

              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex min-h-0 flex-1 flex-col justify-center">
                  <div className="auth-form-slot w-full">{children}</div>
                </div>

                <nav
                  aria-label="Legal"
                  className="auth-footer mt-5 flex shrink-0 flex-wrap items-center gap-x-2.5 gap-y-1 pt-1 text-[11px] leading-none text-[#6B7280] lg:mt-4"
                >
                  <Link
                    href="/privacy"
                    className="inline-flex min-h-8 items-center hover:text-[#1C2B3A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C0623A]/35 lg:min-h-0 lg:py-0.5"
                  >
                    Privacy Policy
                  </Link>
                  <span aria-hidden className="text-[#D6CDBF]">
                    |
                  </span>
                  <Link
                    href="/terms"
                    className="inline-flex min-h-8 items-center hover:text-[#1C2B3A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C0623A]/35 lg:min-h-0 lg:py-0.5"
                  >
                    Terms of Service
                  </Link>
                  <span aria-hidden className="text-[#D6CDBF]">
                    |
                  </span>
                  <Link
                    href="/contact"
                    className="inline-flex min-h-8 items-center hover:text-[#1C2B3A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C0623A]/35 lg:min-h-0 lg:py-0.5"
                  >
                    Help
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        </div>

        <AuthBrandPanel />
      </div>
    </AuthLightShell>
  );
}
