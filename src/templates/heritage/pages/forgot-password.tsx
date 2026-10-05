import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ForgotPasswordForm } from "@/app/(firebase-auth)/forgot-password/_components/forgot-password-form";
import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { heritageLoginHref } from "@/templates/heritage/lib";

export async function HeritageForgotPasswordPage({
  model,
  callbackUrl,
}: {
  model: ChurchWebsiteViewModel;
  callbackUrl: string;
}) {
  const t = await getTranslations("heritage.auth");
  const homeHref = churchWebsitePath(model.church.slug);

  if (model.viewer.isMember) {
    redirect(homeHref);
  }

  return (
    <div className="flex w-full flex-col">
      <ForgotPasswordForm
        appearance="heritage"
        inlineErrors
        backHref={heritageLoginHref(model, callbackUrl)}
      />
      <p className="mt-5">
        <Link href={homeHref} className="heritage-auth-site-link">
          ← {t("backToWebsite")}
        </Link>
      </p>
    </div>
  );
}
