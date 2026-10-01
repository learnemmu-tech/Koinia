"use client";

import { useSignUp } from "@clerk/nextjs";
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
import {
  CREATE_WORKSPACE_PATH,
  postAuthContinueHref,
} from "@/lib/auth/auth-paths";
import { completePostAuthSession } from "@/lib/auth/fetch-post-auth-destination";
import { setAuthCookie } from "@/context/firebase-auth-context";
import { buildAuthHref, sanitizeCallbackUrl } from "@/lib/callback-url";
import { getFirebaseAuthErrorMessage } from "@/lib/firebase-auth-errors";
import {
  signInWithGoogle,
  activateClerkSession,
  sessionUserFromClerk,
  bindFirebaseAuthCurrentUser,
  rememberSyncedProfile,
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

const signUpSchema = (
  tValidation: ReturnType<typeof useTranslations<"validation">>,
  requireConfirmPassword: boolean
) => {
  const base = z.object({
    firstName: z.string().min(1, tValidation("firstNameRequired")),
    lastName: z.string().min(1, tValidation("lastNameRequired")),
    email: z
      .string()
      .min(1, tValidation("emailRequired"))
      .email(tValidation("invalidEmail")),
    password: z
      .string()
      .min(1, tValidation("passwordRequired"))
      .min(8, tValidation("passwordMinLength")),
    confirmPassword: z.string().optional(),
  });

  if (!requireConfirmPassword) return base;

  return base.superRefine((data, ctx) => {
    if (!data.confirmPassword?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: tValidation("passwordRequired"),
        path: ["confirmPassword"],
      });
      return;
    }
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: tValidation("passwordsDoNotMatch"),
        path: ["confirmPassword"],
      });
    }
  });
};

type SignUpValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword?: string;
};

type FirebaseSignUpFormProps = React.HTMLAttributes<HTMLDivElement> & {
  callbackUrl?: string;
  hideIntro?: boolean;
  appearance?: AuthFormAppearance;
  inlineErrors?: boolean;
  showConfirmPassword?: boolean;
  signInHref?: string;
};

function isSignUpEmailVerificationPending(
  signUp: ReturnType<typeof useSignUp>["signUp"]
) {
  return (
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0
  );
}

