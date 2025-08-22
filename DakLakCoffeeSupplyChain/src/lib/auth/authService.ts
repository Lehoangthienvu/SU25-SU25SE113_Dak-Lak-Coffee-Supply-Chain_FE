import { jwtDecode } from 'jwt-decode';

export interface DecodedToken {
  nameid: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  exp: number;
  iat: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string; // slug: "farmer", "manager", etc.
  roleRaw: string; // raw: "Farmer", "BusinessManager", etc.
  avatar?: string;
}

class AuthService {
  private static instance: AuthService;
  private tokenCheckInterval: NodeJS.Timeout | null = null;
  private readonly TOKEN_CHECK_INTERVAL = 30000; // Kiểm tra mỗi 30 giây (giống web thật)
  private readonly TOKEN_EXPIRY_WARNING = 180000; // Cảnh báo trước 3 phút (giống web thật)

  private constructor() {
    this.startTokenMonitoring();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Khởi tạo monitoring token
  private startTokenMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Chỉ kiểm tra token để biết trạng thái (không tự động đăng xuất)
    this.checkTokenStatus();

    // Thiết lập interval để kiểm tra trạng thái token (không tự động đăng xuất)
    this.tokenCheckInterval = setInterval(() => {
      this.checkTokenStatus();
    }, this.TOKEN_CHECK_INTERVAL);

    // KHÔNG lắng nghe storage change (để tránh tự động đăng xuất)
    // window.addEventListener('storage', this.handleStorageChange.bind(this));
    
    // KHÔNG cleanup khi đóng tab (để tránh xóa localStorage)
    // window.addEventListener('beforeunload', this.cleanup.bind(this));
  }

  // Kiểm tra trạng thái token (không tự động đăng xuất)
  private checkTokenStatus(): void {
    const token = this.getToken();
    if (!token) {
      return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const now = Date.now() / 1000;
      const timeUntilExpiry = decoded.exp - now;

      // Chỉ hiển thị thông tin, KHÔNG tự động đăng xuất
      if (timeUntilExpiry <= 0) {
        // Có thể hiển thị thông báo nhỏ ở UI thay vì đăng xuất
        this.showTokenExpiredNotification();
      } else if (timeUntilExpiry <= this.TOKEN_EXPIRY_WARNING / 1000) {
        // Có thể hiển thị thông báo nhỏ ở UI
        this.showTokenExpiringSoonNotification(timeUntilExpiry);
      }

    } catch {
      // Có thể hiển thị thông báo nhỏ ở UI
      this.showTokenInvalidNotification();
    }
  }

  // Hiển thị thông báo token hết hạn (không đăng xuất)
  private showTokenExpiredNotification(): void {
    // TODO: Có thể hiển thị toast notification nhỏ thay vì alert
    // toast.warning('Token đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.');
  }

  // Hiển thị thông báo token sắp hết hạn (không đăng xuất)
  private showTokenExpiringSoonNotification(_timeUntilExpiry: number): void {
    // TODO: Có thể hiển thị toast notification nhỏ
    // toast.info(`Phiên đăng nhập sẽ hết hạn trong ${Math.ceil(_timeUntilExpiry / 60)} phút`);
    // Sử dụng _timeUntilExpiry để tránh linter warning
    void _timeUntilExpiry;
  }

  // Hiển thị thông báo token không hợp lệ (không đăng xuất)
  private showTokenInvalidNotification(): void {
    // TODO: Có thể hiển thị toast notification nhỏ
    // toast.error('Token không hợp lệ. Vui lòng đăng nhập lại.');
  }

  // Hiển thị cảnh báo token sắp hết hạn
  private showExpiryWarning(timeUntilExpiry: number): void {
    const minutes = Math.ceil(timeUntilExpiry / 60);
    
    // Chỉ hiển thị cảnh báo một lần mỗi phút
    const warningKey = 'token_expiry_warning_shown';
    const lastWarning = localStorage.getItem(warningKey);
    const now = Date.now();
    
    if (!lastWarning || (now - parseInt(lastWarning)) > 60000) {
      localStorage.setItem(warningKey, now.toString());
      
      // Hiển thị thông báo sử dụng ConfirmDialog
      if (typeof window !== 'undefined') {
        this.showConfirmDialog(
          'Cảnh báo hết hạn',
          `Phiên đăng nhập sẽ hết hạn trong ${minutes} phút. Bạn có muốn gia hạn không?`,
          'Gia hạn',
          'Bỏ qua',
          () => {
            // Chuyển nhanh về trang đăng nhập
            window.location.replace('/auth/login');
          }
        );
      }
    }
  }

