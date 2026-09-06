import type { NextConfig } from "next";

// This is validation for the environment variables early in the build process.
import "./src/lib/env";

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
        hostname: "img.clerk.com",
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
    unoptimized: !isDocker,
  },
  experimental: {
    ppr: false,
    reactCompiler: isProd ? true : undefined,
    /** Clerk middleware buffers bodies; Shorts allow up to 100 MB video uploads. */
    middlewareClientMaxBodySize: "110mb",
    serverActions: {
      /** Cover 2 MB + audio 20 MB + form metadata; Shorts video up to 100 MB */
      bodySizeLimit: "110mb",
    },
  },
  output: isDocker ? "standalone" : undefined,
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
    ];
  },
};

export default config;
