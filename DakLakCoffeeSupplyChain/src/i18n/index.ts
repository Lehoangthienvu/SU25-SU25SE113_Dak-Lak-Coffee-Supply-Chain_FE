import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import các file ngôn ngữ
import vi from './locales/vi.json';
import en from './locales/en.json';

console.log('🌐 i18n: Starting initialization...');
console.log('🌐 i18n: Vietnamese keys available:', Object.keys(vi).slice(0, 5));
console.log('🌐 i18n: English keys available:', Object.keys(en).slice(0, 5));
console.log('🌐 i18n: sidebar.staffDashboard in vi:', !!(vi as any).sidebar?.staffDashboard);
console.log('🌐 i18n: sidebar.staffDashboard in en:', !!(en as any).sidebar?.staffDashboard);

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
    },
    debug: process.env.NODE_ENV === 'development', // Chỉ bật debug trong development
    keySeparator: '.',
    nsSeparator: ':',
    returnEmptyString: true,
    returnNull: true,
    returnObjects: true,
    missingKeyHandler: (lng, ns, key, res) => {
      console.warn(`🌐 i18n: Missing key "${key}" for language "${lng}"`);
      return key; // Trả về key gốc nếu không tìm thấy
    }
  });

// Log sau khi khởi tạo
console.log('🌐 i18n: Initialization complete');
console.log('🌐 i18n: Current language:', i18n.language);
console.log('🌐 i18n: Available languages:', i18n.languages);
console.log('🌐 i18n: Is initialized:', i18n.isInitialized);

// Test một số key để kiểm tra
console.log('🌐 i18n: Testing Vietnamese translations...');
console.log('🌐 i18n: vi.sidebar.staffDashboard.title:', i18n.t('sidebar.staffDashboard.title', { lng: 'vi' }));
console.log('🌐 i18n: vi.sidebar.staffDashboard.subtitle:', i18n.t('sidebar.staffDashboard.subtitle', { lng: 'vi' }));
console.log('🌐 i18n: vi.sidebar.cropSeasons:', i18n.t('sidebar.cropSeasons', { lng: 'vi' }));

console.log('🌐 i18n: Testing English translations...');
console.log('🌐 i18n: en.sidebar.staffDashboard.title:', i18n.t('sidebar.staffDashboard.title', { lng: 'en' }));
console.log('🌐 i18n: en.sidebar.staffDashboard.subtitle:', i18n.t('sidebar.staffDashboard.subtitle', { lng: 'en' }));
console.log('🌐 i18n: en.sidebar.cropSeasons:', i18n.t('sidebar.cropSeasons', { lng: 'en' }));

export default i18n;
