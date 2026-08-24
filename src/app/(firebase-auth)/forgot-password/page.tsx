"use client";

import React from "react";
import Link from "next/link";
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

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordValues) {
    setIsLoading(true);
    try {
      await resetPassword(data.email);
      toast.success("Password reset email sent. Check your inbox.");
    } catch (error) {
      toast.error(getFirebaseAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center md:text-left">
        <h1 className="text-2xl font-bold tracking-tight">Forgot password</h1>
        <p className="text-sm text-zinc-400">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            autoComplete="email"
            disabled={isLoading}
            className="border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-500"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-white font-semibold text-zinc-950 hover:bg-zinc-200"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
          Send reset link
        </Button>
      </form>

      <Button
        asChild
        variant="ghost"
        className="text-zinc-400 hover:text-white"
      >
        <Link href="/signin">
          <ArrowLeft className="mr-2 size-4" />
          Back to sign in
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
