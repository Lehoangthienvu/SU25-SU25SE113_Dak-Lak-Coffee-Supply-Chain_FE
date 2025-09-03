import api from "./axios";

// DTO: Thông tin chi tiết của một mặt hàng trong đơn hàng
export interface OrderItemViewDto {
  orderItemId: string;
  contractDeliveryItemId: string;
  productId: string;
  productName: string;
  quantity?: number | null;
  unitPrice?: number | null;
  discountAmount?: number | null;
  totalPrice?: number | null;
  note: string;
}

// DTO: Payload tạo mặt hàng CHO ĐƠN HÀNG ĐÃ TỒN TẠI (bắt buộc có orderId)
export interface OrderItemCreateForOrder {
  orderId: string;
  contractDeliveryItemId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number | null;
  note?: string | null;
}

// DTO: Payload tạo mặt hàng NESTED TRONG CREATE ORDER (không có orderId)
export interface OrderItemCreateInline {
  contractDeliveryItemId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number | null;
  note?: string | null;
}

// DTO: Payload cập nhật mặt hàng trong đơn hàng
export interface OrderItemUpdateDto {
  orderItemId: string;
  orderId: string;
  contractDeliveryItemId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number | null;
  note?: string | null;
}

// API: Tạo mới mặt hàng đơn hàng
export async function createOrderItem(payload: OrderItemCreateForOrder): Promise<OrderItemViewDto> {
  const res = await api.post("/OrderItems", payload);
  return res.data as OrderItemViewDto;
}

// API: Cập nhật mặt hàng đơn hàng
export async function updateOrderItem(payload: OrderItemUpdateDto): Promise<OrderItemViewDto> {
  const res = await api.put(`/OrderItems/${payload.orderItemId}`, payload);
  return res.data as OrderItemViewDto;
}

// API: Xoá mềm mặt hàng đơn hàng
export async function softDeleteOrderItem(orderItemId: string): Promise<void> {
  await api.patch(`/OrderItems/soft-delete/${orderItemId}`);
}
