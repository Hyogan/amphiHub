import { getLocales } from "expo-localization";
import "expo-sqlite/localStorage/install";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "./locales/en/common.json";
import enVerification from "./locales/en/verification.json";
import frCommon from "./locales/fr/common.json";
import frVerification from "./locales/fr/verification.json";

export type Language = "fr" | "en";

const STORAGE_KEY = "amphihub.language";

function initialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "fr" || stored === "en") return stored;
  } catch {
    // Fall through to the device language.
  }
  return getLocales()[0]?.languageCode === "en" ? "en" : "fr";
}

// Inline resources and initAsync:false make init synchronous, so the first render is already translated.
// If TypeScript says initAsync does not exist, your i18next is older: use initImmediate: false instead.
i18n.use(initReactI18next).init({
  resources: {
    fr: { common: frCommon, verification: frVerification },
    en: { common: enCommon, verification: enVerification },
  },
  lng: initialLanguage(),
  fallbackLng: "fr",
  defaultNS: "common",
  ns: ["common", "verification"],
  interpolation: { escapeValue: false },
  initAsync: false,
  react: { useSuspense: false },
});

export function setLanguage(language: Language) {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // The choice still applies for this session.
  }
  return i18n.changeLanguage(language);
}

export default i18n;
