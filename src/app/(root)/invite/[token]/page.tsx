import { InviteAcceptClient } from "@/components/invite/invite-accept-client";

export const metadata = {
  title: "Accept invitation",
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="container flex min-h-[80vh] items-center py-12">
      <InviteAcceptClient token={token} />
    </div>
  );
}
