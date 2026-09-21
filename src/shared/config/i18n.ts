import i18n, { type TOptions } from "i18next";
import en from "../../locales/en.json";
import hi from "../../locales/hi.json";
import gu from "../../locales/gu.json";

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  gu: { translation: gu },
};

i18n.init({
  resources,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

