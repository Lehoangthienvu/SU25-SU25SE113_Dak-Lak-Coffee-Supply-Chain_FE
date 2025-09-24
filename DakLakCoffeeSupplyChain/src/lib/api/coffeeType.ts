import api from "@/lib/api/axios";

export type CoffeeType = {
  coffeeTypeId: string;
  typeName: string;
  typeCode: string;
  botanicalName?: string;
  description?: string;
  typicalRegion?: string;
  specialtyLevel?: string;
  status?: string;
  coffeeTypeCategory?: string;
  coffeeTypeParentId?: string;
  coffeeTypeParentName?: string;
};

export async function getCoffeeTypes(): Promise<CoffeeType[]> {
  const response = await api.get("/CoffeeType");
  return response.data;
}

export async function getCoffeeTypeById(coffeeTypeId: string): Promise<CoffeeType> {
  const response = await api.get(`/CoffeeType/${coffeeTypeId}`);
  return response.data;
}

export async function createCoffeeType(data: Partial<CoffeeType>): Promise<CoffeeType> {
  const response = await api.post("/CoffeeType", data);
  return response.data;
}

export async function updateCoffeeType(data: Partial<CoffeeType>, coffeeTypeId: string): Promise<CoffeeType> {
  const response = await api.put(`/CoffeeType/${coffeeTypeId}`, data);
  return response.data;
}

export async function deleteCoffeeType(coffeeTypeId: string): Promise<void> {
  await api.patch(`/CoffeeType/soft-delete/${coffeeTypeId}`);
}