"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

import { AuthLoading } from "@/components/auth/auth-loading";
import { CREATE_WORKSPACE_PATH, POST_AUTH_CONTINUE_HOME } from "@/lib/auth/auth-paths";

export default function SSOCallbackPage() {
  return (
    <>
      <AuthLoading />
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl={POST_AUTH_CONTINUE_HOME}
        signUpFallbackRedirectUrl={CREATE_WORKSPACE_PATH}
      />
    </>
  );
}
