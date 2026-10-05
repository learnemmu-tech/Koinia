import { getTranslations } from "next-intl/server";
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

export async function HeritageLoginPage({
  model,
  callbackUrl,
}: {
  model: ChurchWebsiteViewModel;
  callbackUrl: string;
}) {
  const t = await getTranslations("heritage.auth");
  const homeHref = churchWebsitePath(model.church.slug);
  const signupHref = isJoinPath(callbackUrl)
    ? heritageSignupHref(model, callbackUrl)
    : heritageSignupHref(model, heritageJoinChurchHref(model));

  if (model.viewer.isMember) {
    redirect(homeHref);
  }

  return (
    <div className="flex w-full flex-col">
      {model.viewer.isAuthenticated ? (
        <div className="space-y-5">
          <p className="heritage-eyebrow">{t("welcome")}</p>
          <h1 className="heritage-display text-[length:var(--heritage-section)] text-[var(--heritage-text)]">
            {t("joinChurch")}
          </h1>
          <p className="text-sm leading-relaxed text-[var(--heritage-muted)]">
            {t("signedInBody", { name: model.church.name })}
          </p>
          <HeritageButton href={heritageJoinChurchHref(model)} arrow>
            {t("continueJoining")}
          </HeritageButton>
        </div>
      ) : (
        <>
          <p className="heritage-eyebrow">{t("welcomeBack")}</p>
          <h1 className="heritage-display mt-1.5 text-[length:var(--heritage-section)] text-[var(--heritage-text)]">
            {t("signIn")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--heritage-muted)]">
            {t("signInLede")}
          </p>
          <div className="mt-5">
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

      <p className="mt-5">
        <Link href={homeHref} className="heritage-auth-site-link">
          ← {t("backToWebsite")}
        </Link>
      </p>
    </div>
  );
}
