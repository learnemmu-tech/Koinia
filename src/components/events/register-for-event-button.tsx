"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Ticket } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { hasRegisteredForEvent } from "@/lib/event-registration-actions";
import { cn } from "@/lib/utils";

type RegisterForEventButtonProps = {
  eventId: string;
  eventTitle: string;
  className?: string;
  /** Prefer primary CTA styling on Event Detail. */
  priority?: boolean;
};

export function RegisterForEventButton({
  eventId,
  eventTitle,
  className,
  priority = false,
}: RegisterForEventButtonProps) {
  const { authUser, profile, loading, user } = useFirebaseAuth();
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(false);

  useEffect(() => {
    if (!user?.uid || !eventId) {
      setCheckingRegistration(false);
      return;
    }

    let cancelled = false;
    setCheckingRegistration(true);

    async function loadExistingRegistration() {
      try {
        const exists = await hasRegisteredForEvent(eventId, user!.uid);
        if (!cancelled && exists) {
          setRegistered(true);
        }
      } catch {
        // Ignore lookup errors — user can still attempt registration.
      } finally {
        if (!cancelled) {
          setCheckingRegistration(false);
        }
      }
    }

    void loadExistingRegistration();

    return () => {
      cancelled = true;
    };
  }, [user?.uid, eventId]);

  async function handleRegister() {
    if (!user) return;

    setRegistering(true);
    try {
      const token = await user.getIdToken();
      const userName =
        profile ?
          `${profile.firstName} ${profile.lastName}`.trim()
        : authUser?.displayName?.trim();

      const response = await fetch("/api/events/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ eventId, userName }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
        error?: string;
        alreadyRegistered?: boolean;
      };

      if (!response.ok) {
        toast.error(data.error ?? "Unable to register. Please try again.");
        return;
      }

      setRegistered(true);
      toast.success(
        data.message ??
          `You're registered for ${eventTitle}. Check your email for details.`
      );
    } catch {
      toast.error("Unable to register. Please try again.");
    } finally {
      setRegistering(false);
    }
  }

  if (loading || checkingRegistration) {
    return (
      <Button
        variant={priority ? "default" : "outline"}
        size="sm"
        className={cn("rounded-full", className)}
        disabled
      >
        <Loader2 className="mr-2 size-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (!authUser) {
    return (
      <Button
        asChild
        variant={priority ? "default" : "outline"}
        size="sm"
        className={cn("rounded-full", className)}
      >
        <Link href={`/signin?callbackUrl=/events/${eventId}`}>
          <Ticket className="mr-2 size-4" />
          Sign in to Register
        </Link>
      </Button>
    );
  }

  if (registered) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "rounded-full border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
          className
        )}
        disabled
      >
        <CheckCircle2 className="mr-2 size-4" />
        Registered
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={priority ? "default" : "outline"}
      size="sm"
      className={cn("rounded-full", className)}
      disabled={registering}
      onClick={handleRegister}
    >
      {registering ?
        <>
          <Loader2 className="mr-2 size-4 animate-spin" />
          Registering...
        </>
      : <>
          <Ticket className="mr-2 size-4" />
          Register for Event
        </>
      }
    </Button>
  );
}
