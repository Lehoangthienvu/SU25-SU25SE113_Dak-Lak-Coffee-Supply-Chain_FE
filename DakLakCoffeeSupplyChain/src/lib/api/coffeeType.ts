import api from "@/lib/api/axios";

export type CoffeeType = {
  coffeeTypeId: string;
  typeName: string;
  typeCode: string;
  botanicalName?: string | null;
  description?: string;
  typicalRegion?: string;
  specialtyLevel?: string;
};

export async function getCoffeeTypes(): Promise<CoffeeType[]> {
  const response = await api.get("/CoffeeType");
  return response.data;
}

export async function getCoffeeTypeById(coffeeTypeId: string): Promise<CoffeeType> {
  const response = await api.get(`/CoffeeType/${coffeeTypeId}`);
  return response.data;
}

export async function createCoffeeType(coffeeType: Omit<CoffeeType, "coffeeTypeId">): Promise<CoffeeType> {
  const response = await api.post("/CoffeeType", coffeeType);
  return response.data;
}

export async function updateCoffeeType(coffeeTypeId: string, coffeeType: Partial<CoffeeType>): Promise<CoffeeType> {
  const response = await api.put(`/CoffeeType/${coffeeTypeId}`, coffeeType);
  return response.data;
}

export async function deleteCoffeeType(coffeeTypeId: string): Promise<void> {
  await api.patch(`/CoffeeType/soft-delete/${coffeeTypeId}`);
}