export function FirebaseSignUpForm({
  className,
  callbackUrl = CREATE_WORKSPACE_PATH,
  hideIntro = false,
  appearance = "default",
  inlineErrors = false,
  showConfirmPassword = false,
  signInHref,
  ...props
}: FirebaseSignUpFormProps) {
  const tAuth = useTranslations("auth");
  const tValidation = useTranslations("validation");
  const tCommon = useTranslations("common");
  const styles = authFormStyles(appearance);
  const signUpSchemaMemo = useMemo(
    () => signUpSchema(tValidation, showConfirmPassword),
    [tValidation, showConfirmPassword]
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [verificationCode, setVerificationCode] = React.useState("");
  const [verificationEmail, setVerificationEmail] = React.useState("");
  const [verificationError, setVerificationError] = React.useState<string | null>(
    null
  );
  const profileDetailsRef = React.useRef<{ firstName: string; lastName: string }>(
    { firstName: "", lastName: "" }
  );
  const redirectTo = sanitizeCallbackUrl(callbackUrl, CREATE_WORKSPACE_PATH);
  const { signUp, fetchStatus } = useSignUp();
  const [isCompletingAuth, setIsCompletingAuth] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchemaMemo),
  });

  const isDisabled = isLoading || isGoogleLoading || fetchStatus === "fetching";
  const showVerificationStep =
    Boolean(verificationEmail) || isSignUpEmailVerificationPending(signUp);

  async function completeSignUpSession() {
    setIsCompletingAuth(true);

    const { error: finalizeError } = await signUp.finalize();
    if (finalizeError) {
      if (signUp.createdSessionId) {
        await activateClerkSession(signUp.createdSessionId);
      } else {
        setIsCompletingAuth(false);
        throw finalizeError;
      }
    }

    const sessionUser = sessionUserFromClerk();
    if (sessionUser) {
      bindFirebaseAuthCurrentUser(sessionUser);
    }

    toast.success(tAuth("accountCreated"));
    try {
      const { profile, destination } = await completePostAuthSession({
        firstName: profileDetailsRef.current.firstName,
        lastName: profileDetailsRef.current.lastName,
        callbackUrl: redirectTo,
      });
      rememberSyncedProfile(profile);
      setAuthCookie(true, { role: profile.role, profile });
      navigateAfterAuth(destination);
    } catch {
      navigateAfterAuth(postAuthContinueHref(redirectTo));
    }
  }

  async function onSubmit(data: SignUpValues) {
    setIsLoading(true);
    setVerificationError(null);
    setFormError(null);
    profileDetailsRef.current = {
      firstName: data.firstName,
      lastName: data.lastName,
    };

    try {
      const { error } = await signUp.password({
        emailAddress: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      if (error) {
        throw error;
      }

      if (signUp.status === "complete") {
        await completeSignUpSession();
        return;
      }

      const sendResult = await signUp.verifications.sendEmailCode();
      if (sendResult.error) {
        throw sendResult.error;
      }

      setVerificationEmail(data.email);
      toast.success(tAuth("verificationCodeSentToToast", { email: data.email }));
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
      const { error } = await signUp.verifications.verifyEmailCode({
        code: verificationCode,
      });
      if (error) {
        throw error;
      }

      await completeSignUpSession();
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
      const { error } = await signUp.verifications.sendEmailCode();
      if (error) {
        throw error;
      }
      toast.success(tAuth("verificationCodeSent"));
    } catch (error) {
      toast.error(getFirebaseAuthErrorMessage(error));
    } finally {
      setIsResending(false);
    }
  }

  function handleBackToSignUp() {
    setVerificationCode("");
    setVerificationEmail("");
    setVerificationError(null);
    void signUp.reset();
  }

  async function handleGoogleSignUp() {
    setIsGoogleLoading(true);
    setFormError(null);
    try {
      const googleResult = await signInWithGoogle({
        redirectUrlComplete: redirectTo,
      });
      if ("redirected" in googleResult) return;

      toast.success(tAuth("signedUpGoogle"));
      navigateAfterAuth(postAuthContinueHref(redirectTo));
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
        email={verificationEmail || signUp.emailAddress || ""}
        code={verificationCode}
        onCodeChange={setVerificationCode}
        onVerify={handleVerifyCode}
        onResend={() => void handleResendCode()}
        onBack={handleBackToSignUp}
        isLoading={isLoading}
        isResending={isResending}
        errorMessage={verificationError}
        title={tAuth("verifyEmailTitle")}
        description={tAuth("verificationCodeSentTo", {
          email: verificationEmail || signUp.emailAddress || "",
        })}
        {...props}
      />
    );
  }

  return (
    <div className={cn(AUTH_FORM_STACK_CLASS, className)} {...props}>
      {hideIntro ? null : (
        <div className="flex flex-col gap-2.5 text-left">
          <h1 className={styles.heading}>{tAuth("signupTitle")}</h1>
          <p className={styles.muted}>{tAuth("signupSubtitle")}</p>
        </div>
      )}

      {formError ? (
        <div role="alert" className={styles.error}>
          {formError}
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className={AUTH_FORM_FIELDS_CLASS}>
        <div id="clerk-captcha" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3">
          <div className={AUTH_FIELD_GROUP_CLASS}>
            <Label htmlFor="firstName" className={styles.label}>
              {tAuth("firstName")}
            </Label>
            <Input
              id="firstName"
              type="text"
              placeholder="John"
              autoComplete="given-name"
              disabled={isDisabled}
              className={styles.input}
              {...register("firstName")}
            />
            {errors.firstName ?
              <p className="text-xs text-destructive">{errors.firstName.message}</p>
            : null}
          </div>

          <div className={AUTH_FIELD_GROUP_CLASS}>
            <Label htmlFor="lastName" className={styles.label}>
              {tAuth("lastName")}
            </Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Doe"
              autoComplete="family-name"
              disabled={isDisabled}
              className={styles.input}
              {...register("lastName")}
            />
            {errors.lastName ?
              <p className="text-xs text-destructive">{errors.lastName.message}</p>
            : null}
          </div>
        </div>

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
          <Label htmlFor="password" className={styles.label}>
            {tAuth("password")}
          </Label>
          <div className="relative">
            <Lock className={styles.fieldIcon} aria-hidden />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={tAuth("minPassword")}
              autoComplete="new-password"
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

        {showConfirmPassword ? (
          <div className={AUTH_FIELD_GROUP_CLASS}>
            <Label htmlFor="confirmPassword" className={styles.label}>
              {tAuth("confirmPassword")}
            </Label>
            <div className="relative">
              <Lock className={styles.fieldIcon} aria-hidden />
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder={tAuth("confirmPassword")}
                autoComplete="new-password"
                disabled={isDisabled}
                className={cn(styles.inputWithIcon, "pr-11")}
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className={styles.passwordToggle}
                aria-label={showConfirm ? tAuth("hidePassword") : tAuth("showPassword")}
              >
                {showConfirm ?
                  <EyeOff className="size-4" aria-hidden />
                : <Eye className="size-4" aria-hidden />}
              </button>
            </div>
            {errors.confirmPassword ?
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            : null}
          </div>
        ) : null}

        <Button
          type="submit"
          className={styles.primaryButton}
          disabled={isDisabled}
        >
          <span className={AUTH_PRIMARY_LABEL_CLASS}>
            {isLoading ?
              <Loader2 className="size-4 animate-spin" aria-hidden />
            : null}
            {isLoading ? tAuth("creatingAccount") : tAuth("createAccount")}
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
        <span className={styles.divider}>
          {appearance === "heritage" ? tAuth("orContinueWith") : tAuth("orJoinWith")}
        </span>
      </div>

      <Button
        variant="outline"
        className={styles.googleButton}
        onClick={handleGoogleSignUp}
        disabled={isDisabled}
        type="button"
      >
        {isGoogleLoading ?
          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
        : <Google className="mr-2 size-4" aria-hidden />}
        {appearance === "heritage"
          ? tAuth("continueWithGoogle")
          : tAuth("signUpWithGoogle")}
      </Button>

      <p className={cn("text-center text-sm leading-snug", styles.muted)}>
        {tAuth("hasAccount")}{" "}
        <Link
          href={signInHref ?? buildAuthHref("/signin", redirectTo)}
          className={styles.link}
        >
          {tCommon("signIn")}
        </Link>
      </p>
    </div>
  );
}
