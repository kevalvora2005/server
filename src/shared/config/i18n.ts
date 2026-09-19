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

export const t = (key: string, options: TOptions = {}) => {
  const { lng = "en", ...rest } = options;
  return i18n.t(key, { ...rest, lng });
};

export default i18n;
