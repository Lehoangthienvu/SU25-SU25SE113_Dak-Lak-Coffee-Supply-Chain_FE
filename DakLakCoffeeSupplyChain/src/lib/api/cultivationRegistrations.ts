import api from "./axios";
import { CropViewAllDto } from "./crops";

export interface CultivationRegistration {
  registrationId: string;
  registrationCode: string;
  planId: string;
  farmerId: string;
  farmerName: string;
  farmerAvatarURL: string;
  farmerLicencesURL: string;
  farmerLocation: string;
  registeredArea: number; // in hectares
  registeredAt: string; // ISO date string
  totalWantedPrice: number; // total price for the registered area
  note: string;
  status: string | number;
  commitmentId?: string;
  commitmentStatus: string | number;
  cultivationRegistrationDetails: Partial<CultivationRegistrationDetail>[];
};
export interface CultivationRegistrationDetail {
  cultivationRegistrationDetailId: string;
  registrationId: string;
  planDetailId: string;
  estimatedYield: number; // in kg
  wantedPrice: number; // price per kg
  expectedHarvestStart: string; // ISO date string
  expectedHarvestEnd: string; // ISO date string
  coffeeType: string; // e.g. "Arabica", "Robusta"
  //processingMethod: string; // e.g. "Washed", "Natural"
  expectedYield: number; // in kg per hectare
  note: string;
  status: string | number; // e.g. "Pending", "Approved", "Rejected"
  registeredArea?: number; // in hectares
  cropId?: string;
  crop?: CropViewAllDto;
};

export async function getCultivationRegistrationsByPlanId(planId: string): Promise<CultivationRegistration[]> {
  const response = await api.get(`/CultivationRegistration/Available/${planId}`);
  return response.data;
}

export async function getCultivationRegistrationById(registrationId: string): Promise<CultivationRegistration | null> {
  const response = await api.get(`/CultivationRegistration/${registrationId}`);
  return response.data;
}

export async function createCultivationRegistration(
  data: Partial<CultivationRegistration>
): Promise<CultivationRegistration | null> {
  const response = await api.post(`/CultivationRegistration`, data);
  return response.data;
}

export async function updateCultivationRegistration(
  registrationId: string,
  data: Partial<CultivationRegistration>
): Promise<CultivationRegistration | null> {
  const response = await api.put(`/CultivationRegistration/${registrationId}`, data);
  return response.data;
}

export async function updateCultivationRegistrationDetailStatus(
  registrationDetailId: string,
  data: Partial<CultivationRegistrationDetail>
): Promise<CultivationRegistrationDetail | null> {
  const response = await api.patch(`/CultivationRegistration/Detail/UpdateStatus/${registrationDetailId}`, data);
  return response.data;
}

export async function getAllCultivationRegistrationsForCurrentUser(): Promise<CultivationRegistration[]> {
  const response = await api.get(`/CultivationRegistration/GetByUser`);
  return response.data;
}