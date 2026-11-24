"use client";

import { useState } from "react";

const TYPES = [
  ["access", "Access"],
  ["correction", "Correction"],
  ["deletion", "Deletion"],
  ["export", "Export"],
  ["complaint", "Complaint"],
  ["consent_withdrawal", "Withdraw optional consent"],
] as const;

export function PrivacyRequestForm() {
  const [status, setStatus] = useState<string | null>(null);

  return (
    <form
      className="mt-10 max-w-xl space-y-3 border-t border-[#E2D9CC] pt-6"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const response = await fetch("/api/legal/privacy-requests", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            requestType: form.get("requestType"),
            details: form.get("details"),
          }),
        });
        setStatus(response.ok ? "Request submitted." : "Sign in with your own account to submit a request.");
      }}
    >
      <h2 className="font-heading text-xl font-semibold">Submit a request</h2>
      <label className="block text-sm">
        Request type
        <select name="requestType" className="mt-1 w-full rounded-md border border-[#E2D9CC] bg-white px-3 py-2">
          {TYPES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Details
        <textarea name="details" required className="mt-1 w-full rounded-md border border-[#E2D9CC] bg-white px-3 py-2" rows={4} />
      </label>
      <button type="submit" className="rounded-md bg-[#1C2B3A] px-3 py-2 text-sm text-white">
        Submit
      </button>
      {status ? <p className="text-sm">{status}</p> : null}
    </form>
  );
}
