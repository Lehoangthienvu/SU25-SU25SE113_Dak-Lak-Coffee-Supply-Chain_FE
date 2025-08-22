import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
// export function getErrorMessage(error: unknown): string {
//   // Ưu tiên: lỗi trong response.message (thường là ServiceResult)
//   const axiosMsg = (error as any)?.response?.data?.message;
//   if (typeof axiosMsg === 'string') return axiosMsg;

//   // Xử lý lỗi dạng validation: response.data.errors
//   const validationErrors = (error as any)?.response?.data?.errors;
//   console.log("Validation errors:", error);
//   console.log("Validation errors1:", (error as any));
//   console.log("Validation errors4:", (error as any)?.data);
//   console.log("Validation errors5:", (error as any)?.Object);
//   console.log("Validation errors6:", (error as any)?.title);
//   console.log("Validation errors2:", (error as any)?.response);
//   console.log("Validation errors3:", (error as any)?.response?.data);
//   if (validationErrors && typeof validationErrors === 'object') {
//     console.error("Validation errors1:", validationErrors);
//     return Object.entries(validationErrors)
//       .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
//       .join('; ');
//   }

//   // Fallback: lỗi thông thường từ err.message
//   const msg = (error as any)?.message;
//   if (typeof msg === 'string') return msg;

//   // Trường hợp không rõ: fallback mặc định
//   return DEFAULT_ERROR_MESSAGE;
// }

type ValidationErrorResponse = {
  type?: string;
  title?: string;
  status?: number;
  errors?: {
    [field: string]: string[];
  };
  traceId?: string;
};

export function getErrorMessage(errorResponse: unknown): string {
  // Trường hợp đơn giản: chỉ là một chuỗi lỗi
  if (typeof errorResponse === 'string') {
    return errorResponse;
  }

  // Trường hợp ServiceResult từ ASP.NET Core backend
  if (
    errorResponse &&
    typeof errorResponse === 'object' &&
    'message' in errorResponse &&
    typeof (errorResponse as any).message === 'string'
  ) {
    return (errorResponse as any).message;
  }

  // Trường hợp dạng object với errors (validation errors từ backend)
  if (
    errorResponse &&
    typeof errorResponse === 'object' &&
    'errors' in errorResponse &&
    errorResponse.errors &&
    typeof errorResponse.errors === 'object'
  ) {
    const errorObj = (errorResponse as ValidationErrorResponse).errors!;
    const allMessages: string[] = [];

    for (const field in errorObj) {
      const fieldErrors = errorObj[field];
      if (Array.isArray(fieldErrors)) {
        // Thêm tên field vào message để user biết lỗi ở đâu
        const fieldName = getFieldDisplayName(field);
        fieldErrors.forEach(error => {
          allMessages.push(`${fieldName}: ${error}`);
        });
      }
    }

    if (allMessages.length > 0) {
      return allMessages.join('\n');
    }
  }

  // Nếu errorResponse là object lỗi form local: { [field: string]: string }
  if (
    errorResponse &&
    typeof errorResponse === 'object' &&
    !Array.isArray(errorResponse)
  ) {
    // Lọc các prop mà giá trị là chuỗi (có thể là lỗi)
    const allMessages: string[] = [];
    for (const key in errorResponse) {
      const val = (errorResponse as any)[key];
      if (typeof val === 'string' && val.trim() !== '') {
        allMessages.push(val);
      }
    }
    if (allMessages.length) {
      return allMessages.join('\n');
    }
  }

  // Nếu có title thì dùng làm fallback
  if (
    errorResponse &&
    typeof errorResponse === 'object' &&
    'title' in errorResponse &&
    typeof (errorResponse as any).title === 'string'
  ) {
    return (errorResponse as any).title;
  }

  // Fallback cuối cùng
  return 'Đã có lỗi không xác định xảy ra.';
}

