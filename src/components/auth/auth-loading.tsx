import { Loader2 } from "lucide-react";

export function AuthLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
        <p className="text-sm">Preparing FaithConnectHub…</p>
      </div>
    </div>
  );
}
