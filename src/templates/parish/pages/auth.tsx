import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { FirebaseSignInForm } from "@/app/(firebase-auth)/signin/_components/firebase-signin-form";
import { FirebaseSignUpForm } from "@/app/(firebase-auth)/signup/_components/firebase-signup-form";
import { ForgotPasswordForm } from "@/app/(firebase-auth)/forgot-password/_components/forgot-password-form";
import { isJoinPath } from "@/lib/auth/auth-paths";
import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import {
  heritageForgotPasswordHref,
  heritageJoinChurchHref,
  heritageLoginHref,
  heritageSignupHref,
} from "@/templates/heritage/lib";
import { ParishButton } from "@/templates/parish/components/parish-button";

export async function ParishLoginPage({
  model,
  callbackUrl,
}: {
  model: ChurchWebsiteViewModel;
  callbackUrl: string;
}) {
  const t = await getTranslations("heritage.auth");
  const homeHref = churchWebsitePath(model.church.slug);
  if (model.viewer.isMember) redirect(homeHref);
  const signupHref = heritageSignupHref(
    model,
    isJoinPath(callbackUrl) ? callbackUrl : heritageJoinChurchHref(model)
  );

  return (
    <div>
      {model.viewer.isAuthenticated ? (
        <div className="space-y-4">
          <h1 className="parish-display text-4xl">{t("joinChurch")}</h1>
          <p className="parish-muted">{t("signedInBody", { name: model.church.name })}</p>
          <ParishButton href={heritageJoinChurchHref(model)}>{t("continueJoining")}</ParishButton>
        </div>
      ) : (
        <>
          <p className="parish-eyebrow">{t("welcomeBack")}</p>
          <h1 className="parish-display mt-2 text-4xl">{t("signIn")}</h1>
          <div className="mt-5">
            <FirebaseSignInForm
              callbackUrl={callbackUrl}
              hideIntro
              appearance="parish"
              inlineErrors
              signUpHref={signupHref}
              forgotPasswordHref={heritageForgotPasswordHref(model, callbackUrl)}
            />
          </div>
        </>
      )}
      <p className="mt-5">
        <Link href={homeHref}>← {t("backToWebsite")}</Link>
      </p>
    </div>
  );
}

export async function ParishSignupPage({
  model,
  callbackUrl,
}: {
  model: ChurchWebsiteViewModel;
  callbackUrl: string;
}) {
  const t = await getTranslations("heritage.auth");
  const homeHref = churchWebsitePath(model.church.slug);
  if (model.viewer.isMember) redirect(homeHref);
  const joinHref = isJoinPath(callbackUrl) ? callbackUrl : heritageJoinChurchHref(model);

  return (
    <div>
      {model.viewer.isAuthenticated ? (
        <ParishButton href={joinHref}>{t("continueJoining")}</ParishButton>
      ) : (
        <>
          <h1 className="parish-display text-4xl">{t("createAccount")}</h1>
          <div className="mt-5">
            <FirebaseSignUpForm
              callbackUrl={joinHref}
              hideIntro
              appearance="parish"
              inlineErrors
              signInHref={heritageLoginHref(model, callbackUrl)}
            />
          </div>
        </>
      )}
      <p className="mt-5">
        <Link href={homeHref}>← {t("backToWebsite")}</Link>
      </p>
    </div>
  );
}

export async function ParishForgotPasswordPage({
  model,
  callbackUrl,
}: {
  model: ChurchWebsiteViewModel;
  callbackUrl: string;
}) {
  const homeHref = churchWebsitePath(model.church.slug);
  if (model.viewer.isMember) redirect(homeHref);
  return (
    <ForgotPasswordForm
      appearance="parish"
      inlineErrors
      backHref={heritageLoginHref(model, callbackUrl)}
    />
  );
}
