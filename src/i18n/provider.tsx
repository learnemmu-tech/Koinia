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
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";

import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  parseLocale,
  type Locale,
} from "@/i18n/config";

const localeMessages: Record<Locale, () => Promise<AbstractIntlMessages>> = {
  en: () => import("../../messages/en.json").then((module) => module.default),
  es: () => import("../../messages/es.json").then((module) => module.default),
  te: () => import("../../messages/te.json").then((module) => module.default),
};

type LocaleSwitcherContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LocaleSwitcherContext = createContext<LocaleSwitcherContextValue | null>(
  null
);

type I18nProviderProps = {
  initialLocale: Locale;
  messages: AbstractIntlMessages;
  children: ReactNode;
};

export function I18nProvider({
  initialLocale,
  messages: initialMessages,
  children,
}: I18nProviderProps) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [messages, setMessages] = useState(initialMessages);

  const setLocale = useCallback((nextLocale: Locale) => {
    const resolved = parseLocale(nextLocale);
    setCookie(LOCALE_COOKIE, resolved, {
      path: "/",
      maxAge: LOCALE_COOKIE_MAX_AGE,
      sameSite: "lax",
    });
    void localeMessages[resolved]().then((nextMessages) => {
      setMessages(nextMessages);
      startTransition(() => {
        setLocaleState(resolved);
        router.refresh();
      });
    });
  }, [router]);

  useEffect(() => {
    setLocaleState(initialLocale);
    setMessages(initialMessages);
  }, [initialLocale, initialMessages]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

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
