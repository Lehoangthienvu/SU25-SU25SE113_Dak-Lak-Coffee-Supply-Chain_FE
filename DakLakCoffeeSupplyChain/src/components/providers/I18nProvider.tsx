'use client';

import { useEffect } from 'react';
import i18n from '@/i18n';

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    // Khởi tạo i18n khi component mount
    console.log('🌐 I18nProvider: Khởi tạo hệ thống đa ngôn ngữ');
    console.log('🌐 Current language:', i18n.language);
    console.log('🌐 Available languages:', i18n.languages);
    console.log('🌐 i18n ready:', i18n.isInitialized);
    
    // Có thể thêm logic để detect language từ localStorage hoặc user preference
    const savedLanguage = localStorage.getItem('language');
    console.log('🌐 Saved language from localStorage:', savedLanguage);
    
    if (savedLanguage && i18n.languages.includes(savedLanguage)) {
      console.log('🌐 Changing language to:', savedLanguage);
      i18n.changeLanguage(savedLanguage);
    } else {
      console.log('🌐 No saved language or invalid language, using default');
    }

    return () => {
      console.log('🌐 I18nProvider: Dọn dẹp hệ thống đa ngôn ngữ');
    };
  }, []);

  return <>{children}</>;
}
