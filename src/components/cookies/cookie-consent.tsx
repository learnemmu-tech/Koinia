"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";

import {
  COOKIE_CONSENT_MAX_AGE,
  COOKIE_CONSENT_NAME,
  type ConsentAction,
  type ConsentChoices,
  type StoredConsent,
  newConsent,
  parseStoredConsent,
} from "@/lib/cookies/consent";
import { LEGAL_PRIVACY_PATH, LEGAL_TERMS_PATH } from "@/legal/paths";

const OPEN_EVENT = "koinia:open-cookie-settings";

function readCookie(): string | null {
  const match = document.cookie.split("; ").find((part) => part.startsWith(`${COOKIE_CONSENT_NAME}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(COOKIE_CONSENT_NAME.length + 1));
}

function writeCookie(consent: StoredConsent) {
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${COOKIE_CONSENT_NAME}=${encodeURIComponent(JSON.stringify(consent))}; path=/; max-age=${COOKIE_CONSENT_MAX_AGE}; samesite=lax${secure}`;
  localStorage.setItem(COOKIE_CONSENT_NAME, JSON.stringify(consent));
}

function randomId() {
  return crypto.randomUUID();
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function CookieSettingsButton({ className, label = "Cookie Settings" }: { className?: string; label?: string }) {
  return (
    <button type="button" className={className} onClick={() => openCookieSettings()}>
      {label}
    </button>
  );
}

export function CookieConsent({ umamiWebsiteId }: { umamiWebsiteId?: string }) {
  const [consent, setConsent] = useState<StoredConsent | null>(null);
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draft, setDraft] = useState<ConsentChoices>({
    necessary: true,
    preferences: false,
    analytics: false,
    externalMedia: false,
  });
  const [theme, setTheme] = useState("signature");
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const stored = parseStoredConsent(readCookie()) ?? parseStoredConsent(localStorage.getItem(COOKIE_CONSENT_NAME));
    setConsent(stored);
    if (stored) setDraft(stored.choices);
    setReady(true);
    const node = document.querySelector("[data-church-template]");
    const value = node?.getAttribute("data-church-template");
    if (value === "heritage" || value === "parish" || value === "signature") setTheme(value);
  }, []);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== COOKIE_CONSENT_NAME) return;
      setConsent(parseStoredConsent(event.newValue));
    }
    function onOpen() {
      setSettingsOpen(true);
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (!settingsOpen) return;
    lastFocus.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>("button, a, input")?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSettingsOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      lastFocus.current?.focus();
    };
  }, [settingsOpen]);

  const persist = useCallback(async (action: ConsentAction, custom?: Partial<ConsentChoices>) => {
    const id = consent?.id ?? randomId();
    const next = newConsent({ id, action, custom });
    writeCookie(next);
    setConsent(next);
    setDraft(next.choices);
    setSettingsOpen(false);
    if (!next.choices.analytics) {
      document.cookie.split(";").forEach((part) => {
        const name = part.split("=")[0]?.trim() ?? "";
        if (name.toLowerCase().startsWith("umami")) {
          document.cookie = `${name}=; path=/; max-age=0`;
        }
      });
    }
    void fetch("/api/cookies/consent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        anonymousId: id,
        action,
        preferences: next.choices.preferences,
        analytics: next.choices.analytics,
        externalMedia: next.choices.externalMedia,
        locale: document.documentElement.lang || "en",
        idempotencyKey: randomId(),
      }),
    });
  }, [consent?.id]);

  const analyticsAllowed = Boolean(ready && consent?.choices.analytics);
  const showBanner = ready && !consent;

  return (
    <>
      {analyticsAllowed ? <Analytics /> : null}
      {analyticsAllowed && umamiWebsiteId ? (
        <Script src="https://us.umami.is/script.js" data-website-id={umamiWebsiteId} strategy="afterInteractive" />
      ) : null}
      {showBanner ? (
        <section
          data-cookie-theme={theme}
          className="fixed z-[70] w-[min(420px,calc(100vw-32px))] rounded-[12px] border border-white/10 bg-[#2A211C] p-3.5 text-[#F6F1E7] shadow-[0_10px_28px_rgba(0,0,0,0.28)]"
          style={{ right: 20, bottom: "max(20px, env(safe-area-inset-bottom))" }}
          aria-label="Cookie consent"
        >
          <p className="pr-6 text-[13px] leading-5 text-[#F3EBE3]">
            Essential cookies keep Koinia working. Optional cookies help improve your experience. Choose whether to accept or reject optional cookies, or customize your preferences.
          </p>
          <p className="mt-2 text-[13px] leading-5">
            <a className={linkClass(theme)} href="/legal/cookies">Cookie Policy</a>
            <span className="text-[#C4B8AE]"> · </span>
            <a className={linkClass(theme)} href={LEGAL_PRIVACY_PATH}>Privacy Policy</a>
            <span className="text-[#C4B8AE]"> · </span>
            <a className={linkClass(theme)} href={LEGAL_TERMS_PATH}>Terms of Service</a>
          </p>
          <button
            type="button"
            className="absolute right-2 top-2 rounded-md p-1 text-[#C4B8AE] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--primary))]"
            aria-label="Dismiss cookie notice without accepting optional cookies"
            onClick={() => void persist("reject_optional")}
          >
            <X className="size-3.5" aria-hidden />
          </button>
          <div className="mt-3 flex flex-col gap-2 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between">
            <button type="button" className="h-[34px] whitespace-nowrap rounded-full border border-white/25 bg-transparent px-3 text-[13px] font-medium text-[#F6F1E7]" onClick={() => setSettingsOpen(true)}>Cookies Settings</button>
            <div className="flex items-center gap-1.5">
              <button type="button" className="h-[34px] whitespace-nowrap rounded-full bg-[#F6F1E7] px-3 text-[13px] font-medium text-[#2A211C]" onClick={() => void persist("reject_optional")}>Reject All</button>
              <button type="button" className={bannerAcceptClass(theme)} onClick={() => void persist("accept_all")}>Accept All</button>
            </div>
          </div>
        </section>
      ) : null}
      {settingsOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center" role="presentation">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            data-cookie-theme={theme}
            className={`max-h-[min(640px,90vh)] w-full max-w-md overflow-auto rounded-[13px] border border-[#E4DCD0] p-4 text-[#1C2B3A] shadow-xl ${surfaceClass(theme)}`}
          >
            <h2 id={titleId} className="text-base font-semibold">Cookie Preferences</h2>
            <p className="mt-1 text-[13px] leading-5 text-[#3E4C59]">
              Essential cookies stay on. Optional categories start off until you turn them on.
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="rounded-md border border-[#E4DCD0] px-3 py-2">
                <p className="font-medium">Strictly necessary</p>
                <p className="text-[13px] leading-5 text-[#3E4C59]">Always active. Sign-in, security, and this choice.</p>
              </li>
              <Category
                label="Preferences"
                description="Interface choices such as the sidebar."
                checked={draft.preferences}
                onChange={(value) => setDraft((current) => ({ ...current, preferences: value }))}
              />
              <Category
                label="Analytics"
                description="Usage measurement. Off until you allow it."
                checked={draft.analytics}
                onChange={(value) => setDraft((current) => ({ ...current, analytics: value }))}
              />
              <Category
                label="External media"
                description="Embedded video players. Off until you allow them."
                checked={draft.externalMedia}
                onChange={(value) => setDraft((current) => ({ ...current, externalMedia: value }))}
              />
            </ul>
            <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              <button type="button" className="min-h-9 rounded-lg border border-[#D5CBBE] bg-white px-2 text-[13px] font-medium text-[#1C2B3A]" onClick={() => void persist("reject_optional")}>Reject Optional</button>
              <button type="button" className="min-h-9 rounded-lg border border-[#D5CBBE] bg-white px-2 text-[13px] font-medium text-[#1C2B3A]" onClick={() => void persist("save_preferences", draft)}>Save My Preferences</button>
              <button type="button" className={primaryClass(theme)} onClick={() => void persist("accept_all")}>Accept All</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function surfaceClass(theme: string) {
  if (theme === "heritage") return "bg-[#FBF8F3]";
  if (theme === "parish") return "bg-[#F7F6F1]";
  return "bg-white";
}

function linkClass(theme: string) {
  if (theme === "heritage") return "text-[hsl(345_42%_72%)] underline underline-offset-2";
  if (theme === "parish") return "text-[hsl(150_28%_72%)] underline underline-offset-2";
  return "text-[hsl(var(--primary))] underline underline-offset-2";
}

function bannerAcceptClass(theme: string) {
  const color =
    theme === "heritage"
      ? "bg-[hsl(345_52%_42%)] hover:bg-[hsl(345_52%_36%)]"
      : theme === "parish"
        ? "bg-[hsl(158_32%_36%)] hover:bg-[hsl(158_32%_30%)]"
        : "bg-primary hover:bg-[hsl(var(--primary-hover))]";
  return `h-[34px] whitespace-nowrap rounded-full px-3 text-[13px] font-medium text-white ${color}`;
}

function primaryClass(theme: string) {
  const color =
    theme === "heritage"
      ? "bg-[hsl(345_52%_26%)] hover:bg-[hsl(345_52%_20%)]"
      : theme === "parish"
        ? "bg-[hsl(158_37%_17%)] hover:bg-[hsl(156_39%_12%)]"
        : "bg-primary hover:bg-[hsl(var(--primary-hover))]";
  return `min-h-[36px] min-w-[5.5rem] flex-1 rounded-lg px-2 text-[13px] font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--primary))] ${color}`;
}

function Category({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-md border border-[#E4DCD0] px-3 py-2">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-[13px] leading-5 text-[#3E4C59]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={checked ? "h-6 w-10 shrink-0 rounded-full bg-[#1C2B3A]" : "h-6 w-10 shrink-0 rounded-full border border-[#D5CBBE] bg-white"}
      />
    </li>
  );
}

export function useExternalMediaAllowed(): boolean {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    const stored = parseStoredConsent(readCookie());
    setAllowed(Boolean(stored?.choices.externalMedia));
    function onStorage(event: StorageEvent) {
      if (event.key !== COOKIE_CONSENT_NAME) return;
      setAllowed(Boolean(parseStoredConsent(event.newValue)?.choices.externalMedia));
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return allowed;
}
