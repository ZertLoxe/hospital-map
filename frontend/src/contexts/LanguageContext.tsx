"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useSyncExternalStore } from "react";
import en from "@/locales/en.json";
import fr from "@/locales/fr.json";

type Language = "en" | "fr";
type Translations = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  toggleLanguage: () => void;
}

const translations: Record<Language, Translations> = { en, fr };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Use useSyncExternalStore to read from localStorage without hydration issues
function getSnapshot(): Language {
  const savedLang = localStorage.getItem("language") as Language;
  if (savedLang && (savedLang === "en" || savedLang === "fr")) {
    return savedLang;
  }
  return "fr";
}

function getServerSnapshot(): Language {
  return "fr";
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const storedLanguage = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [language, setLanguageState] = useState<Language>(storedLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("language", lang);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const newLang = prev === "fr" ? "en" : "fr";
      if (typeof window !== "undefined") {
        localStorage.setItem("language", newLang);
      }
      return newLang;
    });
  }, []);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language],
    toggleLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
