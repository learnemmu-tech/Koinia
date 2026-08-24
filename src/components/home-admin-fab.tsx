"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/context/firebase-auth-context";

export function HomeAdminFab() {
  const { isAdmin, loading } = useFirebaseAuth();

  if (loading || !isAdmin) {
    return null;
  }

  return (
    <div className="">
     
    </div>
  );
}
