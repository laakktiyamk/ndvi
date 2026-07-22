import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import fi from './fi.json';

const savedLang = (localStorage.getItem('ndvi-lang') as 'en' | 'fi') ?? 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fi: { translation: fi },
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
