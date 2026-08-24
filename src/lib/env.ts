import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",

  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    FIREBASE_SERVICE_ACCOUNT_KEY: z.string().optional(),

    UMAMI_WEBSITE_ID: z.string().optional(),
  },

  client: {},

  experimental__runtimeEnv: {},

  emptyStringAsUndefined: true,
});
