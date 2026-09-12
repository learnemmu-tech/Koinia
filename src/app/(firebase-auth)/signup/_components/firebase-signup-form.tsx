"use client";

import { useSignUp } from "@clerk/nextjs";
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
import { CREATE_WORKSPACE_PATH } from "@/lib/auth/auth-paths";
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
  AUTH_INPUT_CLASS,
  AUTH_INPUT_WITH_ICON_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_LINK_CLASS,
  AUTH_MUTED_TEXT_CLASS,
  AUTH_PRIMARY_ARROW_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
  AUTH_PRIMARY_LABEL_CLASS,
} from "../../_components/auth-form-styles";

const signUpSchema = (tValidation: ReturnType<typeof useTranslations<"validation">>) =>
  z.object({
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
  });

type SignUpValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

type FirebaseSignUpFormProps = React.HTMLAttributes<HTMLDivElement> & {
  callbackUrl?: string;
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
  ...props
}: FirebaseSignUpFormProps) {
  const tAuth = useTranslations("auth");
  const tValidation = useTranslations("validation");
  const tCommon = useTranslations("common");
  const signUpSchemaMemo = useMemo(
    () => signUpSchema(tValidation),
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
  const profileDetailsRef = React.useRef<{ firstName: string; lastName: string }>(
    { firstName: "", lastName: "" }
  );
  const router = useRouter();
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

    const { profile, destination } = await completePostAuthSession({
      ...profileDetailsRef.current,
      callbackUrl: redirectTo,
    });
    rememberSyncedProfile(profile);
    setAuthCookie(true, { role: profile.role, profile });
    toast.success(tAuth("accountCreated"));
    router.replace(destination);
  }

  async function onSubmit(data: SignUpValues) {
    setIsLoading(true);
    setVerificationError(null);
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
    try {
      const googleResult = await signInWithGoogle({
        redirectUrlComplete: redirectTo,
      });
      if ("redirected" in googleResult) return;

      const { profile } = googleResult;
      setAuthCookie(true, { role: profile.role, profile });
      toast.success(tAuth("signedUpGoogle"));
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
      <div className="flex flex-col gap-2.5 text-left">
        <h1 className={AUTH_HEADING_CLASS}>{tAuth("signupTitle")}</h1>
        <p className={AUTH_MUTED_TEXT_CLASS}>{tAuth("signupSubtitle")}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={AUTH_FORM_FIELDS_CLASS}>
        <div id="clerk-captcha" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3">
          <div className={AUTH_FIELD_GROUP_CLASS}>
            <Label htmlFor="firstName" className={AUTH_LABEL_CLASS}>
              {tAuth("firstName")}
            </Label>
            <Input
              id="firstName"
              type="text"
              placeholder="John"
              autoComplete="given-name"
              disabled={isDisabled}
              className={AUTH_INPUT_CLASS}
              {...register("firstName")}
            />
            {errors.firstName ?
              <p className="text-xs text-destructive">{errors.firstName.message}</p>
            : null}
          </div>

          <div className={AUTH_FIELD_GROUP_CLASS}>
            <Label htmlFor="lastName" className={AUTH_LABEL_CLASS}>
              {tAuth("lastName")}
            </Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Doe"
              autoComplete="family-name"
              disabled={isDisabled}
              className={AUTH_INPUT_CLASS}
              {...register("lastName")}
            />
            {errors.lastName ?
              <p className="text-xs text-destructive">{errors.lastName.message}</p>
            : null}
          </div>
        </div>

        <div className={AUTH_FIELD_GROUP_CLASS}>
          <Label htmlFor="email" className={AUTH_LABEL_CLASS}>
            {tAuth("emailAddress")}
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
          <Label htmlFor="password" className={AUTH_LABEL_CLASS}>
            {tAuth("password")}
          </Label>
          <div className="relative">
            <Lock className={AUTH_FIELD_ICON_CLASS} aria-hidden />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={tAuth("minPassword")}
              autoComplete="new-password"
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
            {tAuth("createAccount")}
          </span>
          <ArrowRight className={AUTH_PRIMARY_ARROW_CLASS} aria-hidden />
        </Button>
      </form>

      <div className="relative text-center text-sm">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[#E2D9CC]" />
        </div>
        <span className={AUTH_DIVIDER_LABEL_CLASS}>{tAuth("orJoinWith")}</span>
      </div>

      <Button
        variant="outline"
        className={AUTH_GOOGLE_BUTTON_CLASS}
        onClick={handleGoogleSignUp}
        disabled={isDisabled}
        type="button"
      >
        {isGoogleLoading ?
          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
        : <Google className="mr-2 size-4" aria-hidden />}
        {tAuth("signUpWithGoogle")}
      </Button>

      <p className={cn("text-center text-sm leading-snug", AUTH_MUTED_TEXT_CLASS)}>
        {tAuth("hasAccount")}{" "}
        <Link
          href={buildAuthHref("/signin", redirectTo)}
          className={AUTH_LINK_CLASS}
        >
          {tCommon("signIn")}
        </Link>
      </p>
    </div>
  );
}
