import en from "../../messages/en.json";
import es from "../../messages/es.json";
import te from "../../messages/te.json";

import type { Locale } from "./config";

export const messagesByLocale = {
  en,
  te,
  es,
} as const satisfies Record<Locale, typeof en>;

export type Messages = (typeof messagesByLocale)[Locale];

export function getMessagesForLocale(locale: Locale): Messages {
  return messagesByLocale[locale];
}
