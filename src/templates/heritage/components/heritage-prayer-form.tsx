"use client";

import { useState, type FormEvent } from "react";

import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { submitPublicChurchPrayerRequest } from "@/lib/templates/public-prayer-request";
import { PRAYER_CATEGORIES } from "@/lib/prayer-request-validation";
import { HeritageButton } from "@/templates/heritage/components/heritage-button";
import { heritageLoginHref } from "@/templates/heritage/lib";

export function HeritagePrayerForm({
  model,
  flush = false,
  variant = "page",
  onCancel,
}: {
  model: ChurchWebsiteViewModel;
  /** Drop the top margin when the form sits inside its own titled panel. */
  flush?: boolean;
  variant?: "page" | "dialog";
  onCancel?: () => void;
}) {
  const topSpace = flush || variant === "dialog" ? "mt-4" : "mt-10";
  const prayerPath = churchWebsitePath(model.church.slug, "/prayer");
  const [title, setTitle] = useState("");
  const [request, setRequest] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<(typeof PRAYER_CATEGORIES)[number]["value"]>("general");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [shareWithCommunity, setShareWithCommunity] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submittedShareable, setSubmittedShareable] = useState(true);

  function resetForAnother() {
    setTitle("");
    setRequest("");
    setName("");
    setCategory("general");
    setIsAnonymous(false);
    setShareWithCommunity(true);
    setError(null);
    setDone(false);
    setSubmittedShareable(true);
  }

  if (!model.viewer.isAuthenticated) {
    return (
      <div className="border border-[var(--heritage-border)] bg-[var(--heritage-surface)] p-6 sm:p-8">
        <p className="text-[var(--heritage-muted)]">
          Sign in to share a prayer request with {model.church.name}. Choose
          whether it may appear on the members&apos; prayer wall after church
          leaders approve it.
        </p>
        <div className="mt-6">
          <HeritageButton href={heritageLoginHref(model, prayerPath)} arrow>
            Sign in to request prayer
          </HeritageButton>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div
        className={
          variant === "dialog"
            ? "heritage-dialog-body"
            : "border border-[var(--heritage-border)] bg-[var(--heritage-surface)] p-6 sm:p-8"
        }
        role="status"
      >
        <p className={variant === "dialog" ? "heritage-dialog-title" : "heritage-display text-3xl"}>
          Your request was received
        </p>
        <p className={variant === "dialog" ? "heritage-dialog-description" : "mt-4 text-[var(--heritage-muted)]"}>
          Church leaders will review it before anyone else can see it.
          {submittedShareable
            ? " If they approve it and you allowed sharing, it can appear on this church's prayer wall."
            : " You kept it private, so it will not appear on the prayer wall even after approval."}
        </p>
        <div className="mt-6 flex shrink-0 flex-wrap gap-3">
          <button
            type="button"
            className="heritage-btn heritage-btn-primary"
            onClick={resetForAnother}
          >
            Share another request
          </button>
          {onCancel ? (
            <button
              type="button"
              className="heritage-btn heritage-btn-outline"
              onClick={onCancel}
            >
              Close
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await submitPublicChurchPrayerRequest(model.church.slug, {
      name,
      email: "",
      title,
      request,
      category,
      isAnonymous,
      shareWithCommunity,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSubmittedShareable(shareWithCommunity);
    setDone(true);
  }

  const fieldClass =
    "mt-2 w-full min-h-11 border border-[var(--heritage-border)] bg-[var(--heritage-background)] px-3 py-2 text-[var(--heritage-text)] outline-none focus:border-[var(--heritage-accent)]";

  const isDialog = variant === "dialog";
  const labelClass = isDialog ? "heritage-dialog-label" : "heritage-eyebrow";
  const inputClass = isDialog ? "heritage-dialog-input" : fieldClass;
  const textareaClass = isDialog ? "heritage-dialog-textarea" : fieldClass;
  const selectClass = isDialog ? "heritage-dialog-select" : fieldClass;

  return (
    <form
      onSubmit={onSubmit}
      className={
        isDialog ? "heritage-dialog-form" : `${topSpace} space-y-5`
      }
    >
      <div className={isDialog ? "heritage-dialog-body" : "contents"}>
        <div className={isDialog ? "heritage-dialog-field" : undefined}>
          <label htmlFor="heritage-prayer-title" className={labelClass}>
            Title
          </label>
          <input
            id="heritage-prayer-title"
            required
            maxLength={100}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={inputClass}
          />
        </div>
        <div className={isDialog ? "heritage-dialog-field" : undefined}>
          <label htmlFor="heritage-prayer-request" className={labelClass}>
            Request
          </label>
          <textarea
            id="heritage-prayer-request"
            required
            maxLength={1000}
            rows={isDialog ? 4 : 6}
            value={request}
            onChange={(event) => setRequest(event.target.value)}
            className={textareaClass}
          />
        </div>
        <div className={isDialog ? "heritage-dialog-field" : undefined}>
          <label htmlFor="heritage-prayer-category" className={labelClass}>
            Category
          </label>
          <select
            id="heritage-prayer-category"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as (typeof PRAYER_CATEGORIES)[number]["value"])
            }
            className={selectClass}
          >
            {PRAYER_CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        {isAnonymous ? null : (
          <div className={isDialog ? "heritage-dialog-field" : undefined}>
            <label htmlFor="heritage-prayer-name" className={labelClass}>
              Your name
            </label>
            <input
              id="heritage-prayer-name"
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClass}
            />
          </div>
        )}
        <label className={isDialog ? "heritage-dialog-checkrow" : "flex items-center gap-3 text-sm text-[var(--heritage-muted)]"}>
          <input
            type="checkbox"
            className={isDialog ? "heritage-dialog-check" : undefined}
            checked={isAnonymous}
            onChange={(event) => setIsAnonymous(event.target.checked)}
          />
          Submit anonymously
        </label>
        <label className={isDialog ? "heritage-dialog-checkrow" : "flex items-center gap-3 text-sm text-[var(--heritage-muted)]"}>
          <input
            type="checkbox"
            className={isDialog ? "heritage-dialog-check" : undefined}
            checked={shareWithCommunity}
            onChange={(event) => setShareWithCommunity(event.target.checked)}
          />
          Allow this request to appear on the members&apos; prayer wall once leaders approve it
        </label>
        {error ? (
          <p className="mt-4 text-sm text-[var(--heritage-primary)]" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <div className={isDialog ? "heritage-dialog-footer" : "flex flex-wrap gap-3"}>
        <button
          type="submit"
          disabled={submitting}
          className="heritage-btn heritage-btn-primary disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Submit prayer request"}
        </button>
        {onCancel ? (
          <button
            type="button"
            className="heritage-btn heritage-btn-outline"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
