"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { setCookie } from "cookies-next";
import { NextIntlClientProvider } from "next-intl";

import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  parseLocale,
  type Locale,
} from "@/i18n/config";
import { getMessagesForLocale } from "@/i18n/messages";

type LocaleSwitcherContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LocaleSwitcherContext = createContext<LocaleSwitcherContextValue | null>(
  null
);

function readLocaleCookie(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const prefix = `${LOCALE_COOKIE}=`;
  const match = document.cookie
    .split("; ")
    .find((part) => part.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : undefined;
}

type I18nProviderProps = {
  initialLocale: Locale;
  children: ReactNode;
};

export function I18nProvider({ initialLocale, children }: I18nProviderProps) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((nextLocale: Locale) => {
    const resolved = parseLocale(nextLocale);
    setCookie(LOCALE_COOKIE, resolved, {
      path: "/",
      maxAge: LOCALE_COOKIE_MAX_AGE,
      sameSite: "lax",
    });
    startTransition(() => {
      setLocaleState(resolved);
      router.refresh();
    });
  }, [router]);

  useEffect(() => {
    const cookieLocale = parseLocale(readLocaleCookie());
    if (cookieLocale === initialLocale) {
      setLocaleState(initialLocale);
    }
  }, [initialLocale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const messages = useMemo(() => getMessagesForLocale(locale), [locale]);

  const value = useMemo(
    () => ({ locale, setLocale }),
    [locale, setLocale]
  );

  return (
    <NextIntlClientProvider
      key={locale}
      locale={locale}
      messages={messages}
      timeZone="UTC"
    >
      <LocaleSwitcherContext.Provider value={value}>
        {children}
      </LocaleSwitcherContext.Provider>
    </NextIntlClientProvider>
  );
}

export function useLocaleSwitcher() {
  const context = useContext(LocaleSwitcherContext);
  if (!context) {
    throw new Error("useLocaleSwitcher must be used within I18nProvider");
  }
  return context;
}
