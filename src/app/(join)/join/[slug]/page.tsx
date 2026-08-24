import { JoinChurchClient } from "@/components/join/join-church-client";

type JoinPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function JoinChurchPage({ params }: JoinPageProps) {
  const { slug } = await params;
  return <JoinChurchClient slug={slug} />;
}
