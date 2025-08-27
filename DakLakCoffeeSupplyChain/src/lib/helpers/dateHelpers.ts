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
