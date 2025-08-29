# Khắc phục lỗi hiển thị thông báo lỗi đăng nhập bị lặp lại

## Vấn đề
Trang đăng nhập hiển thị thông báo lỗi 2 lần thay vì hiển thị thông báo "sai tài khoản hoặc sai mật khẩu" như mong muốn.

## Nguyên nhân
1. **Trong trang login**: Sử dụng `alert()` để hiển thị lỗi
2. **Trong axios interceptor**: Khi có lỗi 401, gọi `authService.forceLogout()` hiển thị confirm dialog
3. Điều này tạo ra 2 thông báo lỗi cùng lúc

## Giải pháp đã thực hiện

### 1. Cải thiện trang Login (`src/app/auth/login/page.tsx`)
- **Thay thế `alert()`** bằng state `error` để hiển thị lỗi trong UI
- **Thêm component hiển thị lỗi** với icon AlertCircle và styling phù hợp
- **Lọc lỗi session/token** để tránh hiển thị trùng lặp với authService.forceLogout()
- **Clear error** khi submit form mới

### 2. Cải thiện Axios Interceptor (`src/lib/api/axios.ts`)
- **Kiểm tra trang hiện tại** trước khi gọi `authService.forceLogout()`
- **Tránh hiển thị dialog** khi đang ở trang login để tránh trùng lặp
- **Áp dụng cho cả lỗi 401 và 403**

### 3. Đơn giản hóa AuthService (`src/lib/auth/authService.ts`)
- **Thay thế dynamic import ConfirmDialog** bằng `window.confirm()` đơn giản
- **Tránh các vấn đề** có thể xảy ra với dynamic import

### 4. Cải thiện trang Register (`src/app/auth/register/page.tsx`)
- **Thay thế `alert()`** bằng state `generalError` 
- **Thêm component hiển thị lỗi** tương tự như login
- **Cải thiện xử lý lỗi** khi gửi lại email xác thực

## Kết quả
- ✅ Chỉ hiển thị **một thông báo lỗi duy nhất** cho mỗi lỗi
- ✅ **Thông báo lỗi đẹp hơn** với icon và styling phù hợp
- ✅ **Không còn trùng lặp** giữa alert và dialog
- ✅ **UX tốt hơn** với thông báo lỗi inline thay vì popup

## Cách test
1. Thử đăng nhập với thông tin sai
2. Kiểm tra chỉ hiển thị một thông báo lỗi
3. Thử đăng nhập với session hết hạn
4. Kiểm tra không có dialog trùng lặp

## Files đã thay đổi
- `src/app/auth/login/page.tsx`
- `src/app/auth/register/page.tsx` 
- `src/lib/api/axios.ts`
- `src/lib/auth/authService.ts`
