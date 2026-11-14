import "i18next";
import type en from "./en.json";

// Typed keys: t('title.strat') is a build error, so typos never reach kids.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: typeof en };
  }
}
