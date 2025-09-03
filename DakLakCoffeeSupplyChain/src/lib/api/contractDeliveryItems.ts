import api from "./axios";

// DTO: Thông tin mặt hàng trong đợt giao hàng
export interface ContractDeliveryItemViewDto {
  deliveryItemId: string;
  deliveryItemCode: string;
  contractItemId: string;
  coffeeTypeName: string;
  plannedQuantity: number;
  fulfilledQuantity: number | null;
  note: string;
}

// DTO: Tạo mới mặt hàng trong đợt giao hàng
export interface ContractDeliveryItemCreateDto {
  deliveryBatchId: string;
  contractItemId: string;
  plannedQuantity: number;
  note?: string;
}

// DTO: Cập nhật mặt hàng trong đợt giao hàng
export interface ContractDeliveryItemUpdateDto extends ContractDeliveryItemCreateDto {
  deliveryItemId: string;
  fulfilledQuantity?: number;
}

// API: Tạo mới một mặt hàng trong đợt giao hàng
export async function createContractDeliveryItem(dto: ContractDeliveryItemCreateDto) {
  return api.post("/ContractDeliveryItems", dto);
}

// API: Cập nhật một mặt hàng trong đợt giao hàng
export async function updateContractDeliveryItem(dto: ContractDeliveryItemUpdateDto) {
  return api.put(`/ContractDeliveryItems/${dto.deliveryItemId}`, dto);
}

// API: Lấy danh sách mặt hàng theo delivery batch ID
export async function getContractDeliveryItemsByBatchId(deliveryBatchId: string): Promise<ContractDeliveryItemViewDto[]> {
  const { data } = await api.get<ContractDeliveryItemViewDto[]>(`/ContractDeliveryItems/by-batch/${deliveryBatchId}`);
  return data;
}

// API: Xoá mềm một mặt hàng trong đợt giao hàng
export async function softDeleteContractDeliveryItem(deliveryItemId: string): Promise<void> {
  await api.patch(`/ContractDeliveryItems/soft-delete/${deliveryItemId}`);
}
