"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useBranch } from "./branch-context";
import { Content, Locale, branchContacts, contentFor } from "./content";

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

// On a branch page with its own phone and accounts (lib/content.ts branchContacts), `t` carries those.
export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  const branch = useBranch();
  return useMemo(() => {
    const own = branch ? branchContacts[branch] : undefined;
    return own ? { ...ctx, t: { ...ctx.t, ...own } } : ctx;
  }, [ctx, branch]);
}
