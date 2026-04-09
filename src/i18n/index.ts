import { useState, useCallback, createContext, useContext, createElement, type ReactNode } from "react";
import zhCN from "./zh-CN.json";
import enUS from "./en-US.json";

export type Locale = "zh-CN" | "en-US";

const messages: Record<Locale, Record<string, any>> = {
  "zh-CN": zhCN,
  "en-US": enUS,
};

function getNestedValue(obj: any, path: string): string {
  return path.split(".").reduce((acc, key) => acc?.[key], obj) ?? path;
}

export function useI18n(initialLocale?: Locale) {
  const [locale, setLocale] = useState<Locale>(initialLocale ?? detectLocale());

  const t = useCallback(
    (key: string, params?: Record<string, string>): string => {
      let text = getNestedValue(messages[locale], key);
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(`{${k}}`, v);
        }
      }
      return text;
    },
    [locale],
  );

  return { locale, setLocale, t };
}

function detectLocale(): Locale {
  if (typeof navigator !== "undefined") {
    const lang = navigator.language;
    if (lang.startsWith("zh")) return "zh-CN";
  }
  return "en-US";
}

// Context for sharing locale across components
interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const value = useI18n();
  return createElement(I18nContext.Provider, { value }, children);
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return ctx;
}
