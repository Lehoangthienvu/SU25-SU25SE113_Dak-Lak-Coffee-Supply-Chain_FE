'use client';

import { useEffect } from 'react';
import { authService } from '@/lib/auth/authService';

interface AuthProviderProps {
    children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    useEffect(() => {
        // Khởi tạo authService khi component mount
        // authService sẽ tự động bắt đầu monitoring token
        console.log('🔐 AuthProvider: Khởi tạo hệ thống xác thực');

        // Cleanup khi component unmount
        return () => {
            console.log('🔐 AuthProvider: Dọn dẹp hệ thống xác thực');
        };
    }, []);

    return <>{children}</>;
}
