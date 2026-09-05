import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",

  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    DATABASE_URL: z.string().min(1),

    CLERK_SECRET_KEY: z.string().min(1),

    SUPABASE_URL: z.string().url(),
    SUPABASE_SECRET_KEY: z.string().min(1),
    SUPABASE_STORAGE_BUCKET: z.string().min(1).default("faithconnecthub"),

    UMAMI_WEBSITE_ID: z.string().optional(),
  },

  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().optional(),
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().optional(),
  },

  experimental__runtimeEnv: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
  },

  emptyStringAsUndefined: true,
});
