import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import translations, { type Language } from "./translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const SUPPORTED_LANGUAGES: Language[] = ["en", "fr", "es", "pt", "ar", "de", "hi", "zh", "yo", "ha"];

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  pt: "Português",
  ar: "العربية",
  de: "Deutsch",
  hi: "हिन्दी",
  zh: "中文",
  yo: "Yorùbá",
  ha: "Hausa",
};

function detectLanguage(): Language {
  const stored = localStorage.getItem("gm_language");
  if (stored && SUPPORTED_LANGUAGES.includes(stored as Language)) return stored as Language;
  const browser = navigator.language.split("-")[0].toLowerCase();
  if (SUPPORTED_LANGUAGES.includes(browser as Language)) return browser as Language;
  // Map common language aliases
  const map: Record<string, Language> = {
    "zh-hans": "zh", "zh-cn": "zh", "zh-tw": "zh",
  };
  const full = navigator.language.toLowerCase();
  if (map[full]) return map[full];
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectLanguage);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("gm_language", lang);
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
  };

  useEffect(() => {
    document.documentElement.setAttribute("dir", language === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", language);
  }, []);

  const t = (key: string, vars?: Record<string, string>): string => {
    const dict = translations[language] ?? translations.en;
    let str: string = (dict as Record<string, string>)[key] ?? (translations.en as Record<string, string>)[key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v);
      });
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
