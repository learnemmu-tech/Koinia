"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type MembershipStatusPageProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: "amber" | "red" | "muted";
};

const toneClasses = {
  amber: "bg-amber-500/10 text-amber-600",
  red: "bg-red-500/10 text-red-600",
  muted: "bg-muted text-muted-foreground",
};

export function MembershipStatusPage({
  icon: Icon,
  title,
  description,
  tone = "muted",
}: MembershipStatusPageProps) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-12 text-center">
      <div
        className={`flex size-16 items-center justify-center rounded-2xl ${toneClasses[tone]}`}
      >
        <Icon className="size-8" />
      </div>
      <h1 className="mt-6 font-heading text-2xl font-bold">{title}</h1>
      <p className="mt-4 text-muted-foreground">{description}</p>
      <Button asChild variant="outline" className="mt-8">
        <Link href="/">Go to Home</Link>
      </Button>
    </div>
  );
}
