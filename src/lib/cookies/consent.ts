export const COOKIE_CONSENT_VERSION = "2026-11-22";
export const COOKIE_POLICY_VERSION = "cookies-draft-2026-11-22";
export const COOKIE_CONSENT_NAME = "koinia_consent";
export const COOKIE_CONSENT_MAX_AGE = 60 * 60 * 24 * 180;

export const OPTIONAL_CATEGORIES = ["preferences", "analytics", "externalMedia"] as const;
export type OptionalCategory = (typeof OPTIONAL_CATEGORIES)[number];

export type ConsentChoices = {
  necessary: true;
  preferences: boolean;
  analytics: boolean;
  externalMedia: boolean;
};

export type ConsentAction =
  | "accept_all"
  | "reject_optional"
  | "save_preferences"
  | "withdraw_optional";

export type StoredConsent = {
  id: string;
  version: string;
  policyVersion: string;
  choices: ConsentChoices;
  action: ConsentAction;
  updatedAt: string;
};

export const NECESSARY_ONLY: ConsentChoices = {
  necessary: true,
  preferences: false,
  analytics: false,
  externalMedia: false,
};

export const ALL_CONFIGURED: ConsentChoices = {
  necessary: true,
  preferences: true,
  analytics: true,
  externalMedia: true,
};

export function choicesForAction(action: ConsentAction, custom?: Partial<ConsentChoices>): ConsentChoices {
  if (action === "accept_all") return { ...ALL_CONFIGURED };
  if (action === "reject_optional" || action === "withdraw_optional") return { ...NECESSARY_ONLY };
  return {
    necessary: true,
    preferences: Boolean(custom?.preferences),
    analytics: Boolean(custom?.analytics),
    externalMedia: Boolean(custom?.externalMedia),
  };
}

export function parseStoredConsent(raw: string | null | undefined): StoredConsent | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as StoredConsent;
    if (!value || value.version !== COOKIE_CONSENT_VERSION) return null;
    if (!value.id || !value.choices) return null;
    return {
      ...value,
      choices: {
        necessary: true,
        preferences: Boolean(value.choices.preferences),
        analytics: Boolean(value.choices.analytics),
        externalMedia: Boolean(value.choices.externalMedia),
      },
    };
  } catch {
    return null;
  }
}

export function serializeConsent(consent: StoredConsent): string {
  return JSON.stringify(consent);
}

/** URL flags cannot grant consent. */
export function consentFromSearchParams(_params: URLSearchParams): null {
  return null;
}

export function newConsent(input: {
  id: string;
  action: ConsentAction;
  custom?: Partial<ConsentChoices>;
  now?: string;
}): StoredConsent {
  return {
    id: input.id,
    version: COOKIE_CONSENT_VERSION,
    policyVersion: COOKIE_POLICY_VERSION,
    choices: choicesForAction(input.action, input.custom),
    action: input.action,
    updatedAt: input.now ?? new Date().toISOString(),
  };
}
