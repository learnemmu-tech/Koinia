"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const authInputClass =
  "h-9 py-1.5 text-sm border-input bg-background text-foreground placeholder:text-muted-foreground";

type AuthEmailVerificationStepProps = {
  email: string;
  code: string;
  onCodeChange: (code: string) => void;
  onVerify: (event: React.FormEvent) => void;
  onResend: () => void;
  onBack?: () => void;
  isLoading?: boolean;
  isResending?: boolean;
  errorMessage?: string | null;
  title?: string;
  description?: string;
  className?: string;
};

export function AuthEmailVerificationStep({
  email,
  code,
  onCodeChange,
  onVerify,
  onResend,
  onBack,
  isLoading = false,
  isResending = false,
  errorMessage,
  title = "Verify your email",
  description,
  className,
}: AuthEmailVerificationStepProps) {
  const isDisabled = isLoading || isResending;

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-2 text-center md:text-left">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">
          {description ??
            `Enter the 6-digit code sent to ${email}.`}
        </p>
      </div>

      <form onSubmit={onVerify} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="verification-code">Verification code</Label>
          <Input
            id="verification-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(event) =>
              onCodeChange(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            disabled={isDisabled}
            className={cn(authInputClass, "tracking-[0.3em]")}
          />
          {errorMessage ?
            <p className="text-sm text-destructive">{errorMessage}</p>
          : null}
        </div>

        <Button type="submit" className="w-full font-semibold" disabled={isDisabled}>
          {isLoading ?
            <Loader2 className="mr-2 size-4 animate-spin" />
          : null}
          Verify email
        </Button>
      </form>

      <div className="flex flex-col gap-2 text-center text-sm">
        <Button
          type="button"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
          disabled={isDisabled}
          onClick={onResend}
        >
          {isResending ?
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Sending code…
            </>
          : "Resend verification code"}
        </Button>
        {onBack ?
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            disabled={isDisabled}
            onClick={onBack}
          >
            Back
          </Button>
        : null}
      </div>
    </div>
  );
}
