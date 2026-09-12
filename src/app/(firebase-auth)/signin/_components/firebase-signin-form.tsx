"use client";

import { useSignIn } from "@clerk/nextjs";
import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AuthEmailVerificationStep } from "@/components/auth/auth-email-verification-step";
import { AuthLoading } from "@/components/auth/auth-loading";
import { Google } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setAuthCookie } from "@/context/firebase-auth-context";
import {
  completePostAuthSession,
  fetchPostAuthDestination,
} from "@/lib/auth/fetch-post-auth-destination";
import { buildAuthHref, sanitizeCallbackUrl } from "@/lib/callback-url";
import { getFirebaseAuthErrorMessage } from "@/lib/firebase-auth-errors";
import {
  signInWithGoogle,
  activateClerkSession,
  rememberSyncedProfile,
} from "@/lib/firebase-auth-service";
import { cn } from "@/lib/utils";

import {
  AUTH_DIVIDER_LABEL_CLASS,
  AUTH_FIELD_GROUP_CLASS,
  AUTH_FIELD_ICON_CLASS,
  AUTH_FORM_FIELDS_CLASS,
  AUTH_FORM_STACK_CLASS,
  AUTH_GOOGLE_BUTTON_CLASS,
  AUTH_HEADING_CLASS,
  AUTH_INPUT_WITH_ICON_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_LINK_CLASS,
  AUTH_MUTED_TEXT_CLASS,
  AUTH_PRIMARY_ARROW_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
  AUTH_PRIMARY_LABEL_CLASS,
} from "../../_components/auth-form-styles";

const signInSchema = (tValidation: ReturnType<typeof useTranslations<"validation">>) =>
  z.object({
    email: z
      .string()
      .min(1, tValidation("emailRequired"))
      .email(tValidation("invalidEmail")),
    password: z.string().min(1, tValidation("passwordRequired")),
  });

type SignInValues = {
  email: string;
  password: string;
};

type FirebaseSignInFormProps = React.HTMLAttributes<HTMLDivElement> & {
  callbackUrl?: string;
};

