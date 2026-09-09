"use client";

import { useSignIn } from "@clerk/nextjs";
import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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
import { fetchPostAuthDestination } from "@/lib/auth/fetch-post-auth-destination";
import { buildAuthHref, sanitizeCallbackUrl } from "@/lib/callback-url";
import { getFirebaseAuthErrorMessage } from "@/lib/firebase-auth-errors";
import {
  signInWithGoogle,
  activateClerkSession,
  syncSessionProfileAfterClerkAuth,
} from "@/lib/firebase-auth-service";
import { cn } from "@/lib/utils";

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

const authInputClass =
  "h-9 py-1.5 text-sm border-input bg-background text-foreground placeholder:text-muted-foreground";

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

    const { profile } = await syncSessionProfileAfterClerkAuth();
    setAuthCookie(true, { role: profile.role, profile });
    toast.success(tAuth("signedInSuccess"));
    router.replace(await fetchPostAuthDestination(redirectTo));
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
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col gap-2 text-center md:text-left">
        <h1 className="text-2xl font-bold tracking-tight">
          {tAuth("loginTitle")}
        </h1>
        <p className="text-sm text-zinc-400">
          {tAuth("loginSubtitle")}
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
            disabled={isDisabled}
            className={authInputClass}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{tAuth("password")}</Label>
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {tAuth("forgotPassword")}
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={tAuth("enterPassword")}
              autoComplete="current-password"
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
          {tAuth("login")}
        </Button>
      </form>

      <div className="relative text-center text-sm">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <span className="relative bg-background px-2 text-xs uppercase tracking-wider text-muted-foreground">
          {tAuth("orContinueWith")}
        </span>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={isDisabled}
        type="button"
      >
        {isGoogleLoading ?
          <Loader2 className="mr-2 size-4 animate-spin" />
        : <Google className="mr-2 size-4" />}
        {tAuth("signInWithGoogle")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {tAuth("noAccount")}{" "}
        <Link
          href={buildAuthHref("/signup", redirectTo)}
          className="text-foreground underline underline-offset-4 hover:text-primary"
        >
          {tCommon("signUp")}
        </Link>
      </p>
    </div>
  );
}
