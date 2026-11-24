"use client";

import { decideDonationRequestFormAction } from "@/lib/donations/request-actions";

export function DonationRequestDecisionForm({ requestId }: { requestId: string }) {
  return (
    <form action={decideDonationRequestFormAction} className="space-y-2">
      <input type="hidden" name="requestId" value={requestId} />
      <textarea
        name="memberResponse"
        placeholder="Message for the member"
        className="w-full rounded-md border border-border px-3 py-2"
        rows={3}
      />
      <div className="flex flex-wrap gap-2">
        <button className="rounded-md border px-3 py-2" name="decision" value="under_review" type="submit">
          Mark under review
        </button>
        <button
          className="rounded-md bg-primary px-3 py-2 text-primary-foreground"
          name="decision"
          value="approved"
          type="submit"
          onClick={(event) => {
            if (!window.confirm("Approve this request for church consideration? This does not create or publish a donation campaign.")) {
              event.preventDefault();
            }
          }}
        >
          Approve
        </button>
        <button
          className="rounded-md border px-3 py-2"
          name="decision"
          value="rejected"
          type="submit"
          onClick={(event) => {
            if (!window.confirm("Reject this donation request?")) event.preventDefault();
          }}
        >
          Reject
        </button>
      </div>
    </form>
  );
}
