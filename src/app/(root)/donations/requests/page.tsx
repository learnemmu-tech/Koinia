import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { DonationRequestForm } from "@/components/donations/donation-request-form";
import { listOwnDonationRequests } from "@/lib/donations/request-service";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";

export default async function MyDonationRequestsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/signin?callbackUrl=/donations/requests");
  const user = await getAppUserByClerkId(userId);
  if (!user) redirect("/signin?callbackUrl=/donations/requests");
  const requests = await listOwnDonationRequests(user.id).catch(() => []);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <header>
        <h1 className="font-heading text-2xl font-semibold">Request a Donation</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Ask your church to consider a private need. This does not create or publish a donation campaign.
        </p>
      </header>
      <DonationRequestForm />
      <section>
        <h2 className="text-lg font-semibold">My Donation Requests</h2>
        <ul className="mt-3 divide-y divide-border border-y border-border">
          {requests.length === 0 ? <li className="py-3 text-sm text-muted-foreground">No requests yet.</li> : null}
          {requests.map((request) => (
            <li key={request.id} className="py-3 text-sm">
              <p className="font-medium">{request.title}</p>
              <p className="text-muted-foreground">
                {request.category.replaceAll("_", " ")} · {request.currency} {request.amount} · {request.status.replaceAll("_", " ")}
              </p>
              <p className="text-muted-foreground">
                Submitted {request.createdAt.toLocaleDateString()} · Updated {request.updatedAt.toLocaleDateString()}
              </p>
              {request.memberResponse ? <p className="mt-1">{request.memberResponse}</p> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
