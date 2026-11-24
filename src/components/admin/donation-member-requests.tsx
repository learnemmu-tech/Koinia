"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { DonationRequestDecisionForm } from "@/components/donations/donation-request-decision-form";
import { Button } from "@/components/ui/button";
import {
  listAdminDonationRequestsAction,
  listDonationRequestReviewHistoryAction,
} from "@/lib/donations/request-actions";

type RequestRow = Awaited<ReturnType<typeof listAdminDonationRequestsAction>>[number];
type HistoryRow = Awaited<ReturnType<typeof listDonationRequestReviewHistoryAction>>[number];

const FILTERS = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
] as const;

function label(value: string) {
  return value.replaceAll("_", " ");
}

export function DonationMemberRequests() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "all";
  const requestId = searchParams.get("request");
  const error = searchParams.get("error");
  const updated = searchParams.get("updated");
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void listAdminDonationRequestsAction().then((next) => {
      if (!active) return;
      setRows(next);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [updated]);

  useEffect(() => {
    if (!requestId) {
      setHistory([]);
      return;
    }
    let active = true;
    void listDonationRequestReviewHistoryAction(requestId).then((next) => {
      if (active) setHistory(next);
    });
    return () => {
      active = false;
    };
  }, [requestId, updated]);

  const pending = rows.filter((row) => row.status === "submitted" || row.status === "under_review").length;
  const filtered = useMemo(
    () => (status === "all" ? rows : rows.filter((row) => row.status === status)),
    [rows, status]
  );
  const open = requestId ? rows.find((row) => row.id === requestId) ?? null : null;

  function setQuery(next: { status?: string; request?: string | null }) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "donations");
    params.set("section", "requests");
    if (next.status !== undefined) {
      if (next.status === "all") params.delete("status");
      else params.set("status", next.status);
    }
    if (next.request !== undefined) {
      if (next.request) params.set("request", next.request);
      else params.delete("request");
    }
    params.delete("error");
    params.delete("updated");
    router.replace(`/dashboard/content?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {pending} pending. Approving a request does not create or publish a donation campaign.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Button
            key={filter.value}
            type="button"
            size="sm"
            variant={status === filter.value ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setQuery({ status: filter.value, request: null })}
          >
            {filter.label}
          </Button>
        ))}
      </div>
      {loading ? <p className="text-sm text-muted-foreground">Loading requests…</p> : null}
      {!loading && filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No member donation requests in this view.</p>
      ) : null}
      <ul className="divide-y divide-border rounded-lg border border-border text-sm">
        {filtered.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              className="grid w-full gap-1 px-3 py-3 text-left hover:bg-muted/40 sm:grid-cols-6"
              onClick={() => setQuery({ request: row.id })}
            >
              <span className="font-medium sm:col-span-2">{row.title}</span>
              <span>
                {row.firstName} {row.lastName}
              </span>
              <span className="capitalize">{label(row.category)}</span>
              <span>
                {row.currency} {row.amount ?? "—"}
              </span>
              <span className="capitalize text-muted-foreground">
                {label(row.status)} · {new Date(row.createdAt).toLocaleDateString()}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {updated ? (
        <p className="text-sm">Decision saved. The member is notified. A donation campaign was not created.</p>
      ) : null}
      {open ? (
        <article className="max-w-2xl space-y-3 rounded-lg border border-border p-4 text-sm">
          <h3 className="font-heading text-lg font-semibold">{open.title}</h3>
          <p>
            {open.firstName} {open.lastName} · {open.email}
          </p>
          <p className="capitalize">
            {label(open.category)} · {open.currency} {open.amount ?? "—"} · {label(open.status)}
          </p>
          <p className="whitespace-pre-wrap">{open.reason}</p>
          {open.additionalInformation ? <p className="whitespace-pre-wrap">{open.additionalInformation}</p> : null}
          {open.memberResponse ? (
            <p className="text-muted-foreground">Last response: {open.memberResponse}</p>
          ) : null}
          <DonationRequestDecisionForm requestId={open.id} />
          {history.length > 0 ? (
            <div className="space-y-1 border-t border-border pt-3">
              <p className="font-medium">Review history</p>
              <ul className="space-y-1 text-muted-foreground">
                {history.map((event) => (
                  <li key={event.id}>
                    <span className="capitalize">{label(event.action)}</span>
                    {" · "}
                    {new Date(event.createdAt).toLocaleString()}
                    {event.note ? ` · ${event.note}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>
      ) : null}
    </div>
  );
}
