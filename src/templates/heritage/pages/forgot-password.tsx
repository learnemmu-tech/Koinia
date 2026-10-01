import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ForgotPasswordForm } from "@/app/(firebase-auth)/forgot-password/_components/forgot-password-form";
import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { heritageLoginHref } from "@/templates/heritage/lib";
import { HERITAGE_FALLBACK_IMAGES } from "@/templates/heritage/theme";

export function HeritageForgotPasswordPage({
  model,
  callbackUrl,
}: {
  model: ChurchWebsiteViewModel;
  callbackUrl: string;
}) {
  const homeHref = churchWebsitePath(model.church.slug);
  const logo = model.website.images.logo || HERITAGE_FALLBACK_IMAGES.mark;

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
        <p className="heritage-display text-xl leading-tight">
          {model.church.name}
        </p>
      </div>
      <ForgotPasswordForm
        appearance="heritage"
        inlineErrors
        backHref={heritageLoginHref(model, callbackUrl)}
      />
      <p className="mt-8">
        <Link href={homeHref} className="heritage-auth-site-link">
          ← Back to website
        </Link>
      </p>
    </div>
  );
}
