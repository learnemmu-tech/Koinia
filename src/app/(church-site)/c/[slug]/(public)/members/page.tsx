import { redirect } from "next/navigation";

import { requireChurchWebsite } from "@/lib/templates/require-church-website";
import { churchWebsitePath } from "@/lib/templates/paths";

export const dynamic = "force-dynamic";

export default async function MembersGatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { model, pages } = await requireChurchWebsite(slug);
  if (model.viewer.isMember) {
    redirect(churchWebsitePath(model.church.slug));
  }
  return <pages.MemberGate model={model} featureLabel="This member area" />;
}
