"use client";

import { createContext, useContext, useCallback, ReactNode, useSyncExternalStore, useEffect } from "react";
import en from "@/locales/en.json";
import fr from "@/locales/fr.json";

type Language = "en" | "fr";
export type Translations = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  toggleLanguage: () => void;
}

const translations = { en, fr } as unknown as Record<Language, Translations>;

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

  // Apply language to document on mount and when language changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.lang = storedLanguage;
    }
  }, [storedLanguage]);

  const setLanguage = useCallback((lang: Language) => {
    localStorage.setItem("language", lang);
    // Trigger storage event for useSyncExternalStore
    window.dispatchEvent(new Event("storage"));
  }, []);

  const toggleLanguage = useCallback(() => {
    const newLang = storedLanguage === "fr" ? "en" : "fr";
    localStorage.setItem("language", newLang);
    // Trigger storage event for useSyncExternalStore
    window.dispatchEvent(new Event("storage"));
  }, [storedLanguage]);

  const value: LanguageContextType = {
    language: storedLanguage,
    setLanguage,
    t: translations[storedLanguage],
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
