import api from "./axios";

export interface BusinessManagerDto {
  managerId: string;
  managerCode: string;
  companyName: string;
  companyAddress: string;
  taxId: number;
  website: string;
  department: string;
  contactEmail: string;
  businessLicenseUrl: string;
  isCompanyVerified: boolean;
  fullName: string;
  email: string;
  phoneNumber: string;
}

export async function getAllManagers(): Promise<Partial<BusinessManagerDto[]>> {
  const response = await api.get("/BusinessManagers");
  return response.data;
}

export async function getManagerById(managerId: string): Promise<Partial<BusinessManagerDto>> {
  const response = await api.get(`/BusinessManagers/${managerId}`);
  return response.data;
}

//Soft-delete
export async function deleteManager(managerId: string): Promise<void> {
  await api.patch(`/BusinessManagers/${managerId}`);
}

export async function createManager(managerData: BusinessManagerDto): Promise<Partial<BusinessManagerDto>> {
  const response = await api.post("/BusinessManagers", managerData);
  return response.data;
}

export async function updateManager(managerId: string, managerData: Partial<BusinessManagerDto>): Promise<Partial<BusinessManagerDto>> {
  const response = await api.patch(`/BusinessManagers/${managerId}`, managerData);
  return response.data;
}
