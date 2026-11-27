import Image from "next/image";
import { Suspense } from "react";

import { AuthLegalLinks } from "@/components/legal/auth-legal-links";

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
        Form column fills the viewport. Logo + form + legal links are one
        block with vertical auto margins: centered when they fit, start at
        the top and scroll when they do not (signup). Do not center the form
        independently of the logo — that overlapped the lockup.
      */}
      <div
        className={cn(
          "auth-shell grid w-full overflow-x-hidden bg-[#F6F1E7] text-[#1C2B3A]",
          "min-h-svh",
          "lg:h-dvh lg:max-h-dvh lg:grid-cols-2 lg:overflow-hidden"
        )}
      >
        <div
          className={cn(
            "relative flex min-h-svh flex-col bg-[#F6F1E7] lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overflow-x-hidden",
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          )}
        >
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

          <div className="auth-panel flex min-h-0 flex-1 flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-8 sm:pt-6 lg:px-12 lg:pb-6 lg:pt-7 xl:px-16 xl:pb-8 xl:pt-8">
            <div className="mx-auto my-auto flex w-full max-w-[490px] flex-col">
              <div className="auth-logo mb-8 flex shrink-0 items-center lg:mb-8">
                <AuthPlatformBrand />
              </div>

              <div className="auth-form-slot w-full">{children}</div>

              <Suspense fallback={null}>
                <AuthLegalLinks
                  terms="Terms of Service"
                  privacy="Privacy Policy"
                  className="auth-footer mt-8 flex shrink-0 flex-wrap items-center gap-x-2.5 gap-y-1 pt-2 text-[11px] leading-none text-[#6B7280] [&_a]:inline-flex [&_a]:min-h-8 [&_a]:items-center [&_a]:hover:text-[#1C2B3A] lg:[&_a]:min-h-0"
                />
              </Suspense>
            </div>
          </div>
        </div>

        <AuthBrandPanel />
      </div>
    </AuthLightShell>
  );
}
