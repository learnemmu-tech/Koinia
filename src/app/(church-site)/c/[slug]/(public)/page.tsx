import AppHomePage from "@/app/(root)/page";
import { requireChurchWebsite } from "@/lib/templates/require-church-website";
import { usesSignatureAppExperience } from "@/lib/templates/signature-experience";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export default async function ChurchHomePage({ params }: PageProps) {
  const { slug } = await params;
  const { model, pages } = await requireChurchWebsite(slug);
  if (usesSignatureAppExperience(model.templateId)) {
    return <AppHomePage />;
  }
  return <pages.Home model={model} />;
}
