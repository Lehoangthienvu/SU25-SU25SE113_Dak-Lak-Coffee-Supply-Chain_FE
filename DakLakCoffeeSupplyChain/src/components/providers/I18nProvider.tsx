'use client';

import { useEffect, useState } from 'react';
import i18n from '@/i18n';

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Khởi tạo i18n khi component mount
    console.log('🌐 I18nProvider: Khởi tạo hệ thống đa ngôn ngữ');
    console.log('🌐 Current language:', i18n.language);
    console.log('🌐 Available languages:', i18n.languages);
    console.log('🌐 i18n ready:', i18n.isInitialized);

    // Đợi i18n được khởi tạo xong
    const initI18n = async () => {
      if (!i18n.isInitialized) {
        await i18n.init();
      }

      // Có thể thêm logic để detect language từ localStorage hoặc user preference
      const savedLanguage = localStorage.getItem('language');
      console.log('🌐 Saved language from localStorage:', savedLanguage);

      if (savedLanguage && i18n.languages.includes(savedLanguage)) {
        console.log('🌐 Changing language to:', savedLanguage);
        await i18n.changeLanguage(savedLanguage);
      } else {
        console.log('🌐 No saved language or invalid language, using default');
      }

      setIsReady(true);
    };

    initI18n();

    return () => {
      console.log('🌐 I18nProvider: Dọn dẹp hệ thống đa ngôn ngữ');
    };
  }, []);

  // Hiển thị loading hoặc đợi i18n sẵn sàng
  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải ngôn ngữ...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
