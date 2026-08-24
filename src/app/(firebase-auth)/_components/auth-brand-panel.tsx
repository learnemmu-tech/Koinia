import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";

export function AuthBrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-zinc-950 lg:block">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-zinc-950 to-zinc-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />

      <div className="relative flex h-full flex-col items-center justify-center gap-10 p-10 text-center">
        <Image
          src={siteConfig.image}
          alt={siteConfig.name}
          width={240}
          height={240}
          className="h-auto w-full max-w-[220px] object-contain drop-shadow-2xl"
          priority
        />

        <div className="max-w-md space-y-4">
          <h2 className="font-heading text-4xl font-bold tracking-tight text-white">
            {siteConfig.name}
          </h2>
          <p className="text-lg text-zinc-400">{siteConfig.description}</p>
          <blockquote className="border-l-2 border-primary/50 pl-4 text-left text-sm italic text-zinc-500">
            &ldquo;{siteConfig.ministry.title}&rdquo;
            <footer className="mt-2 not-italic text-xs text-zinc-600">
              — {siteConfig.ministry.author}
            </footer>
          </blockquote>
        </div>

        <div className="grid w-full max-w-sm grid-cols-3 gap-4 text-center">
          {[
            { label: "Worship Songs", value: "100+" },
            { label: "Languages", value: "2+" },
            { label: "Community", value: "Growing" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-4 backdrop-blur-sm"
            >
              <p className="font-heading text-xl font-bold text-white">
                {stat.value}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AuthLogo() {
  return (
    <Link href="/" className="flex items-center">
      <Image
        src={siteConfig.image}
        alt={siteConfig.name}
        width={140}
        height={40}
        className="h-8 w-auto object-contain"
        priority
      />
    </Link>
  );
}
