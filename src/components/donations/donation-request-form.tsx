"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DONATION_REQUEST_CATEGORIES } from "@/lib/donations/request-rules";
import { submitDonationRequestAction } from "@/lib/donations/request-actions";

export function DonationRequestForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [key] = useState(() => crypto.randomUUID());

  return (
    <form
      className="space-y-3 rounded-lg border border-border bg-card p-4"
      action={async (formData) => {
        const result = await submitDonationRequestAction(formData);
        setMessage(result.ok ? "Request submitted. It is private to your church administrators." : result.error);
      }}
    >
      <input type="hidden" name="idempotencyKey" value={key} />
      <label className="block text-sm">
        Request title
        <input name="title" required maxLength={120} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2" />
      </label>
      <label className="block text-sm">
        Category
        <select name="category" required className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2">
          {DONATION_REQUEST_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Reason for request
        <textarea name="reason" required minLength={20} maxLength={4000} rows={5} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2" />
        <span className="text-xs text-muted-foreground">Describe the need. At least 20 characters.</span>
      </label>
      <label className="block text-sm">
        Requested amount (INR)
        <input name="amount" required inputMode="decimal" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2" />
      </label>
      <label className="block text-sm">
        Additional information
        <textarea name="additional" maxLength={2000} rows={3} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2" />
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="acknowledged" required className="mt-1" />
        <span>
          Your request will be shared privately with authorized administrators of your church for review. It will not be published as a donation campaign automatically.
        </span>
      </label>
      <Button type="submit">Submit Request</Button>
      {message ? <p className="text-sm">{message}</p> : null}
    </form>
  );
}
