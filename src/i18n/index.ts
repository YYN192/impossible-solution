import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import bg from "./bg.json";
import en from "./en.json";

/** All kid-facing text lives in the JSON files. bg.json has exactly the same keys as en.json (see bg.copy.test.ts). */
export const resources = {
  en: { translation: en },
  bg: { translation: bg },
} as const;

export type Lang = keyof typeof resources;
export const LANGS = Object.keys(resources) as Lang[];
const STORAGE_KEY = "impossible-solution.lang";

const isLang = (v: unknown): v is Lang => typeof v === "string" && (LANGS as string[]).includes(v);

/** ?lang=bg in the URL wins, then the player's last choice, then English. */
function startLang(): Lang {
  try {
    const fromUrl = new URLSearchParams(globalThis.location?.search ?? "").get("lang");
    if (isLang(fromUrl)) return fromUrl;
    const saved = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    // Storage can be blocked (private mode); English is fine.
  }
  return "en";
}

i18n.use(initReactI18next).init({
  resources,
  lng: startLang(),
  fallbackLng: "en",
  // Resources are bundled, so init synchronously: the first render already has text.
  initAsync: false,
  // React already escapes output.
  interpolation: { escapeValue: false },
});

// Keep <html lang> in sync for screen readers and fonts, and remember the choice.
const onLang = (lng: string) => {
  if (typeof document !== "undefined") document.documentElement.lang = lng;
  try {
    if (isLang(lng)) globalThis.localStorage?.setItem(STORAGE_KEY, lng);
  } catch {
    // Not remembering the language is fine.
  }
};
if (typeof document !== "undefined") document.documentElement.lang = i18n.language;
i18n.on("languageChanged", onLang);

export default i18n;
