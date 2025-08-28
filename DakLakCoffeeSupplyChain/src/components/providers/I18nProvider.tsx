'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../../i18n';

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Khởi tạo i18n khi component mount
    console.log('🌐 I18nProvider: Khởi tạo hệ thống đa ngôn ngữ');
    console.log('🌐 Current language:', i18n.language);
    
    // Có thể thêm logic để detect language từ localStorage hoặc user preference
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && i18n.languages.includes(savedLanguage)) {
      i18n.changeLanguage(savedLanguage);
    }

    return () => {
      console.log('🌐 I18nProvider: Dọn dẹp hệ thống đa ngôn ngữ');
    };
  }, [i18n]);

  return <>{children}</>;
}
