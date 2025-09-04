import api from "./axios";
import { ProductStatusValue } from "@/lib/constants/productStatus";

// Enum: ProductUnit
export enum ProductUnit {
  Kg = "Kg",
  Ta = "Ta", 
  Tan = "Tan"
}

// Mapping để hiển thị đơn vị tiếng Việt
export const ProductUnitLabel: Record<ProductUnit, string> = {
  [ProductUnit.Kg]: "Kg",
  [ProductUnit.Ta]: "Tạ", 
  [ProductUnit.Tan]: "Tấn"
};

// DTO: Option hiển thị sản phẩm trong dropdown (id + tên)
export interface ProductOption {
  productId: string;
  name: string;
  coffeeTypeName?: string;
  quantityAvailable?: number;
}

// DTO: Option cho processing batch dropdown
export interface ProcessingBatchOption {
  batchId: string;
  batchCode: string;
}

// DTO: Option cho inventory dropdown
export interface InventoryOption {
  inventoryId: string;
  location: string;
  inventoryCode: string;
  warehouseCode: string;
  warehouseName: string;
  warehouseCapacity?: number;
  // Thêm các trường mới để tự động điền form
  batchId?: string;
  batchCode?: string;
  coffeeTypeId?: string;
  coffeeTypeName?: string;
  quantity?: number;
  unit?: string;
}

// DTO: ProductViewAllDto tương ứng backend
export interface ProductViewAllDto {
  productId: string;
  productCode: string;
  productName: string;
  unitPrice?: number | null;
  quantityAvailable?: number | null;
  unit: string; // ProductUnit as string
  originRegion: string;
  evaluatedQuality: string;
  evaluationScore?: number | null;
  status: ProductStatusValue;
  createdAt: string;
  coffeeTypeName: string;
  inventoryLocation: string;
  batchCode: string;
}

// DTO: ProductViewDetailsDto tương ứng backend
export interface ProductViewDetailsDto {
  productId: string;
  productCode: string;
  productName: string;
  description: string;
  unitPrice?: number | null;
  quantityAvailable?: number | null;
  unit: string; // ProductUnit as string
  originRegion: string;
  originFarmLocation: string;
  geographicalIndicationCode: string;
  certificationUrl: string;
  evaluatedQuality: string;
  evaluationScore?: number | null;
  status: ProductStatusValue;
  approvalNote: string;
  approvedByName: string;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  coffeeTypeName: string;
  inventoryLocation: string;
  batchCode: string;
  // Các trường bổ sung từ API response
  batchId?: string;
  inventoryId?: string;
  coffeeTypeId?: string;
  // Các trường mới từ API
  inventoryCode?: string;
  warehouseName?: string;
  farmerName?: string;
}

// DTO: ProductCreateDto tương ứng backend
export interface ProductCreateDto {
  productName: string;
  description: string;
  unitPrice: number;
  quantityAvailable: number;
  unit: ProductUnit;
  batchId: string;
  inventoryId: string;
  coffeeTypeId: string;
  originRegion: string;
  originFarmLocation: string;
  geographicalIndicationCode: string;
  certificationUrl?: string;
  evaluatedQuality: string;
  evaluationScore?: number;
  status: ProductStatusValue;
  approvalNote: string;
}

// DTO: ProductUpdateDto tương ứng backend
export interface ProductUpdateDto {
  productId: string;
  productName: string;
  description: string;
  unitPrice: number;
  quantityAvailable: number;
  unit: ProductUnit;
  batchId: string;
  inventoryId: string;
  coffeeTypeId: string;
  originRegion: string;
  originFarmLocation: string;
  geographicalIndicationCode: string;
  certificationUrl?: string;
  evaluatedQuality: string;
  evaluationScore?: number;
  status: ProductStatusValue;
  approvalNote: string;
  approvedBy?: string;
  approvedAt?: string;
  // Các trường bổ sung từ API response
  batchCode?: string;
  inventoryLocation?: string;
  coffeeTypeName?: string;
}

