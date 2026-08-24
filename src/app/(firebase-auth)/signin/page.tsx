import type { Metadata } from "next";

import { AuthRedirect } from "@/components/auth/auth-redirect";
import { sanitizeCallbackUrl } from "@/lib/callback-url";

import { FirebaseSignInForm } from "./_components/firebase-signin-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your account",
};

type SignInPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { callbackUrl } = await searchParams;
  const redirectTo = sanitizeCallbackUrl(callbackUrl);

  return (
    <AuthRedirect callbackUrl={redirectTo}>
      <FirebaseSignInForm callbackUrl={redirectTo} />
    </AuthRedirect>
  );
}
