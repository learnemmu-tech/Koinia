"use client";

import { useState } from "react";

export function ParishContactForm({ churchSlug }: { churchSlug: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/church-site/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          churchSlug,
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          phone: String(data.get("phone") ?? ""),
          subject: String(data.get("subject") ?? ""),
          message: String(data.get("message") ?? ""),
        }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(body?.error || "The message could not be sent.");
        return;
      }
      setSent(true);
      event.currentTarget.reset();
    } catch {
      setError("The message could not be sent.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <p className="parish-card" role="status">
        Thank you. Your message was sent to the church.
      </p>
    );
  }

  return (
    <form className="parish-card space-y-4" onSubmit={onSubmit} noValidate={false}>
      <div>
        <label className="parish-eyebrow" htmlFor="contact-name">Full name</label>
        <input id="contact-name" name="name" required minLength={2} maxLength={100} autoComplete="name" className="mt-2 w-full border border-[var(--parish-line)] bg-white px-3 py-2" />
      </div>
      <div>
        <label className="parish-eyebrow" htmlFor="contact-email">Email address</label>
        <input id="contact-email" name="email" type="email" required autoComplete="email" className="mt-2 w-full border border-[var(--parish-line)] bg-white px-3 py-2" />
      </div>
      <div>
        <label className="parish-eyebrow" htmlFor="contact-phone">Phone number</label>
        <input id="contact-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} className="mt-2 w-full border border-[var(--parish-line)] bg-white px-3 py-2" />
      </div>
      <div>
        <label className="parish-eyebrow" htmlFor="contact-subject">Subject</label>
        <input id="contact-subject" name="subject" required minLength={3} maxLength={150} className="mt-2 w-full border border-[var(--parish-line)] bg-white px-3 py-2" />
      </div>
      <div>
        <label className="parish-eyebrow" htmlFor="contact-message">Message</label>
        <textarea id="contact-message" name="message" required minLength={10} maxLength={2000} rows={6} className="mt-2 w-full border border-[var(--parish-line)] bg-white px-3 py-2" />
      </div>
      {error ? <p className="text-sm text-red-800" role="alert">{error}</p> : null}
      <button type="submit" disabled={pending} className="heritage-btn heritage-btn-primary disabled:opacity-60">
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
