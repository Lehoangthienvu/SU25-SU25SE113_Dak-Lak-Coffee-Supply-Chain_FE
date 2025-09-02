import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import các file ngôn ngữ
import vi from './locales/vi.json';
import en from './locales/en.json';
import procurementPlanVi from './locales/vi/procurement-plan-vi.json';
import procurementPlanEn from './locales/en/procurement-plan-en.json';
import farmingcommitmentVi from './locales/vi/farming-commitment.json';
import farmingcommitmentEn from './locales/en/farming-commitment.json';
import cultivationRegistrationVi from './locales/vi/cultivation-registration.json';
import cultivationRegistrationEn from './locales/en/cultivation-registration.json';
import marketplaceVi from './locales/vi/marketplace.json';
import marketplaceEn from './locales/en/marketplace.json';
import farmerDashboardVi from './locales/vi/farmer-dashboard.json';
import farmerDashboardEn from './locales/en/farmer-dashboard.json';
import profileVi from './locales/vi/profile.json';
import profileEn from './locales/en/profile.json';
import commonVi from './locales/vi/common.json';
import commonEn from './locales/en/common.json';
import contractVi from './locales/vi/contract.json';
import contractEn from './locales/en/contract.json';


// Khởi tạo i18n
i18n
  .use(initReactI18next)
  .init({
    resources: {
      vi: {
        translation: {
          ...vi,
          ...commonVi,
          ...procurementPlanVi,
          ...farmingcommitmentVi,
          ...cultivationRegistrationVi,
          ...marketplaceVi,
          ...farmerDashboardVi,
          ...profileVi,
          ...contractVi
        }
      },
      en: {
        translation: {
          ...en,
          ...commonEn,
          ...procurementPlanEn,
          ...farmingcommitmentEn,
          ...cultivationRegistrationEn,
          ...marketplaceEn,
          ...farmerDashboardEn,
          ...profileEn,
          ...contractEn
        }
      }
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
    // Sử dụng setTimeout với delay lớn hơn để đảm bảo hydration hoàn tất
    setTimeout(() => {
      i18n.changeLanguage(savedLang);
    }, 100);
  }

  // Lưu ngôn ngữ khi thay đổi
  i18n.on('languageChanged', (lng) => {
    localStorage.setItem('i18nextLng', lng);
  });
}



export default i18n;
