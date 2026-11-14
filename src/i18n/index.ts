import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";

/** All kid-facing text lives in the JSON files. BG (bg.json) gets added here later with the same keys. */
export const resources = {
  en: { translation: en },
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  // Resources are bundled, so init synchronously: the first render already has text.
  initAsync: false,
  // React already escapes output.
  interpolation: { escapeValue: false },
});

// Keep <html lang> in sync for screen readers and fonts.
const setLang = (lng: string) => {
  if (typeof document !== "undefined") document.documentElement.lang = lng;
};
setLang(i18n.language);
i18n.on("languageChanged", setLang);

export default i18n;
