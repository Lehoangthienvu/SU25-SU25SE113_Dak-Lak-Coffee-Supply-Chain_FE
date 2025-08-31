import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import các file ngôn ngữ
import vi from './locales/vi.json';
import en from './locales/en.json';

// Khởi tạo i18n
i18n
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: vi },
      en: { translation: en }
    },
    lng: 'vi', // Mặc định tiếng Việt
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    },
    debug: false,
    keySeparator: '.',
    nsSeparator: false,
  });

// Chỉ thay đổi ngôn ngữ ở client-side sau khi hydration hoàn tất
if (typeof window !== 'undefined') {
  // Đợi hydration hoàn tất và đảm bảo không có hydration mismatch
  const savedLang = localStorage.getItem('i18nextLng');
  if (savedLang && savedLang !== 'vi') {
    // Sử dụng requestIdleCallback hoặc setTimeout với delay lớn hơn để đảm bảo hydration hoàn tất
    const changeLangAfterHydration = () => {
      i18n.changeLanguage(savedLang);
    };
    
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(changeLangAfterHydration);
    } else {
      setTimeout(changeLangAfterHydration, 200);
    }
  }

  // Lưu ngôn ngữ khi thay đổi
  i18n.on('languageChanged', (lng) => {
    localStorage.setItem('i18nextLng', lng);
  });
}



export default i18n;
