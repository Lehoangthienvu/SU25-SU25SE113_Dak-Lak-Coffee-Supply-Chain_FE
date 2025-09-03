import api from "./axios";

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

// API: Xoá mềm một mặt hàng trong đợt giao hàng
export async function softDeleteContractDeliveryItem(deliveryItemId: string): Promise<void> {
  await api.patch(`/ContractDeliveryItems/soft-delete/${deliveryItemId}`);
}
