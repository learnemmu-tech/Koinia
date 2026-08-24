"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Google } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { setAuthCookie } from "@/context/firebase-auth-context";
import { fetchPostAuthDestination } from "@/lib/auth/fetch-post-auth-destination";
import { useContentAuthDialog } from "@/context/content-auth-dialog-context";
import { buildAuthHref } from "@/lib/callback-url";
import { getFirebaseAuthErrorMessage } from "@/lib/firebase-auth-errors";
import { signInWithGoogle } from "@/lib/firebase-auth-service";

export function ContentAuthDialogHost() {
  const router = useRouter();
  const {
    isOpen,
    callbackPath,
    redirectOnClose,
    closeDialog,
  } = useContentAuthDialog();
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

  const signInHref = buildAuthHref("/signin", callbackPath);
  const signUpHref = buildAuthHref("/signup", callbackPath);

  function handleOpenChange(open: boolean) {
    if (!open) {
      closeDialog();
      if (redirectOnClose) {
        router.push("/");
      }
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    try {
      const googleResult = await signInWithGoogle();
      if ("redirected" in googleResult) return;

      const { profile } = googleResult;
      setAuthCookie(true, { role: profile.role, profile });
      toast.success("Signed in with Google!");
      closeDialog();
      router.push(await fetchPostAuthDestination(callbackPath));
      router.refresh();
    } catch (error) {
      toast.error(getFirebaseAuthErrorMessage(error));
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md border-border/50 bg-card sm:rounded-2xl">
        <DialogHeader className="space-y-3 text-center sm:text-left">
          <DialogTitle className="font-heading text-xl font-bold">
            Sign in Required
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Please sign in to access FaithConnectHub content.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 border-border/60 bg-background"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Google className="size-4" />
            )}
            Continue with Google
          </Button>

          <Button asChild className="w-full">
            <Link href={signInHref} onClick={closeDialog}>
              Sign In
            </Link>
          </Button>

          <Button asChild variant="outline" className="w-full border-border/60">
            <Link href={signUpHref} onClick={closeDialog}>
              Create Account
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
