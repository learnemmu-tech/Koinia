import { getTranslations } from "next-intl/server";
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

export async function HeritageSignupPage({
  model,
  callbackUrl,
}: {
  model: ChurchWebsiteViewModel;
  callbackUrl: string;
}) {
  const t = await getTranslations("heritage.auth");
  const homeHref = churchWebsitePath(model.church.slug);
  const signInHref = heritageLoginHref(model, callbackUrl);
  const joinHref = isJoinPath(callbackUrl)
    ? callbackUrl
    : heritageJoinChurchHref(model);

  if (model.viewer.isMember) {
    redirect(homeHref);
  }

  return (
    <div className="flex w-full flex-col">
      {model.viewer.isAuthenticated ? (
        <div className="space-y-5">
          <p className="heritage-eyebrow">{t("welcome")}</p>
          <h1 className="heritage-display text-[length:var(--heritage-section)] text-[var(--heritage-text)]">
            {t("continueJoining")}
          </h1>
          <p className="text-sm leading-relaxed text-[var(--heritage-muted)]">
            {t("accountReady", { name: model.church.name })}
          </p>
          <HeritageButton href={joinHref} arrow>
            {t("continueJoining")}
          </HeritageButton>
        </div>
      ) : (
        <>
          <p className="heritage-eyebrow">{t("welcome")}</p>
          <h1 className="heritage-display mt-1.5 text-[length:var(--heritage-section)] text-[var(--heritage-text)]">
            {t("createAccount")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--heritage-muted)]">
            {t("createLede")}
          </p>
          <div className="mt-5">
            <FirebaseSignUpForm
              callbackUrl={joinHref}
              hideIntro
              appearance="heritage"
              inlineErrors
              signInHref={signInHref}
            />
          </div>
        </>
      )}

      <p className="mt-5">
        <Link href={homeHref} className="heritage-auth-site-link">
          ← {t("backToWebsite")}
        </Link>
      </p>
    </div>
  );
}
