import { JoinChurchClient } from "@/components/join/join-church-client";
import { loadChurchWebsiteBySlug } from "@/lib/templates/load-church-website";

import "@/templates/heritage/heritage.css";
import "@/templates/parish/parish.css";

type JoinPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function JoinChurchPage({ params }: JoinPageProps) {
  const { slug } = await params;
  const model = await loadChurchWebsiteBySlug(slug, { includeContent: false }).catch(() => null);
  const client = <JoinChurchClient slug={slug} templateId={model?.templateId ?? null} />;
  if (model?.templateId === "parish") {
    return <div className="parish-theme min-h-svh">{client}</div>;
  }
  if (model?.templateId === "heritage") {
    return <div className="heritage-theme min-h-svh">{client}</div>;
  }
  return client;
}
