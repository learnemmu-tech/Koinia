"use client";

import { AuthRedirect } from "@/components/auth/auth-redirect";

import { ForgotPasswordForm } from "./_components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthRedirect>
      <ForgotPasswordForm />
    </AuthRedirect>
  );
}
