import { Loader2 } from "lucide-react";

export function AuthLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-3 text-zinc-400">
        <Loader2 className="size-8 animate-spin" />
        <p className="text-sm">Loading...</p>
      </div>
    </div>
  );
}
