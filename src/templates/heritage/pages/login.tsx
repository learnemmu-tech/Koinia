import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { FirebaseSignInForm } from "@/app/(firebase-auth)/signin/_components/firebase-signin-form";
import { isJoinPath } from "@/lib/auth/auth-paths";
import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { HeritageButton } from "@/templates/heritage/components/heritage-button";
import {
  heritageForgotPasswordHref,
  heritageJoinChurchHref,
  heritageSignupHref,
} from "@/templates/heritage/lib";
import { HERITAGE_FALLBACK_IMAGES } from "@/templates/heritage/theme";

export function HeritageLoginPage({
  model,
  callbackUrl,
}: {
  model: ChurchWebsiteViewModel;
  callbackUrl: string;
}) {
  const homeHref = churchWebsitePath(model.church.slug);
  const logo = model.website.images.logo || HERITAGE_FALLBACK_IMAGES.mark;
  const signupHref = isJoinPath(callbackUrl)
    ? heritageSignupHref(model, callbackUrl)
    : heritageSignupHref(model, heritageJoinChurchHref(model));

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
            Join this church
          </h1>
          <p className="text-sm leading-relaxed text-[var(--heritage-muted)]">
            You are signed in, but you are not a member of {model.church.name}{" "}
            yet. Join to belong to this church community.
          </p>
          <HeritageButton href={heritageJoinChurchHref(model)} arrow>
            Continue joining
          </HeritageButton>
        </div>
      ) : (
        <>
          <p className="heritage-eyebrow">Welcome back</p>
          <h1 className="heritage-display mt-3 text-[length:var(--heritage-section)] text-[var(--heritage-text)]">
            Sign in
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--heritage-muted)]">
            Access your church account to stay connected, view resources, and be
            part of our community.
          </p>
          <div className="mt-8">
            <FirebaseSignInForm
              callbackUrl={callbackUrl}
              hideIntro
              appearance="heritage"
              inlineErrors
              signUpHref={signupHref}
              forgotPasswordHref={heritageForgotPasswordHref(model, callbackUrl)}
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
