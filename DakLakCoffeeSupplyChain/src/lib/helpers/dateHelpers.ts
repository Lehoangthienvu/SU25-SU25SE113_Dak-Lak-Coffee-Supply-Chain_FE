import { format } from "date-fns";

export const formatDate = (dateString: string | Date) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return format(date, "dd-MM-yyyy");
};

export const fromDateOnly = (dateString: string | Date) => {
  if (!dateString) return undefined;
  const date = new Date(dateString);
  // Đảm bảo chỉ lấy phần ngày, bỏ qua giờ, phút, giây để tránh lỗi múi giờ khi hiển thị
  date.setHours(0, 0, 0, 0);
  return format(date, "yyyy-MM-dd");
};

export const toDateOnly = (dateString: string | Date) => {
  if (!dateString) return undefined;
  const date = new Date(dateString);
  // Đảm bảo chỉ lấy phần ngày, bỏ qua giờ, phút, giây để tránh lỗi múi giờ khi hiển thị
  date.setHours(23, 59, 59, 999);
  return format(date, "yyyy-MM-dd");
};

export const getStartOfDay = (date: Date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
};

export const getEndOfDay = (date: Date) => {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
};

export const isSameDay = (date1: Date, date2: Date) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Tính toán ngày giao hàng dự kiến dựa trên ngày thu hoạch
 * @param expectedHarvestEnd - Ngày kết thúc thu hoạch dự kiến (ISO string)
 * @returns Object chứa ngày giao hàng bắt đầu và kết thúc
 */
export function calculateEstimatedDeliveryDates(expectedHarvestEnd: string): {
  estimatedDeliveryStart: string;
  estimatedDeliveryEnd: string;
} {
  let estimatedDeliveryStart = "";
  let estimatedDeliveryEnd = "";
  
  if (expectedHarvestEnd) {
    try {
      // Ngày giao hàng bắt đầu = ngày kế tiếp sau ngày kết thúc thu hoạch
      const harvestEndDate = new Date(expectedHarvestEnd);
      const deliveryStartDate = new Date(harvestEndDate);
      deliveryStartDate.setDate(deliveryStartDate.getDate() + 1);
      estimatedDeliveryStart = deliveryStartDate.toISOString().split('T')[0];
      
      // Ngày giao hàng kết thúc = ngày giao hàng bắt đầu + 1 ngày
      const deliveryEndDate = new Date(deliveryStartDate);
      deliveryEndDate.setDate(deliveryEndDate.getDate() + 1);
      estimatedDeliveryEnd = deliveryEndDate.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error calculating delivery dates:', error);
    }
  }
  
  return {
    estimatedDeliveryStart,
    estimatedDeliveryEnd,
  };
}
