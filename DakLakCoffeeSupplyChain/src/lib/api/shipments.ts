import api from "./axios";
import { ShipmentDeliveryStatusValue } from "@/lib/constants/shipmentDeliveryStatus";

// DTO tương ứng với ShipmentViewAllDto từ backend
export interface ShipmentViewAllDto {
  shipmentId: string;
  shipmentCode: string;
  orderId: string;
  orderCode: string;
  deliveryStaffId: string;
  deliveryStaffName: string;
  shippedQuantity?: number | null;
  shippedAt?: string | null;
  deliveryStatus: ShipmentDeliveryStatusValue;
  receivedAt?: string | null;
  createdAt: string;
}

export async function getAllShipments(): Promise<ShipmentViewAllDto[]> {
  const { data } = await api.get<ShipmentViewAllDto[]>("/Shipments");
  return data;
}

// DTO chi tiết lô giao hàng
export interface ShipmentDetailViewDto {
  shipmentDetailId: string;
  orderItemId: string;
  productName: string;
  quantity?: number | null;
  unit: string; // ProductUnit as string
  note: string;
  createdAt: string;
}

// Dùng khi tạo chi tiết CHO LÔ GIAO ĐÃ TỒN TẠI (cần shipmentId)
export interface ShipmentDetailCreateDto {
  shipmentId: string;
  orderItemId: string;
  quantity: number;
  unit: string; // ProductUnit as string
  note?: string;
}

export interface ShipmentDetailUpdateDto extends ShipmentDetailCreateDto {
  shipmentDetailId: string;
}

export interface ShipmentViewDetailsDto {
  shipmentId: string;
  shipmentCode: string;
  orderId: string;
  orderCode: string;
  deliveryStaffId: string;
  deliveryStaffName: string;
  shippedQuantity?: number | null;
  shippedAt?: string | null;
  deliveryStatus: ShipmentDeliveryStatusValue;
  receivedAt?: string | null;
  createdAt: string;
  createdByName: string;
  shipmentDetails: ShipmentDetailViewDto[];
  // optional: include order items for selection when adding shipment details
  orderItems?: {
    orderItemId: string;
    productName: string;
  }[];
}

// Dùng khi tạo mới một lô giao kèm chi tiết (KHÔNG có shipmentId trong từng detail)
export interface ShipmentDetailCreateInline {
  orderItemId: string;
  quantity: number;
  unit: string;
  note?: string;
}

export interface ShipmentCreateDto {
  orderId: string;
  deliveryStaffId: string;
  shippedQuantity?: number | null;
  shippedAt?: string | null; // ISO
  deliveryStatus: ShipmentDeliveryStatusValue;
  receivedAt?: string | null; // ISO
  shipmentDetails: ShipmentDetailCreateInline[];
}

export interface ShipmentUpdateDto extends ShipmentCreateDto {
  shipmentId: string;
  shipmentDetails: ShipmentDetailUpdateDto[];
}

export async function createShipment(payload: ShipmentCreateDto): Promise<string | null> {
  const res = await api.post("/Shipments", payload);
  const data = res.data;
  if (!data) return null;
  if (typeof data === "string") return data;
  if (typeof data === "object") {
    return (
      (data as any).shipmentId ||
      (data as any).id ||
      (data as any).data?.shipmentId ||
      null
    );
  }
  return null;
}

export async function updateShipment(
  shipmentId: string,
  payload: ShipmentUpdateDto
): Promise<void> {
  await api.put(`/Shipments/${shipmentId}`, payload);
}

export async function getShipmentDetails(
  shipmentId: string
): Promise<ShipmentViewDetailsDto> {
  const { data } = await api.get<ShipmentViewDetailsDto>(
    `/Shipments/${shipmentId}`
  );
  return data;
}

// Xoá mềm một dòng chi tiết lô giao
export async function softDeleteShipmentDetail(
  shipmentDetailId: string
): Promise<void> {
  await api.patch(`/ShipmentDetails/soft-delete/${shipmentDetailId}`);
}

export async function createShipmentDetail(
  payload: ShipmentDetailCreateDto
): Promise<ShipmentDetailViewDto> {
  const { data } = await api.post<ShipmentDetailViewDto>(
    "/ShipmentDetails",
    payload
  );
  return data;
}

export async function updateShipmentDetail(
  payload: ShipmentDetailUpdateDto
): Promise<ShipmentDetailViewDto> {
  const { data } = await api.put<ShipmentDetailViewDto>(
    `/ShipmentDetails/${payload.shipmentDetailId}`,
    payload
  );
  return data;
}

// Xoá mềm một lô giao
export async function softDeleteShipment(shipmentId: string): Promise<void> {
  await api.patch(`/Shipments/soft-delete/${shipmentId}`);
}

// DTO cho orders cần tạo shipment
export interface OrderForShipmentDto {
  orderId: string;
  orderCode: string;
  orderDate: string;
  status: string;
  totalOrderQuantity: number;
  totalDeliveredQuantity: number;
  totalRemainingQuantity: number;
  contractCode: string;
  deliveryBatchCode: string;
  orderItems: OrderItemForShipmentDto[];
}

export interface OrderItemForShipmentDto {
  orderItemId: string;
  productId?: string;
  productName: string;
  orderQuantity: number;
  deliveredQuantity: number;
  remainingQuantity: number;
  unit: string;
}

// API: Lấy danh sách orders cần tạo shipment
export async function getOrdersForShipment(): Promise<OrderForShipmentDto[]> {
  const { data } = await api.get<OrderForShipmentDto[]>("/Shipments/orders-for-shipment");
  return data;
}