// API: Lấy danh sách sản phẩm
export async function getAllProducts(): Promise<ProductViewAllDto[]> {
  const { data } = await api.get<ProductViewAllDto[]>("/Products");
  return data;
}

export async function getProductById(
  id: string
): Promise<ProductViewDetailsDto> {
  const { data } = await api.get<ProductViewDetailsDto>(`/Products/${id}`);
  return data;
}

// API: Tạo mới sản phẩm
export async function createProduct(payload: ProductCreateDto): Promise<string> {
  const { data } = await api.post<{ productId: string }>("/Products", payload);
  return data.productId;
}

// API: Cập nhật sản phẩm
export async function updateProduct(
  id: string,
  payload: ProductUpdateDto
): Promise<void> {
  await api.put(`/Products/${id}`, payload);
}

// API: Xoá mềm sản phẩm
export async function softDeleteProduct(id: string): Promise<void> {
  await api.patch(`/Products/soft-delete/${id}`);
}

// API: Lấy danh sách sản phẩm từ backend và map sang dạng ProductOption cho UI
export async function getProductOptions(): Promise<ProductOption[]> {
  // Prefer full products endpoint to include coffeeTypeName for filtering by type
  try {
    const { data } = await api.get<ProductViewAllDto[]>("/Products");
    return (data ?? []).map((p) => ({
      productId: p.productId,
      name: p.productName,
      coffeeTypeName: p.coffeeTypeName,
      quantityAvailable: p.quantityAvailable ?? undefined,
    }));
  } catch (err) {
    // Fallback to lowercase route if needed (may not include coffeeTypeName)
    const { data } = await api.get<
      { productId: string; productName: string; coffeeTypeName?: string; quantityAvailable?: number }[]
    >("/products");
    return (data ?? []).map((p) => ({
      productId: p.productId,
      name: p.productName,
      coffeeTypeName: (p as any).coffeeTypeName,
      quantityAvailable: (p as any).quantityAvailable,
    }));
  }
}

// API: Lấy danh sách processing batches cho dropdown
export async function getProcessingBatchOptions(): Promise<ProcessingBatchOption[]> {
  try {
    // Thử endpoint chính trước
    const { data } = await api.get<{ batchId: string; batchCode: string }[]>("/ProcessingBatch");
    return data.map((b) => ({
      batchId: b.batchId,
      batchCode: b.batchCode,
    }));
  } catch (error) {

    // Thử endpoint fallback
    try {
      const { data } = await api.get<{ batchId: string; batchCode: string }[]>("/processing-batch");
      return data.map((b) => ({
        batchId: b.batchId,
        batchCode: b.batchCode,
      }));
    } catch (fallbackError) {
      
      // Thử endpoint khác có thể có
      try {
        const { data } = await api.get<{ batchId: string; batchCode: string }[]>("/ProcessingBatches");
        return data.map((b) => ({
          batchId: b.batchId,
          batchCode: b.batchCode,
        }));
      } catch (finalError) {
        return [];
      }
    }
  }
}

