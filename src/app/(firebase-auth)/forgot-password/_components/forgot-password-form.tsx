"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFirebaseAuthErrorMessage } from "@/lib/firebase-auth-errors";
import { resetPassword } from "@/lib/firebase-auth-service";
import {
  AUTH_FIELD_GROUP_CLASS,
  AUTH_FORM_FIELDS_CLASS,
  AUTH_FORM_STACK_CLASS,
  authFormStyles,
  type AuthFormAppearance,
} from "../../_components/auth-form-styles";

const forgotPasswordSchema = (
  tValidation: ReturnType<typeof useTranslations<"validation">>
) =>
  z.object({
    email: z
      .string()
      .min(1, tValidation("emailRequired"))
      .email(tValidation("invalidEmail")),
  });

type ForgotPasswordValues = {
  email: string;
};

export function ForgotPasswordForm({
  backHref = "/signin",
  appearance = "default",
  inlineErrors = false,
}: {
  backHref?: string;
  appearance?: AuthFormAppearance;
  inlineErrors?: boolean;
}) {
  const tAuth = useTranslations("auth");
  const tValidation = useTranslations("validation");
  const styles = authFormStyles(appearance);
  const forgotPasswordSchemaMemo = useMemo(
    () => forgotPasswordSchema(tValidation),
    [tValidation]
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [formSuccess, setFormSuccess] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchemaMemo),
  });

  async function onSubmit(data: ForgotPasswordValues) {
    setIsLoading(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      await resetPassword(data.email);
      const message = tAuth("resetEmailSent");
      setFormSuccess(message);
      if (!inlineErrors) toast.success(message);
    } catch (error) {
      const message = getFirebaseAuthErrorMessage(error);
      setFormError(message);
      if (!inlineErrors) toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={AUTH_FORM_STACK_CLASS}>
      <div className="flex flex-col gap-2 text-left">
        <h1 className={styles.heading}>{tAuth("forgotPasswordTitle")}</h1>
        <p className={styles.muted}>{tAuth("forgotPasswordSubtitle")}</p>
      </div>

      {formError ? (
        <div role="alert" className={styles.error}>
          {formError}
        </div>
      ) : null}
      {formSuccess ? (
        <div role="status" className={styles.error}>
          {formSuccess}
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className={AUTH_FORM_FIELDS_CLASS}>
        <div className={AUTH_FIELD_GROUP_CLASS}>
          <Label htmlFor="email" className={styles.label}>
            {tAuth("emailAddress")}
          </Label>
          <div className="relative">
            <Mail className={styles.fieldIcon} aria-hidden />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              disabled={isLoading}
              className={styles.inputWithIcon}
              {...register("email")}
            />
          </div>
          {errors.email ? (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          ) : null}
        </div>

        <Button
          type="submit"
          className={styles.primaryButton}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
          ) : null}
          {isLoading ? tAuth("sendingResetLink") : tAuth("sendResetLink")}
        </Button>
      </form>

      <Button asChild variant="ghost" className="justify-start px-0">
        <Link href={backHref} className={styles.link}>
          <ArrowLeft className="mr-2 size-4" aria-hidden />
          {tAuth("backToSignIn")}
        </Link>
      </Button>
    </div>
  );
}
