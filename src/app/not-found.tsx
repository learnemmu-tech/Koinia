import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Page Not Found | ${siteConfig.name}`,
  description: "The page you are looking for could not be found.",
};

const NotFound = () => {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Image
        src={siteConfig.image}
        alt={siteConfig.name}
        width={180}
        height={54}
        className="mb-6 h-auto w-[160px] object-contain sm:w-[180px]"
      />

      <h1 className="mb-3 text-4xl font-bold">
        Page Not Found
      </h1>

      <p className="mb-6 text-muted-foreground text-lg">
        Sorry, the page you are looking for could not be found.
      </p>

      <div className="mb-8 max-w-2xl">
        <p className="text-xl italic">
          &ldquo;The Lord is my shepherd; I shall not want.&rdquo;
        </p>
        <p className="mt-2 font-semibold">
          Psalm 23:1
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/"
          className="rounded-lg bg-primary px-5 py-2 text-primary-foreground"
        >
          Back to Home
        </Link>

        <Link
          href="/"
          className="rounded-lg border px-5 py-2"
        >
          Browse Songs
        </Link>

        <Link
          href="/privacy"
          className="rounded-lg border px-5 py-2"
        >
          Privacy Policy
        </Link>
      </div>
    </section>
  );
};

export default NotFound;