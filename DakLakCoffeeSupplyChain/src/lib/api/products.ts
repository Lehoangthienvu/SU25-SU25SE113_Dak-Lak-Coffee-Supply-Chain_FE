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
  const { data } = await api.get<
    { productId: string; productName: string }[]
  >("/products");
  return data.map((p) => ({
    productId: p.productId,
    name: p.productName,
  }));
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
    console.error("Error fetching processing batches from /ProcessingBatch:", error);
    
    // Thử endpoint fallback
    try {
      const { data } = await api.get<{ batchId: string; batchCode: string }[]>("/processing-batch");
      return data.map((b) => ({
        batchId: b.batchId,
        batchCode: b.batchCode,
      }));
    } catch (fallbackError) {
      console.error("Error fetching processing batches from /processing-batch:", fallbackError);
      
      // Thử endpoint khác có thể có
      try {
        const { data } = await api.get<{ batchId: string; batchCode: string }[]>("/ProcessingBatches");
        return data.map((b) => ({
          batchId: b.batchId,
          batchCode: b.batchCode,
        }));
      } catch (finalError) {
        console.error("Error fetching processing batches from /ProcessingBatches:", finalError);
        return [];
      }
    }
  }
}

// API: Lấy danh sách inventories cho dropdown
export async function getInventoryOptions(): Promise<InventoryOption[]> {
  try {
    // Thử endpoint chính trước - lấy inventory với warehouse info
    console.log("Fetching inventories from /Inventories...");
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
    
    console.log("Raw API response:", data);
    console.log("Response length:", data?.length);
    
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
    
    console.log("Mapped inventory options:", mappedData);
    return mappedData;
  } catch (error) {
    console.error("Error fetching inventories from /Inventories:", error);
    
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
      console.error("Error fetching inventories from /inventories:", fallbackError);
      
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
        console.error("Error fetching inventories from /Inventory:", finalError);
        return [];
      }
    }
  }
}

// API: Test function để lấy inventory detail với thông tin mới
export async function getInventoryDetailTest(id: string): Promise<any> {
  try {
    console.log("🧪 Testing inventory detail endpoint with id:", id);
    const { data } = await api.get(`/Inventories/${id}`);
    console.log("🧪 Inventory detail response:", data);
    console.log("🧪 All properties:", Object.keys(data));
    console.log("🧪 Farmer info:", {
      farmerId: data.farmerId,
      farmerName: data.farmerName,
      farmLocation: data.farmLocation
    });
    console.log("🧪 Evaluation info:", {
      evaluationResult: data.evaluationResult,
      totalScore: data.totalScore
    });
    return data;
  } catch (error) {
    console.error("🧪 Error testing inventory detail:", error);
    return null;
  }
}
