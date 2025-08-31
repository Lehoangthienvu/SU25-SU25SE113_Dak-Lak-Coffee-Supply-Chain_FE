'use client';

import '@/i18n'; // Import để đảm bảo i18n được khởi tạo

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  return <>{children}</>;
}
