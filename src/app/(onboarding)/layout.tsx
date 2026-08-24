import Image from "next/image";

import Link from "next/link";

import { siteConfig } from "@/config/site";



export default function OnboardingLayout({

  children,

}: {

  children: React.ReactNode;

}) {

  return (

    <div className="relative flex min-h-svh flex-col bg-gradient-to-b from-background via-background to-muted/30">

      <div

        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"

        aria-hidden

      />



      <header className="relative z-10 flex shrink-0 justify-center px-6 py-6 sm:py-8">

        <Link href="/" className="flex items-center gap-2.5">

          <Image

            src={siteConfig.icon}

            alt=""

            width={36}

            height={36}

            className="rounded-lg"

          />

          <span className="font-heading text-lg font-semibold tracking-tight">

            {siteConfig.name}

          </span>

        </Link>

      </header>



      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-12 sm:px-6">

        {children}

      </main>

    </div>

  );

}


