"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Input } from "@/components/ui/input";
import { SUPER_ADMIN_BASE } from "@/lib/auth/auth-paths";

export function SuperAdminGlobalSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(
      `${SUPER_ADMIN_BASE}/search?q=${encodeURIComponent(q)}`
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search platform…"
          className="h-8 w-full pl-8 text-sm sm:w-56 lg:w-64"
          aria-label="Search organizations, churches, and users"
        />
      </div>
    </form>
  );
}
