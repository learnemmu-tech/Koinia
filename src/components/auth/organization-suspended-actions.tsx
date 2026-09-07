"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/context/firebase-auth-context";

export function OrganizationSuspendedActions() {
  const { signOut } = useFirebaseAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      <Button asChild variant="outline">
        <Link href="/">Go to Home</Link>
      </Button>
      <Button
        type="button"
        variant="secondary"
        disabled={signingOut}
        onClick={() => void handleSignOut()}
      >
        {signingOut ? "Signing out…" : "Sign Out"}
      </Button>
    </div>
  );
}