// Helper function để chuyển đổi tên field thành tên hiển thị thân thiện
function getFieldDisplayName(field: string): string {
  const fieldMap: Record<string, string> = {
    'buyerId': 'Đối tác',
    'contractNumber': 'Số hợp đồng',
    'contractTitle': 'Tiêu đề hợp đồng',
    'contractFileUrl': 'File hợp đồng',
    'deliveryRounds': 'Số đợt giao hàng',
    'totalQuantity': 'Tổng khối lượng',
    'totalValue': 'Tổng giá trị',
    'startDate': 'Ngày bắt đầu',
    'endDate': 'Ngày kết thúc',
    'signedAt': 'Ngày ký',
    'status': 'Trạng thái',
    'cancelReason': 'Lý do hủy',
    'contractItems': 'Danh sách mặt hàng',
    'coffeeTypeId': 'Loại cà phê',
    'quantity': 'Số lượng',
    'unitPrice': 'Đơn giá',
    'discountAmount': 'Chiết khấu',
    'note': 'Ghi chú',
    'contractId': 'ID hợp đồng',
    'contractItemId': 'ID mặt hàng hợp đồng'
  };
  
  return fieldMap[field] || field;
}


// Hàm này format date thành "DD-MM-YYYY" và trả về "Chưa xác định" nếu api date là null
export function formatDate(dateStr: string | Date | undefined) {
  if (!dateStr) return "Chưa xác định";
  // Nếu trả về kiểu số (timestamp) thì xử lý lại cho phù hợp
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime()) || d.getFullYear() === 1970) return "Chưa xác định";
    // Lấy ngày/tháng/năm, pad số 0
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return "Chưa xác định";
  }
}

// Định dạng số lượng cà phê thành "kg" hoặc "tấn"
export function formatQuantity(value: number): string {
  return value >= 1000
    ? `${(value / 1000).toLocaleString()} tấn`
    : `${value.toLocaleString()} kg`;
}

// Tính đơn giá theo đơn vị khối lượng (kg/tấn)
export function formatUnitPriceByQuantity(unitPrice: number, quantity: number): string {
  return quantity >= 1000
    ? `${(unitPrice * 1000).toLocaleString()} VND/tấn`
    : `${unitPrice.toLocaleString()} VND/kg`;
}

// Định dạng giá trị chiết khấu kèm đơn vị VND
export function formatDiscount(value: number): string {
  return `${value.toLocaleString()} VND`;
}

// Format ngày và giờ thành "DD-MM-YYYY HH:mm", fallback nếu không hợp lệ
export function formatDateTimeVN(dateStr: string | Date | undefined) {
  if (!dateStr) return "Chưa xác định";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime()) || d.getFullYear() === 1970) return "Chưa xác định";
    
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  } catch {
    return "Chưa xác định";
  }
}

/** Chuyển Date hoặc string sang định dạng 'YYYY-MM-DD' để gửi API */
export function toDateOnly(d?: Date | string | null): string {
  if (!d) return "";                       // để trống khi chưa chọn
  if (d instanceof Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  // nếu là string 'YYYY-MM-DD' thì giữ nguyên 10 ký tự đầu
  return String(d).slice(0, 10);
}

/** Nhận string 'YYYY-MM-DD' hoặc Date, trả về Date (hoặc undefined nếu rỗng/invalid) */
export function fromDateOnly(v?: string | Date | null): Date | undefined {
  if (!v) return undefined;                 // null/undefined -> undefined
  if (v instanceof Date) return v;          // đã là Date thì trả về luôn
  const d = new Date(v);                    // string 'YYYY-MM-DD' -> Date
  return isNaN(d.getTime()) ? undefined : d;
}

export function getApiErrorMessage(err: any): string {
  // axios
  if (err?.response?.data) {
    const d = err.response.data;
    if (typeof d === "string" && d.trim()) return d;                      // plain text
    if (typeof d === "object") {
      if (typeof d.title === "string" && d.title) return d.title;
      if (typeof d.message === "string" && d.message) return d.message;
      if (d.errors && typeof d.errors === "object") {
        const first = Object.values(d.errors).flat?.()?.[0];
        if (first) return String(first);
      }
    }
  }
  // fetch wrapper tự ném { data: '...' }
  if (typeof err?.data === "string" && err.data.trim()) return err.data;
  if (typeof err?.message === "string" && err.message.trim()) return err.message;

  return "Đã xảy ra lỗi khi lưu đơn hàng.";
}
