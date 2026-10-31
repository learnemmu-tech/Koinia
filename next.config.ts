import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// This is validation for the environment variables early in the build process.
import "./src/lib/env";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isProd = process.env.NODE_ENV === "production";
const isDocker = process.env.IS_DOCKER === "true";

function supabaseImageHostname(): string | null {
  const raw = process.env.SUPABASE_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

const config: NextConfig = {
  // Keep `next dev` and `next build` from sharing an incomplete `.next` cache.
  // A partial app-paths-manifest from the dev server makes collect-page-data
  // throw PageNotFoundError for real routes such as /forgot-password.
  distDir: isProd ? ".next" : ".next-dev",
  /** Hide the Next.js circular "N" development indicator (not app UI). */
  devIndicators: false,
  reactStrictMode: true,
  serverExternalPackages: ["pg"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "faithconnecthub-a4e6b.firebasestorage.app",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      ...(supabaseImageHostname()
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseImageHostname()!,
            },
          ]
        : []),
    ],
    // Optimize on Vercel production and Docker. Keep originals in local `next dev`
    // so admin-managed media is not double-compressed during development.
    unoptimized: !isProd && !isDocker,
  },
  experimental: {
    ppr: false,
    staleTimes: {
      dynamic: 0,
    },
    reactCompiler: isProd ? true : undefined,
    /** Clerk middleware buffers bodies; Shorts allow up to 100 MB video uploads. */
    middlewareClientMaxBodySize: "110mb",
    serverActions: {
      /** Cover 2 MB + audio 20 MB + form metadata; Shorts video up to 100 MB */
      bodySizeLimit: "110mb",
    },
  },
  output: isDocker ? "standalone" : undefined,
  async headers() {
    // script-src-elem lists the external <script> hosts the app actually loads:
    // Clerk, Cloudflare challenges, Umami, Vercel Web Analytics, and Razorpay
    // checkout. unsafe-inline stays because Next.js and Clerk inject bootstrap
    // scripts. unsafe-eval stays on script-src in development only, for the
    // Next dev server, and is not copied onto script-src-elem or production.
    // worker-src allows Clerk's same-origin blob workers. connect-src and
    // img-src allow https because songs, logos, and banners can be stored on
    // the church's own HTTPS host. That already covers Umami and Vercel
    // analytics beacons. frame-src stays limited to Clerk, YouTube, Vimeo, and
    // the payment frames already referenced. blob: and data: stay on img/media
    // because uploads and downloads use object URLs.
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "frame-ancestors 'self'",
              "form-action 'self'",
              `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"} https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com https://us.umami.is https://cloud.umami.is https://va.vercel-scripts.com https://checkout.razorpay.com`,
              `script-src-elem 'self' 'unsafe-inline' https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com https://us.umami.is https://cloud.umami.is https://va.vercel-scripts.com https://checkout.razorpay.com`,
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "media-src 'self' blob: https:",
              "connect-src 'self' https: wss:",
              "frame-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://api.razorpay.com https://checkout.razorpay.com https://js.stripe.com https://hooks.stripe.com",
            ].join("; "),
          },
          ...(isProd
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/music/:id",
        destination: "/songs/:id",
        permanent: true,
      },
      {
        source: "/song/:id",
        destination: "/songs/:id",
        permanent: true,
      },
      {
        source: "/ceremonies/:id",
        destination: "/sermons/:id",
        permanent: true,
      },
      {
        source: "/ceremonies",
        destination: "/",
        permanent: true,
      },
      {
        source: "/admin/ceremonies",
        destination: "/dashboard?tab=sermons",
        permanent: true,
      },
      {
        source: "/dashboard",
        has: [{ type: "query", key: "tab", value: "ceremonies" }],
        destination: "/dashboard?tab=sermons",
        permanent: true,
      },
      {
        source: "/admin-worship-panel",
        destination: "/dashboard",
        permanent: true,
      },
      {
        source: "/admin-worship-panel/:path*",
        destination: "/dashboard/:path*",
        permanent: true,
      },
      {
        source: "/onboarding/invite-team",
        destination: "/dashboard/organization?tab=invitations",
        permanent: false,
      },
      {
        source: "/c/:slug/groups",
        destination: "/c/:slug/ministries",
        permanent: false,
      },
      {
        source: "/c/:slug/groups/",
        destination: "/c/:slug/ministries",
        permanent: false,
      },
    ];
  },
};

export default withNextIntl(config);
