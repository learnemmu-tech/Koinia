"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("heritage.prayer");
  const tCommon = useTranslations("common");
  const tCategories = useTranslations("prayer.categories");
  const tPrayer = useTranslations("prayer");
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
          {t("signInPrompt", { name: model.church.name })}
        </p>
        <div className="mt-6">
          <HeritageButton href={heritageLoginHref(model, prayerPath)} arrow>
            {t("signInCta")}
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
          {t("received")}
        </p>
        <p className={variant === "dialog" ? "heritage-dialog-description" : "mt-4 text-[var(--heritage-muted)]"}>
          {submittedShareable ? t("receivedShared") : t("receivedPrivate")}
        </p>
        <div className="mt-6 flex shrink-0 flex-wrap gap-3">
          <button
            type="button"
            className="heritage-btn heritage-btn-primary"
            onClick={resetForAnother}
          >
            {t("shareAnother")}
          </button>
          {onCancel ? (
            <button
              type="button"
              className="heritage-btn heritage-btn-outline"
              onClick={onCancel}
            >
              {tCommon("close")}
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
            {t("title")}
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
            {t("request")}
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
            {tPrayer("category")}
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
                {tCategories(item.value)}
              </option>
            ))}
          </select>
        </div>
        {isAnonymous ? null : (
          <div className={isDialog ? "heritage-dialog-field" : undefined}>
            <label htmlFor="heritage-prayer-name" className={labelClass}>
              {t("yourName")}
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
          {t("anonymous")}
        </label>
        <label className={isDialog ? "heritage-dialog-checkrow" : "flex items-center gap-3 text-sm text-[var(--heritage-muted)]"}>
          <input
            type="checkbox"
            className={isDialog ? "heritage-dialog-check" : undefined}
            checked={shareWithCommunity}
            onChange={(event) => setShareWithCommunity(event.target.checked)}
          />
          {t("shareWall")}
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
          {submitting ? t("sending") : t("submit")}
        </button>
        {onCancel ? (
          <button
            type="button"
            className="heritage-btn heritage-btn-outline"
            onClick={onCancel}
            disabled={submitting}
          >
            {tCommon("cancel")}
          </button>
        ) : null}
      </div>
    </form>
  );
}
