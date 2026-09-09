export const ISO_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "NZD",
  "INR",
  "SGD",
  "HKD",
  "JPY",
  "CNY",
  "KRW",
  "BRL",
  "MXN",
  "ZAR",
  "NGN",
  "KES",
  "GHS",
  "PHP",
  "MYR",
  "THB",
  "AED",
  "SAR",
  "CHF",
  "SEK",
  "NOK",
  "DKK",
] as const;

export type IsoCurrency = (typeof ISO_CURRENCIES)[number];

export const BOOK_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "pt", label: "Portuguese" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "nl", label: "Dutch" },
  { code: "sv", label: "Swedish" },
  { code: "pl", label: "Polish" },
  { code: "ro", label: "Romanian" },
  { code: "ru", label: "Russian" },
  { code: "uk", label: "Ukrainian" },
  { code: "ar", label: "Arabic" },
  { code: "hi", label: "Hindi" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "ml", label: "Malayalam" },
  { code: "kn", label: "Kannada" },
  { code: "ko", label: "Korean" },
  { code: "ja", label: "Japanese" },
  { code: "zh", label: "Chinese" },
  { code: "id", label: "Indonesian" },
  { code: "tl", label: "Tagalog" },
  { code: "sw", label: "Swahili" },
] as const;

export function isIsoCurrency(value: string): value is IsoCurrency {
  return (ISO_CURRENCIES as readonly string[]).includes(value);
}

export function formatMoney(cents: number, currency: string): string {
  const amount = (Number.isFinite(cents) ? cents : 0) / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency.toUpperCase()}`;
  }
}

export function parseMajorAmountToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

export function centsToMajorInput(cents: number): string {
  return (cents / 100).toFixed(2);
}
