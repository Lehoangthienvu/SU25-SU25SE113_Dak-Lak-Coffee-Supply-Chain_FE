import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import các file ngôn ngữ
import vi from './locales/vi.json';
import en from './locales/en.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: vi },
      en: { translation: en }
    },
    lng: 'vi', // ngôn ngữ mặc định
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;
