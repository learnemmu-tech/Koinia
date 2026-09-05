"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

import { AuthLoading } from "@/components/auth/auth-loading";
import { POST_AUTH_CONTINUE_PATH } from "@/lib/auth/auth-paths";

export default function SSOCallbackPage() {
  return (
    <>
      <AuthLoading />
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl={POST_AUTH_CONTINUE_PATH}
        signUpFallbackRedirectUrl={POST_AUTH_CONTINUE_PATH}
        signInForceRedirectUrl={POST_AUTH_CONTINUE_PATH}
        signUpForceRedirectUrl={POST_AUTH_CONTINUE_PATH}
      />
    </>
  );
}
