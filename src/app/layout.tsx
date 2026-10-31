import "@/styles/globals.css";

import React from "react";
import { cookies, headers } from "next/headers";
import Script from "next/script";

import type { Metadata, Viewport } from "next";
import type { ThemeConfig } from "@/types";

import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Analytics } from "@vercel/analytics/react";

import { RootClientShell } from "@/components/root-client-shell";
import { siteConfig } from "@/config/site";
import { LOCALE_COOKIE, parseLocale } from "@/i18n/config";
import { POST_AUTH_CONTINUE_HOME, CREATE_WORKSPACE_PATH } from "@/lib/auth/auth-paths";
import { env } from "@/lib/env";
import { SEO_KEYWORDS } from "@/lib/seo";
import { readActiveChurchIdFromCookieValue, ACTIVE_CHURCH_COOKIE_NAME } from "@/lib/church-cookies";
import { resolveActiveChurchId } from "@/lib/church-server";
import { logNavStage } from "@/lib/nav-trace";
import * as fonts from "@/lib/fonts";
import { absoluteUrl, cn } from "@/lib/utils";
import { Noto_Sans_Telugu } from "next/font/google";

const notoSansTelugu = Noto_Sans_Telugu({
  subsets: ["telugu"],
  variable: "--font-telugu",
});


type RootLayoutProps = {
  children: React.ReactNode;
  modal: React.ReactNode;
};

export default async function RootLayout({ children, modal }: RootLayoutProps) {
  const layoutStarted = Date.now();
  const headerStore = await headers();
  const traceId = headerStore.get("x-fch-trace") || "no-trace";
  const cookieStore = await cookies();
  const themeConfig = cookieStore.get("theme-config");

  const { theme, radius } = JSON.parse(
    themeConfig?.value ?? '{"theme":"default","radius":"default"}'
  ) as ThemeConfig;

  // The cookie is only a client hint. A database lookup runs when a signed-in
  // session has no cookie. Anonymous pages, including sign-in, skip Neon.
  const cookieChurchId = readActiveChurchIdFromCookieValue(
    cookieStore.get(ACTIVE_CHURCH_COOKIE_NAME)?.value
  );
  let initialActiveChurchId = cookieChurchId;
  let signedIn = false;
  if (!initialActiveChurchId) {
    const authStarted = Date.now();
    const { userId } = await auth();
    logNavStage(traceId, "root.auth", authStarted, { signedIn: Boolean(userId) });
    signedIn = Boolean(userId);
    if (userId) {
      const churchStarted = Date.now();
      initialActiveChurchId = (await resolveActiveChurchId()) || null;
      logNavStage(traceId, "root.church", churchStarted, {
        resolved: Boolean(initialActiveChurchId),
      });
    }
  }
  logNavStage(traceId, "root.layout", layoutStarted, {
    sessionLookup: cookieChurchId ? "skipped-cookie" : signedIn ? "signed-in" : "signed-out",
    churchFromCookie: Boolean(cookieChurchId),
  });
  const locale = parseLocale(cookieStore.get(LOCALE_COOKIE)?.value);

  return (
    <React.StrictMode>
      <html
        lang={locale}
        suppressHydrationWarning
        className={cn(fonts.fontSans.variable, notoSansTelugu.variable)}
      >
        <body
          className={cn(
            Object.values(fonts).map((font) => font.variable),
            "min-h-screen font-sans antialiased",
            `theme-${theme}`
          )}
          style={
            radius === "default" ?
              {}
            : ({ "--radius": `${radius}rem` } as React.CSSProperties)
          }
        >
          <ClerkProvider
            signInUrl="/signin"
            signUpUrl="/signup"
            afterSignOutUrl="/signin"
            signInFallbackRedirectUrl={POST_AUTH_CONTINUE_HOME}
            signUpFallbackRedirectUrl={CREATE_WORKSPACE_PATH}
          >
            <RootClientShell
              initialActiveChurchId={initialActiveChurchId}
              initialLocale={locale}
              modal={modal}
            >
              {children}
            </RootClientShell>
          </ClerkProvider>
          <Analytics />
        </body>

        {/* Umami Analytics */}
        <Script
          async
          src="https://us.umami.is/script.js"
          data-website-id={env.UMAMI_WEBSITE_ID}
        />
      </html>
    </React.StrictMode>
  );
}

export const viewport: Viewport = {
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F1E7" },
    { media: "(prefers-color-scheme: dark)", color: "#0a4549" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...SEO_KEYWORDS],
  alternates: {
    canonical: siteConfig.url,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [{ url: absoluteUrl(siteConfig.image), alt: siteConfig.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [absoluteUrl(siteConfig.image)],
  },
  icons: {
    icon: [
      { url: siteConfig.icon, sizes: "192x192", type: "image/png" },
      { url: siteConfig.icon, sizes: "512x512", type: "image/png" },
    ],
    shortcut: siteConfig.icon,
    apple: siteConfig.appleIcon,
  },
  metadataBase: new URL(absoluteUrl("/")),
};
