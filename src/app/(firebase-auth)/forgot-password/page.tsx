"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AuthRedirect } from "@/components/auth/auth-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFirebaseAuthErrorMessage } from "@/lib/firebase-auth-errors";
import { resetPassword } from "@/lib/firebase-auth-service";

const forgotPasswordSchema = (tValidation: ReturnType<typeof useTranslations<"validation">>) =>
  z.object({
    email: z
      .string()
      .min(1, tValidation("emailRequired"))
      .email(tValidation("invalidEmail")),
  });

type ForgotPasswordValues = {
  email: string;
};

function ForgotPasswordForm() {
  const tAuth = useTranslations("auth");
  const tValidation = useTranslations("validation");
  const forgotPasswordSchemaMemo = useMemo(
    () => forgotPasswordSchema(tValidation),
    [tValidation]
  );
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchemaMemo),
  });

  async function onSubmit(data: ForgotPasswordValues) {
    setIsLoading(true);
    try {
      await resetPassword(data.email);
      toast.success(tAuth("resetEmailSent"));
    } catch (error) {
      toast.error(getFirebaseAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center md:text-left">
        <h1 className="text-2xl font-bold tracking-tight">{tAuth("forgotPasswordTitle")}</h1>
        <p className="text-sm text-zinc-400">
          {tAuth("forgotPasswordSubtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">{tAuth("email")}</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            autoComplete="email"
            disabled={isLoading}
            className=""
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full font-semibold"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
          {tAuth("sendResetLink")}
        </Button>
      </form>

      <Button
        asChild
        variant="ghost"
        className="text-muted-foreground hover:text-foreground"
      >
        <Link href="/signin">
          <ArrowLeft className="mr-2 size-4" />
          {tAuth("backToSignIn")}
        </Link>
      </Button>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <AuthRedirect>
      <ForgotPasswordForm />
    </AuthRedirect>
  );
}
