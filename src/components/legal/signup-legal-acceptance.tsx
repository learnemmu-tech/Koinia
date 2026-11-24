"use client";

import { useEffect, useState } from "react";

import { LEGAL_PRIVACY_PATH, LEGAL_TERMS_PATH } from "@/legal/paths";

export type PublishedLegalRequirement = {
  versionId: string;
  versionLabel: string;
  title: string;
} | null;

export function SignupLegalAcceptance({
  onChange,
}: {
  onChange: (value: {
    termsAccepted: boolean;
    termsRequired: boolean;
    termsVersionId: string | null;
    privacyVersionId: string | null;
    marketingEmail: boolean;
    whatsapp: boolean;
  }) => void;
}) {
  const [terms, setTerms] = useState<PublishedLegalRequirement>(null);
  const [privacy, setPrivacy] = useState<PublishedLegalRequirement>(null);
  const [accepted, setAccepted] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [whatsapp, setWhatsapp] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/legal/requirements")
      .then((response) => response.json())
      .then((body: unknown) => {
        if (cancelled || !body || typeof body !== "object") return;
        const record = body as {
          terms?: PublishedLegalRequirement;
          privacy?: PublishedLegalRequirement;
        };
        setTerms(record.terms ?? null);
        setPrivacy(record.privacy ?? null);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    onChange({
      termsAccepted: accepted,
      termsRequired: Boolean(terms),
      termsVersionId: terms?.versionId ?? null,
      privacyVersionId: privacy?.versionId ?? null,
      marketingEmail: marketing,
      whatsapp,
    });
  }, [accepted, marketing, onChange, privacy, terms, whatsapp]);

  return (
    <fieldset className="space-y-2 text-left text-xs leading-5 text-[#5C6B7A]">
      <legend className="sr-only">Legal acceptance</legend>
      {terms ? (
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            className="mt-0.5"
            required
          />
          <span>
            I accept the{" "}
            <a className="underline" href={LEGAL_TERMS_PATH}>
              Terms of Service
            </a>{" "}
            version {terms.versionLabel}.
          </span>
        </label>
      ) : (
        <p>
          The Terms of Service are not published yet. Creating an account does not record
          acceptance of an unpublished draft.{" "}
          <a className="underline" href={LEGAL_TERMS_PATH}>
            Terms status
          </a>
          {" · "}
          <a className="underline" href={LEGAL_PRIVACY_PATH}>
            Privacy status
          </a>
        </p>
      )}
      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={marketing}
          onChange={(event) => setMarketing(event.target.checked)}
          className="mt-0.5"
        />
        <span>Send optional product emails. This is not required.</span>
      </label>
      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={whatsapp}
          onChange={(event) => setWhatsapp(event.target.checked)}
          className="mt-0.5"
        />
        <span>Contact me on WhatsApp. This is not required and is not preselected.</span>
      </label>
    </fieldset>
  );
}