export function FirebaseSignInForm({
  className,
  callbackUrl = "/",
  ...props
}: FirebaseSignInFormProps) {
  const tAuth = useTranslations("auth");
  const tValidation = useTranslations("validation");
  const tCommon = useTranslations("common");
  const signInSchemaMemo = useMemo(
    () => signInSchema(tValidation),
    [tValidation]
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [verificationCode, setVerificationCode] = React.useState("");
  const [verificationEmail, setVerificationEmail] = React.useState("");
  const [verificationError, setVerificationError] = React.useState<string | null>(
    null
  );
  const router = useRouter();
  const redirectTo = sanitizeCallbackUrl(callbackUrl);
  const { signIn, fetchStatus } = useSignIn();
  const [isCompletingAuth, setIsCompletingAuth] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchemaMemo),
  });

  const isDisabled = isLoading || isGoogleLoading || fetchStatus === "fetching";
  const showVerificationStep =
    Boolean(verificationEmail) ||
    signIn.status === "needs_client_trust" ||
    signIn.status === "needs_second_factor";

  async function completeSignInSession() {
    setIsCompletingAuth(true);

    const { error: finalizeError } = await signIn.finalize();
    if (finalizeError) {
      if (signIn.createdSessionId) {
        await activateClerkSession(signIn.createdSessionId);
      } else {
        setIsCompletingAuth(false);
        throw finalizeError;
      }
    }

    const { profile, destination } = await completePostAuthSession({
      callbackUrl: redirectTo,
    });
    rememberSyncedProfile(profile);
    setAuthCookie(true, { role: profile.role, profile });
    toast.success(tAuth("signedInSuccess"));
    router.replace(destination);
  }

  async function sendSignInVerificationCode() {
    if (signIn.status === "needs_second_factor") {
      const emailCodeFactor = signIn.supportedSecondFactors?.find(
        (factor) => factor.strategy === "email_code"
      );
      if (!emailCodeFactor) {
        throw new Error("Additional verification is required to sign in.");
      }
      const { error } = await signIn.mfa.sendEmailCode();
      if (error) {
        throw error;
      }
      return;
    }

    const { error } = await signIn.mfa.sendEmailCode();
    if (error) {
      throw error;
    }
  }

  async function onSubmit(data: SignInValues) {
    setIsLoading(true);
    setVerificationError(null);

    try {
      const { error } = await signIn.password({
        emailAddress: data.email,
        password: data.password,
      });
      if (error) {
        throw error;
      }

      if (signIn.status === "complete") {
        await completeSignInSession();
        return;
      }

      if (
        signIn.status === "needs_client_trust" ||
        signIn.status === "needs_second_factor"
      ) {
        await sendSignInVerificationCode();
        setVerificationEmail(data.email);
        toast.success(tAuth("verificationCodeSentToToast", { email: data.email }));
        return;
      }

      throw new Error("Additional verification is required to sign in.");
    } catch (error) {
      toast.error(getFirebaseAuthErrorMessage(error));
      setIsCompletingAuth(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyCode(event: React.FormEvent) {
    event.preventDefault();
    if (verificationCode.length !== 6) {
      setVerificationError(tAuth("verificationCodeHint"));
      return;
    }

    setIsLoading(true);
    setVerificationError(null);

    try {
      const { error } = await signIn.mfa.verifyEmailCode({
        code: verificationCode,
      });
      if (error) {
        throw error;
      }

      await completeSignInSession();
    } catch (error) {
      const message = getFirebaseAuthErrorMessage(error);
      setVerificationError(message);
      toast.error(message);
      setIsCompletingAuth(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendCode() {
    setIsResending(true);
    setVerificationError(null);

    try {
      await sendSignInVerificationCode();
      toast.success(tAuth("verificationCodeSent"));
    } catch (error) {
      toast.error(getFirebaseAuthErrorMessage(error));
    } finally {
      setIsResending(false);
    }
  }

  function handleBackToSignIn() {
    setVerificationCode("");
    setVerificationEmail("");
    setVerificationError(null);
    void signIn.reset();
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    try {
      const googleResult = await signInWithGoogle({
        redirectUrlComplete: redirectTo,
      });
      if ("redirected" in googleResult) return;

      const { profile } = googleResult;
      setAuthCookie(true, { role: profile.role, profile });
      toast.success(tAuth("signedInGoogle"));
      router.push(await fetchPostAuthDestination(redirectTo));
    } catch (error) {
      toast.error(getFirebaseAuthErrorMessage(error));
    } finally {
      setIsGoogleLoading(false);
    }
  }

  if (isCompletingAuth) {
    return <AuthLoading />;
  }

  if (showVerificationStep) {
    return (
      <AuthEmailVerificationStep
        className={className}
        email={verificationEmail}
        code={verificationCode}
        onCodeChange={setVerificationCode}
        onVerify={handleVerifyCode}
        onResend={() => void handleResendCode()}
        onBack={handleBackToSignIn}
        isLoading={isLoading}
        isResending={isResending}
        errorMessage={verificationError}
        title={tAuth("verifyEmailTitle")}
        description={tAuth("verificationCodeSentTo", { email: verificationEmail })}
        {...props}
      />
    );
  }

  return (
    <div className={cn(AUTH_FORM_STACK_CLASS, className)} {...props}>
      <div className="flex flex-col gap-2.5 text-left">
        <h1 className={AUTH_HEADING_CLASS}>{tAuth("loginTitle")}</h1>
        <p className={AUTH_MUTED_TEXT_CLASS}>{tAuth("loginSubtitle")}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={AUTH_FORM_FIELDS_CLASS}>
        <div className={AUTH_FIELD_GROUP_CLASS}>
          <Label htmlFor="email" className={AUTH_LABEL_CLASS}>
            {tAuth("email")}
          </Label>
          <div className="relative">
            <Mail className={AUTH_FIELD_ICON_CLASS} aria-hidden />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              disabled={isDisabled}
              className={AUTH_INPUT_WITH_ICON_CLASS}
              {...register("email")}
            />
          </div>
          {errors.email ?
            <p className="text-sm text-destructive">{errors.email.message}</p>
          : null}
        </div>

        <div className={AUTH_FIELD_GROUP_CLASS}>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password" className={AUTH_LABEL_CLASS}>
              {tAuth("password")}
            </Label>
            <Link href="/forgot-password" className={AUTH_LINK_CLASS}>
              {tAuth("forgotPassword")}
            </Link>
          </div>
          <div className="relative">
            <Lock className={AUTH_FIELD_ICON_CLASS} aria-hidden />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={tAuth("enterPassword")}
              autoComplete="current-password"
              disabled={isDisabled}
              className={cn(AUTH_INPUT_WITH_ICON_CLASS, "pr-11")}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-1 my-auto flex size-9 items-center justify-center rounded-md text-[#6B7280] transition-colors hover:text-[#1C2B3A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C0623A]/35"
              aria-label={showPassword ? tAuth("hidePassword") : tAuth("showPassword")}
            >
              {showPassword ?
                <EyeOff className="size-4" aria-hidden />
              : <Eye className="size-4" aria-hidden />}
            </button>
          </div>
          {errors.password ?
            <p className="text-sm text-destructive">{errors.password.message}</p>
          : null}
        </div>

        <Button
          type="submit"
          className={AUTH_PRIMARY_BUTTON_CLASS}
          disabled={isDisabled}
        >
          <span className={AUTH_PRIMARY_LABEL_CLASS}>
            {isLoading ?
              <Loader2 className="size-4 animate-spin" aria-hidden />
            : null}
            {tAuth("login")}
          </span>
          <ArrowRight className={AUTH_PRIMARY_ARROW_CLASS} aria-hidden />
        </Button>
      </form>

      <div className="relative text-center text-sm">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[#E2D9CC]" />
        </div>
        <span className={AUTH_DIVIDER_LABEL_CLASS}>{tAuth("orContinueWith")}</span>
      </div>

      <Button
        variant="outline"
        className={AUTH_GOOGLE_BUTTON_CLASS}
        onClick={handleGoogleSignIn}
        disabled={isDisabled}
        type="button"
      >
        {isGoogleLoading ?
          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
        : <Google className="mr-2 size-4" aria-hidden />}
        {tAuth("signInWithGoogle")}
      </Button>

      <p className={cn("text-center text-sm leading-snug", AUTH_MUTED_TEXT_CLASS)}>
        {tAuth("noAccount")}{" "}
        <Link
          href={buildAuthHref("/signup", redirectTo)}
          className={AUTH_LINK_CLASS}
        >
          {tCommon("signUp")}
        </Link>
      </p>
    </div>
  );
}