// API: Lấy danh sách inventories cho dropdown
export async function getInventoryOptions(): Promise<InventoryOption[]> {
  try {
    // Thử endpoint chính trước - lấy inventory với warehouse info
    const { data } = await api.get<{
      inventoryId: string;
      inventoryCode: string;
      warehouseId: string;
      warehouseName: string;
      batchId: string;
      batchCode: string;
      productName: string;
      coffeeTypeName: string;
      quantity: number;
      unit: string;
    }[]>("/Inventories");
    
    const mappedData = data.map((i) => ({
      inventoryId: i.inventoryId,
      location: i.warehouseName, // Sử dụng warehouseName trực tiếp
      inventoryCode: i.inventoryCode,
      warehouseCode: i.inventoryCode, // Fallback vì không có warehouseCode
      warehouseName: i.warehouseName,
      warehouseCapacity: undefined, // Không có capacity trong response
      // Map thêm các trường mới
      batchId: i.batchId,
      batchCode: i.batchCode,
      coffeeTypeName: i.coffeeTypeName,
      quantity: i.quantity,
      unit: i.unit
    }));
    
    return mappedData;
  } catch (error) {
    
    // Thử endpoint fallback
    try {
      const { data } = await api.get<{
        inventoryId: string;
        inventoryCode: string;
        warehouseId: string;
        warehouseName: string;
        batchId: string;
        batchCode: string;
        productName: string;
        coffeeTypeName: string;
        quantity: number;
        unit: string;
      }[]>("/inventories");
      
      return data.map((i) => ({
        inventoryId: i.inventoryId,
        location: i.warehouseName,
        inventoryCode: i.inventoryCode,
        warehouseCode: i.inventoryCode,
        warehouseName: i.warehouseName,
        warehouseCapacity: undefined,
        // Map thêm các trường mới
        batchId: i.batchId,
        batchCode: i.batchCode,
        coffeeTypeName: i.coffeeTypeName,
        quantity: i.quantity,
        unit: i.unit
      }));
    } catch (fallbackError) {
      
      // Thử endpoint khác có thể có
      try {
        const { data } = await api.get<{
          inventoryId: string;
          inventoryCode: string;
          warehouseId: string;
          warehouseName: string;
          batchId: string;
          batchCode: string;
          productName: string;
          coffeeTypeName: string;
          quantity: number;
          unit: string;
        }[]>("/Inventory");
        
        return data.map((i) => ({
          inventoryId: i.inventoryId,
          location: i.warehouseName,
          inventoryCode: i.inventoryCode,
          warehouseCode: i.inventoryCode,
          warehouseName: i.warehouseName,
          warehouseCapacity: undefined,
          // Map thêm các trường mới
          batchId: i.batchId,
          batchCode: i.batchCode,
          coffeeTypeName: i.coffeeTypeName,
          quantity: i.quantity,
          unit: i.unit
        }));
      } catch (finalError) {
        return [];
      }
    }
  }
}

// API: Test function để lấy inventory detail với thông tin mới
export async function getInventoryDetailTest(id: string): Promise<any> {
  try {
    const { data } = await api.get(`/Inventories/${id}`);
    return data;
  } catch (error) {
    return null;
  }
}

// API: Lấy danh sách inventory chưa được tạo product
export async function getAvailableInventoryOptions(): Promise<InventoryOption[]> {
  try {
    // Thử gọi API backend để lấy inventory chưa có product
    try {
      const { data } = await api.get<InventoryOption[]>("/Inventories/available-for-product");
      console.log("Using backend API for available inventories:", data.length);
      return data;
    } catch (backendError) {
      console.log("Backend API not available, using frontend filtering");
    }
    
    // Fallback: Lọc ở frontend
    const allInventories = await getInventoryOptions();
    const { data: products } = await api.get<ProductViewAllDto[]>("/Products");
    
    console.log("All inventories:", allInventories.length);
    console.log("All products:", products.length);
    
    // Lọc ra những inventory chưa có product
    const availableInventories = allInventories.filter(inventory => {
      // Kiểm tra xem inventory này đã có product chưa
      const hasProduct = products.some(product => {
        // So sánh theo inventoryCode hoặc warehouseName
        return product.inventoryLocation === inventory.warehouseName ||
               (product as any).inventoryCode === inventory.inventoryCode ||
               product.inventoryLocation?.includes(inventory.warehouseName) ||
               inventory.warehouseName?.includes(product.inventoryLocation);
      });
      
      console.log(`Inventory ${inventory.inventoryCode} (${inventory.warehouseName}): hasProduct = ${hasProduct}`);
      
      return !hasProduct;
    });
    
    console.log(`Found ${availableInventories.length} available inventories out of ${allInventories.length} total`);
    return availableInventories;
  } catch (error) {
    console.error("Error getting available inventory options:", error);
    // Fallback: trả về tất cả inventory nếu có lỗi
    return await getInventoryOptions();
  }
}