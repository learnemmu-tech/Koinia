"use client";

import { useSignUp } from "@clerk/nextjs";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

type SignUpValues = z.infer<typeof signUpSchema>;

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
    resolver: zodResolver(signUpSchema),
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
    toast.success("Account created successfully!");
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
      toast.success(`We sent a verification code to ${data.email}.`);
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
      setVerificationError("Enter the 6-digit verification code.");
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
      toast.success("Verification code sent.");
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
      toast.success("Signed up with Google!");
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
        {...props}
      />
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col gap-2 text-center md:text-left">
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Join the {siteConfig.name} community
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <div id="clerk-captcha" />
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="firstName">First name</Label>
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
            <Label htmlFor="lastName">Last name</Label>
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
          <Label htmlFor="email">Email address</Label>
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
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 characters"
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
              aria-label={showPassword ? "Hide password" : "Show password"}
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
          Create Account
        </Button>
      </form>

      <div className="relative text-center text-sm">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <span className="relative bg-background px-2 text-xs uppercase tracking-wider text-muted-foreground">
          Or join with
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
        Sign up with Google
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={buildAuthHref("/signin", redirectTo)}
          className="text-foreground underline underline-offset-4 hover:text-primary"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
