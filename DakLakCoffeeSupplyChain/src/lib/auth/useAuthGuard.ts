'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from './authService';

export function useAuthGuard(allowedRoles: string[] = []) {
  const router = useRouter();

  useEffect(() => {
    // Kiểm tra xác thực thông qua authService
    if (!authService.isAuthenticated()) {
      router.replace('/');
      return;
    }

    // Kiểm tra role
    if (allowedRoles.length > 0 && !authService.hasRole(allowedRoles)) {
      router.replace('/unauthorized');
    }
  }, [allowedRoles, router]);
}
