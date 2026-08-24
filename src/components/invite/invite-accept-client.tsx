"use client";



import { useCallback, useEffect, useRef, useState } from "react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import { Loader2, Mail } from "lucide-react";

import { toast } from "sonner";



import { Google } from "@/components/icons";

import { Button } from "@/components/ui/button";

import {

  Card,

  CardContent,

  CardDescription,

  CardHeader,

  CardTitle,

} from "@/components/ui/card";

import { useFirebaseAuth } from "@/context/firebase-auth-context";

import { buildInviteAuthHref } from "@/lib/auth/auth-flow";

import { setAuthSession } from "@/lib/auth/set-auth-session";

import { getFirebaseAuthErrorMessage } from "@/lib/firebase-auth-errors";

import { firebaseAuth, signInWithGoogle } from "@/lib/firebase-auth-service";



type InvitePreview = {

  status: string;

  role: string;

  email?: string;

};



export function InviteAcceptClient({ token }: { token: string }) {

  const router = useRouter();

  const { authUser, loading: authLoading, refreshProfile } = useFirebaseAuth();

  const [preview, setPreview] = useState<InvitePreview | null>(null);

  const [loading, setLoading] = useState(true);

  const [accepting, setAccepting] = useState(false);

  const [googleLoading, setGoogleLoading] = useState(false);

  const acceptAttemptedRef = useRef(false);



  useEffect(() => {

    void fetch(`/api/invitations/${encodeURIComponent(token)}`)

      .then(async (res) => {

        if (!res.ok) throw new Error("Invitation not found");

        return res.json() as Promise<InvitePreview>;

      })

      .then(setPreview)

      .catch(() => setPreview(null))

      .finally(() => setLoading(false));

  }, [token]);



  const acceptInvitation = useCallback(async () => {

    const user = firebaseAuth.currentUser;

    if (!user) return false;



    setAccepting(true);

    try {

      const idToken = await user.getIdToken();

      const response = await fetch("/api/invitations/accept", {

        method: "POST",

        headers: {

          Authorization: `Bearer ${idToken}`,

          "Content-Type": "application/json",

        },

        body: JSON.stringify({ token }),

      });



      if (!response.ok) {

        const body = (await response.json().catch(() => ({}))) as {

          error?: string;

        };

        throw new Error(body.error ?? "Failed to accept invitation");

      }



      toast.success("Welcome to your church team!");

      const profile = await refreshProfile();

      if (profile) {

        setAuthSession(true, { role: profile.role, profile });

      }

      router.replace("/dashboard");

      return true;

    } catch (error) {

      toast.error(

        error instanceof Error ? error.message : "Failed to accept invitation"

      );

      return false;

    } finally {

      setAccepting(false);

    }

  }, [token, refreshProfile, router]);



  useEffect(() => {

    if (

      loading ||

      authLoading ||

      !preview ||

      preview.status !== "pending" ||

      !authUser ||

      acceptAttemptedRef.current

    ) {

      return;

    }



    acceptAttemptedRef.current = true;

    void acceptInvitation();

  }, [loading, authLoading, preview, authUser, acceptInvitation]);



  async function handleGoogleContinue() {

    setGoogleLoading(true);

    try {

      const googleResult = await signInWithGoogle();

      if ("redirected" in googleResult) return;

      const { profile } = googleResult;

      setAuthSession(true, { role: profile.role, profile });

      acceptAttemptedRef.current = false;

    } catch (error) {

      toast.error(getFirebaseAuthErrorMessage(error));

    } finally {

      setGoogleLoading(false);

    }

  }



  if (loading || authLoading) {

    return (

      <div className="flex min-h-[60vh] items-center justify-center">

        <Loader2 className="size-8 animate-spin text-muted-foreground" />

      </div>

    );

  }



  if (!preview || preview.status !== "pending") {

    return (

      <Card className="mx-auto max-w-md">

        <CardHeader>

          <CardTitle>Invitation unavailable</CardTitle>

          <CardDescription>

            This invitation is invalid, expired, or has already been used.

          </CardDescription>

        </CardHeader>

        <CardContent>

          <Button asChild>

            <Link href="/">Go home</Link>

          </Button>

        </CardContent>

      </Card>

    );

  }



  return (

    <Card className="mx-auto max-w-md">

      <CardHeader>

        <CardTitle>Church admin invitation</CardTitle>

        <CardDescription>

          You have been invited as <strong>{preview.role}</strong>. Accepting

          activates your membership immediately — no approval queue.

        </CardDescription>

      </CardHeader>

      <CardContent className="space-y-3">

        {authUser ?

          <Button

            className="w-full"

            size="lg"

            disabled={accepting}

            onClick={() => void acceptInvitation()}

          >

            {accepting ?

              <>

                <Loader2 className="mr-2 size-4 animate-spin" />

                Activating membership…

              </>

            : "Accept invitation"}

          </Button>

        : <>

            <Button

              className="w-full"

              size="lg"

              disabled={googleLoading}

              onClick={() => void handleGoogleContinue()}

            >

              {googleLoading ?

                <Loader2 className="mr-2 size-4 animate-spin" />

              : <Google className="mr-2 size-4" />}

              Continue with Google

            </Button>

            <Button asChild variant="outline" className="w-full" size="lg">

              <Link href={buildInviteAuthHref(token, "/signin")}>

                <Mail className="mr-2 size-4" />

                Continue with Email

              </Link>

            </Button>

          </>

        }

      </CardContent>

    </Card>

  );

}

