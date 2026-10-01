import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { FirebaseSignUpForm } from "@/app/(firebase-auth)/signup/_components/firebase-signup-form";
import { isJoinPath } from "@/lib/auth/auth-paths";
import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { HeritageButton } from "@/templates/heritage/components/heritage-button";
import {
  heritageJoinChurchHref,
  heritageLoginHref,
} from "@/templates/heritage/lib";
import { HERITAGE_FALLBACK_IMAGES } from "@/templates/heritage/theme";

export function HeritageSignupPage({
  model,
  callbackUrl,
}: {
  model: ChurchWebsiteViewModel;
  callbackUrl: string;
}) {
  const homeHref = churchWebsitePath(model.church.slug);
  const logo = model.website.images.logo || HERITAGE_FALLBACK_IMAGES.mark;
  const signInHref = heritageLoginHref(model, callbackUrl);
  const joinHref = isJoinPath(callbackUrl)
    ? callbackUrl
    : heritageJoinChurchHref(model);

  if (model.viewer.isMember) {
    redirect(homeHref);
  }

  return (
    <div className="flex w-full flex-col">
      <div className="mb-7 flex items-center gap-3">
        <span className="relative size-11 overflow-hidden">
          <Image
            src={logo}
            alt={`${model.church.name} logo`}
            fill
            className="object-contain"
            sizes="44px"
          />
        </span>
        <div className="min-w-0">
          <p className="heritage-display text-xl leading-tight">
            {model.church.name}
          </p>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[var(--heritage-muted)]">
            {model.website.heroEyebrow?.trim() || "Worship · Community · Faith"}
          </p>
        </div>
      </div>

      {model.viewer.isAuthenticated ? (
        <div className="space-y-5">
          <p className="heritage-eyebrow">Welcome</p>
          <h1 className="heritage-display text-[length:var(--heritage-section)] text-[var(--heritage-text)]">
            Continue joining
          </h1>
          <p className="text-sm leading-relaxed text-[var(--heritage-muted)]">
            Your account is ready. Continue to join {model.church.name}.
          </p>
          <HeritageButton href={joinHref} arrow>
            Continue joining
          </HeritageButton>
        </div>
      ) : (
        <>
          <p className="heritage-eyebrow">Welcome</p>
          <h1 className="heritage-display mt-3 text-[length:var(--heritage-section)] text-[var(--heritage-text)]">
            Create your account
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--heritage-muted)]">
            Create an account to join this church community.
          </p>
          <div className="mt-8">
            <FirebaseSignUpForm
              callbackUrl={joinHref}
              hideIntro
              appearance="heritage"
              inlineErrors
              showConfirmPassword
              signInHref={signInHref}
            />
          </div>
        </>
      )}

      <p className="mt-8">
        <Link href={homeHref} className="heritage-auth-site-link">
          ← Back to website
        </Link>
      </p>
    </div>
  );
}
