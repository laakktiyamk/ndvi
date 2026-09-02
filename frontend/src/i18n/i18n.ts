import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import fi from './fi.json';
import cropEn from './crops/en.json';
import cropFi from './crops/fi.json';

const savedLang = (localStorage.getItem('ndvi-lang') as 'en' | 'fi') ?? 'en';

i18n
  .use(initReactI18next)
  .init({
    ns: ['translation', 'crop'],
    defaultNS: 'translation',
    resources: {
      en: { translation: en, crop: cropEn },
      fi: { translation: fi, crop: cropFi },
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;