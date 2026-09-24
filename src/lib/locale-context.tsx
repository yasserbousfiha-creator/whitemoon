"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Content, Locale, contentFor } from "./content";

interface LocaleContextValue {
  locale: Locale;
  isArabic: boolean;
  t: Content;
  toggleLocale: () => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("ar");

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      isArabic: locale === "ar",
      t: contentFor(locale),
      toggleLocale: () => setLocale((prev) => (prev === "ar" ? "en" : "ar")),
    }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}
