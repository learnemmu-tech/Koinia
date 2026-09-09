"use client";

import { useSignUp } from "@clerk/nextjs";
import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { siteConfig } from "@/config/site";

import { AuthEmailVerificationStep } from "@/components/auth/auth-email-verification-step";
import { AuthLoading } from "@/components/auth/auth-loading";
import { Google } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setAuthCookie } from "@/context/firebase-auth-context";
import { CREATE_WORKSPACE_PATH } from "@/lib/auth/auth-paths";
import { fetchPostAuthDestination } from "@/lib/auth/fetch-post-auth-destination";
import { buildAuthHref, sanitizeCallbackUrl } from "@/lib/callback-url";
import { getFirebaseAuthErrorMessage } from "@/lib/firebase-auth-errors";
import {
  signInWithGoogle,
  activateClerkSession,
  syncSessionProfileAfterClerkAuth,
} from "@/lib/firebase-auth-service";
import { cn } from "@/lib/utils";

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

const authInputClass =
  "h-9 py-1.5 text-sm border-input bg-background text-foreground placeholder:text-muted-foreground";

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

    const { profile } = await syncSessionProfileAfterClerkAuth(
      profileDetailsRef.current
    );
    setAuthCookie(true, { role: profile.role, profile });
    toast.success(tAuth("accountCreated"));
    router.replace(await fetchPostAuthDestination(redirectTo));
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
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col gap-2 text-center md:text-left">
        <h1 className="text-2xl font-bold tracking-tight">{tAuth("signupTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {tAuth("signupSubtitle", { siteName: siteConfig.name })}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <div id="clerk-captcha" />
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="firstName">{tAuth("firstName")}</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="John"
              autoComplete="given-name"
              disabled={isDisabled}
              className={authInputClass}
              {...register("firstName")}
            />
            {errors.firstName && (
              <p className="text-xs text-destructive">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="lastName">{tAuth("lastName")}</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Doe"
              autoComplete="family-name"
              disabled={isDisabled}
              className={authInputClass}
              {...register("lastName")}
            />
            {errors.lastName && (
              <p className="text-xs text-destructive">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">{tAuth("emailAddress")}</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            autoComplete="email"
            disabled={isDisabled}
            className={authInputClass}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">{tAuth("password")}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={tAuth("minPassword")}
              autoComplete="new-password"
              disabled={isDisabled}
              className={cn(authInputClass, "pr-10")}
              {...register("password")}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 my-auto text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? tAuth("hidePassword") : tAuth("showPassword")}
            >
              {showPassword ?
                <EyeOff className="size-4" />
              : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full font-semibold"
          disabled={isDisabled}
        >
          {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
          {tAuth("createAccount")}
        </Button>
      </form>

      <div className="relative text-center text-sm">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <span className="relative bg-background px-2 text-xs uppercase tracking-wider text-muted-foreground">
          {tAuth("orJoinWith")}
        </span>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignUp}
        disabled={isDisabled}
        type="button"
      >
        {isGoogleLoading ?
          <Loader2 className="mr-2 size-4 animate-spin" />
        : <Google className="mr-2 size-4" />}
        {tAuth("signUpWithGoogle")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {tAuth("hasAccount")}{" "}
        <Link
          href={buildAuthHref("/signin", redirectTo)}
          className="text-foreground underline underline-offset-4 hover:text-primary"
        >
          {tCommon("signIn")}
        </Link>
      </p>
    </div>
  );
}
