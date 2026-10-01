"use client";

import { useSignIn } from "@clerk/nextjs";
import React, { useMemo } from "react";
import Link from "next/link";
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
import { postAuthContinueHref } from "@/lib/auth/auth-paths";
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
  sessionUserFromClerk,
  bindFirebaseAuthCurrentUser,
  navigateAfterAuth,
} from "@/lib/firebase-auth-service";
import { cn } from "@/lib/utils";

import {
  AUTH_FIELD_GROUP_CLASS,
  AUTH_FORM_FIELDS_CLASS,
  AUTH_FORM_STACK_CLASS,
  AUTH_PRIMARY_ARROW_CLASS,
  AUTH_PRIMARY_LABEL_CLASS,
  authFormStyles,
  type AuthFormAppearance,
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
  hideIntro?: boolean;
  appearance?: AuthFormAppearance;
  inlineErrors?: boolean;
  signUpHref?: string;
  forgotPasswordHref?: string;
};

export function FirebaseSignInForm({
  className,
  callbackUrl = "/",
  hideIntro = false,
  appearance = "default",
  inlineErrors = false,
  signUpHref,
  forgotPasswordHref = "/forgot-password",
  ...props
}: FirebaseSignInFormProps) {
  const tAuth = useTranslations("auth");
  const tValidation = useTranslations("validation");
  const tCommon = useTranslations("common");
  const styles = authFormStyles(appearance);
  const signInSchemaMemo = useMemo(
    () => signInSchema(tValidation),
    [tValidation]
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [verificationCode, setVerificationCode] = React.useState("");
  const [verificationEmail, setVerificationEmail] = React.useState("");
  const [verificationError, setVerificationError] = React.useState<string | null>(
    null
  );
  const { signIn, fetchStatus } = useSignIn();
  const redirectTo = sanitizeCallbackUrl(callbackUrl);
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

    const sessionUser = sessionUserFromClerk();
    if (sessionUser) {
      bindFirebaseAuthCurrentUser(sessionUser);
    }

    toast.success(tAuth("signedInSuccess"));

    try {
      const { profile, destination } = await completePostAuthSession({
        callbackUrl: redirectTo,
      });
      rememberSyncedProfile(profile);
      setAuthCookie(true, { role: profile.role, profile });
      navigateAfterAuth(destination);
    } catch {
      navigateAfterAuth(postAuthContinueHref(redirectTo));
    }
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
    setFormError(null);

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
      const message = getFirebaseAuthErrorMessage(error);
      setFormError(message);
      if (!inlineErrors) toast.error(message);
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
    setFormError(null);
    try {
      const googleResult = await signInWithGoogle({
        redirectUrlComplete: redirectTo,
      });
      if ("redirected" in googleResult) return;

      const { profile } = googleResult;
      setAuthCookie(true, { role: profile.role, profile });
      toast.success(tAuth("signedInGoogle"));
      navigateAfterAuth(await fetchPostAuthDestination(redirectTo));
    } catch (error) {
      const message = getFirebaseAuthErrorMessage(error);
      setFormError(message);
      if (!inlineErrors) toast.error(message);
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
      {hideIntro ? null : (
      <div className="flex flex-col gap-2.5 text-left">
        <h1 className={styles.heading}>{tAuth("loginTitle")}</h1>
        <p className={styles.muted}>{tAuth("loginSubtitle")}</p>
      </div>
      )}

      {formError ? (
        <div role="alert" className={styles.error}>
          {formError}
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
              disabled={isDisabled}
              className={styles.inputWithIcon}
              {...register("email")}
            />
          </div>
          {errors.email ?
            <p className="text-sm text-destructive">{errors.email.message}</p>
          : null}
        </div>

        <div className={AUTH_FIELD_GROUP_CLASS}>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password" className={styles.label}>
              {tAuth("password")}
            </Label>
            <Link href={forgotPasswordHref} className={styles.link}>
              {tAuth("forgotPassword")}
            </Link>
          </div>
          <div className="relative">
            <Lock className={styles.fieldIcon} aria-hidden />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={tAuth("enterPassword")}
              autoComplete="current-password"
              disabled={isDisabled}
              className={cn(styles.inputWithIcon, "pr-11")}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={styles.passwordToggle}
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
          className={styles.primaryButton}
          disabled={isDisabled}
        >
          <span className={AUTH_PRIMARY_LABEL_CLASS}>
            {isLoading ?
              <Loader2 className="size-4 animate-spin" aria-hidden />
            : null}
            {isLoading ? tAuth("signingIn") : tAuth("login")}
          </span>
          {isLoading ? null : (
            <ArrowRight className={AUTH_PRIMARY_ARROW_CLASS} aria-hidden />
          )}
        </Button>
      </form>

      <div className="relative text-center text-sm">
        <div className="absolute inset-0 flex items-center">
          <span className={styles.dividerLine} />
        </div>
        <span className={styles.divider}>{tAuth("orContinueWith")}</span>
      </div>

      <Button
        variant="outline"
        className={styles.googleButton}
        onClick={handleGoogleSignIn}
        disabled={isDisabled}
        type="button"
      >
        {isGoogleLoading ?
          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
        : <Google className="mr-2 size-4" aria-hidden />}
        {appearance === "heritage"
          ? tAuth("continueWithGoogle")
          : tAuth("signInWithGoogle")}
      </Button>

      <p className={cn("text-center text-sm leading-snug", styles.muted)}>
        {tAuth("noAccount")}{" "}
        <Link
          href={signUpHref ?? buildAuthHref("/signup", redirectTo)}
          className={styles.link}
        >
          {appearance === "heritage" ? tAuth("createOne") : tCommon("signUp")}
        </Link>
      </p>
    </div>
  );
}