  // Xử lý thay đổi storage (đồng bộ giữa các tab)
  private handleStorageChange(event: StorageEvent): void {
    if (event.key === 'token' && !event.newValue) {
      // Token bị xóa ở tab khác
      this.forceLogout('Phiên đăng nhập đã bị đóng ở tab khác.');
    }
  }

  // Làm mới token (có thể implement sau)
  private async refreshToken(): Promise<void> {
    // TODO: Implement refresh token logic
  }

  // Đăng xuất cưỡng chế
  public forceLogout(message: string = 'Phiên đăng nhập đã kết thúc'): void {
    this.cleanup();
    
    // Hiển thị confirm dialog sử dụng ConfirmDialog component
    if (typeof window !== 'undefined') {
      this.showConfirmDialog(
        'Phiên đăng nhập đã kết thúc',
        `${message}\n\nBạn có muốn đăng nhập lại không?`,
        'Đăng nhập lại',
        'Ở lại',
        () => {
          // Chuyển hướng nhanh về trang đăng nhập
          window.location.replace('/auth/login');
        }
      );
    }
  }

  // Hiển thị confirm dialog sử dụng ConfirmDialog component
  private showConfirmDialog(
    title: string,
    description: string,
    confirmText: string,
    cancelText: string,
    onConfirm: () => void
  ): void {
    // Tạo element để render ConfirmDialog
    const dialogContainer = document.createElement('div');
    dialogContainer.id = 'auth-confirm-dialog';
    document.body.appendChild(dialogContainer);

    // Import và render ConfirmDialog
    Promise.all([
      import('@/components/ui/confirmDialog'),
      import('react'),
      import('react-dom/client')
    ]).then(([{ ConfirmDialog }, React, ReactDOM]) => {
      const root = ReactDOM.createRoot(dialogContainer);
      root.render(
        React.createElement(ConfirmDialog, {
          open: true,
          onOpenChange: (open: boolean) => {
            if (!open) {
              root.unmount();
              document.body.removeChild(dialogContainer);
            }
          },
          title,
          description,
          confirmText,
          cancelText,
          onConfirm: () => {
            onConfirm();
            root.unmount();
            document.body.removeChild(dialogContainer);
          }
        })
      );
    });
  }

  // Đăng xuất thủ công
  public logout(): void {
    this.cleanup();
    
    // Chuyển hướng về trang chính (homepage)
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }

  // Lấy token từ localStorage
  public getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  // Lấy thông tin user
  public getUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    
    const id = localStorage.getItem('user_id');
    const name = localStorage.getItem('user_name');
    const email = localStorage.getItem('email');
    const role = localStorage.getItem('user_role');
    const roleRaw = localStorage.getItem('user_role_raw');
    const avatar = localStorage.getItem('user_avatar');

    if (!id || !name || !email || !role) return null;

    // Nếu không có roleRaw, tạo từ role
    const finalRoleRaw = roleRaw || this.convertRoleToRaw(role);

    return {
      id,
      name,
      email,
      role,
      roleRaw: finalRoleRaw,
      avatar: avatar || undefined
    };
  }

  // Chuyển đổi role slug thành role raw
  private convertRoleToRaw(role: string): string {
    const roleMap: Record<string, string> = {
      'farmer': 'Farmer',
      'manager': 'BusinessManager', 
      'staff': 'BusinessStaff',
      'expert': 'AgriculturalExpert',
      'admin': 'Admin',
      'delivery': 'DeliveryStaff'
    };
    
    return roleMap[role] || role;
  }

  // Kiểm tra xem user có đang đăng nhập không
  public isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const now = Date.now() / 1000;
      return decoded.exp > now;
    } catch {
      return false;
    }
  }

  // Kiểm tra role
  public hasRole(allowedRoles: string[]): boolean {
    const user = this.getUser();
    if (!user) return false;
    return allowedRoles.includes(user.role);
  }

  // Cleanup resources
  private cleanup(): void {
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
      this.tokenCheckInterval = null;
    }

    // Xóa tất cả dữ liệu xác thực
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_name');
      localStorage.removeItem('email');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_role_raw');
      localStorage.removeItem('user_avatar');
      localStorage.removeItem('token_expiry_warning_shown');
    }
  }

  // Destroy instance (cho testing)
  public destroy(): void {
    this.cleanup();
    AuthService.instance = null as unknown as AuthService;
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

// Export các function tiện ích
export const {
  getToken,
  getUser,
  isAuthenticated,
  hasRole,
  logout,
  forceLogout
} = authService;
