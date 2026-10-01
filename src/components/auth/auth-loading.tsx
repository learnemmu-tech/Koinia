import { Loader2 } from "lucide-react";
import Image from "next/image";

import { siteConfig } from "@/config/site";

export function AuthLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Image
          src={siteConfig.icon}
          alt=""
          width={40}
          height={40}
          className="rounded-lg"
        />
        <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
        <p className="text-sm">Preparing FaithConnectHub…</p>
      </div>
    </div>
  );
}
