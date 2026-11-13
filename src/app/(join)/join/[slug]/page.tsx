import { JoinChurchClient } from "@/components/join/join-church-client";
import { loadChurchWebsiteBySlug } from "@/lib/templates/load-church-website";

import "@/templates/parish/parish.css";

type JoinPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function JoinChurchPage({ params }: JoinPageProps) {
  const { slug } = await params;
  const model = await loadChurchWebsiteBySlug(slug, { includeContent: false }).catch(() => null);
  const client = <JoinChurchClient slug={slug} />;
  if (model?.templateId === "parish") {
    return <div className="parish-theme min-h-svh">{client}</div>;
  }
  return client;
}
