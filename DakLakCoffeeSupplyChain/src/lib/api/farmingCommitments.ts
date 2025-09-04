// lib/api/farmingCommitments.ts
import api from "@/lib/api/axios";
export type FarmingCommitment = {
  commitmentId: string;
  commitmentCode: string;
  commitmentName: string;
  farmerId: string;
  farmerName: string;
  companyName: string;
  planTitle?: string;
  totalPrice: number;
  totalAdvancePayment: number;
  totalTaxPrice: number;
  planId: string;
  registrationId: string;
  note: string;
  commitmentDate: string; // ISO date string
  approvedAt?: string; // ISO date string - optional
  rejectReason: string;
  progressPercentage: number;
  totalRatingByBusiness: number;
  totalRatingByFarmer: number;
  farmingCommitmentDetails: Partial<FarmingCommitmentDetail>[];
  FarmingCommitmentsDetailsCreateDtos: Partial<FarmingCommitmentDetail>[];
  farmingCommitmentsDetailsUpdateDtos: Partial<FarmingCommitmentDetail>[];
  status: string | number; // e.g. "Pending", "Approved", "Rejected"
}

export type FarmingCommitmentDetail = {
  commitmentDetailId?: string;
  commitmentDetailCode: string;
  commitmentId: string;
  registrationDetailId: string;
  planDetailId: string;
  coffeeTypeName: string;
  confirmedPrice: number; // price per kg
  advancePayment: number;
  taxPrice: number;
  committedQuantity: number; // in kg
  deliveriedQuantity: number; // in kg
  estimatedDeliveryStart: string; // ISO date string
  estimatedDeliveryEnd: string; // ISO date string
  expectedHarvestStart?: string; // ISO date string - thời gian thu hoạch dự kiến từ đăng ký
  expectedHarvestEnd?: string; // ISO date string - thời gian thu hoạch dự kiến từ đăng ký
  note: string;
  progressPercentage: number;
  breachedReason: string;
  breachedAt: string;
  ratingByBusiness: number;
  ratingCommentByBusiness: string;
  ratingByFarmer: number;
  ratingCommentByFarmer: string;
  status: string | number; // e.g. "Pending", "Approved", "Rejected"
  contractDeliveryItemId?: string; // optional, if linked to a delivery contract
  createdAt: string;
  updatedAt: string;
}

// Lấy danh sách cam kết của Farmer
export async function getFarmerCommitments(): Promise<FarmingCommitment[]> {
  try {
    const res = await api.get<FarmingCommitment[]>("/FarmingCommitment/Farmer");
    return res.data;
  } catch {
    return [];
  }
}

// Lấy danh sách cam kết cho Business Manager
export async function getBusinessCommitments(): Promise<FarmingCommitment[]> {
  try {
    const res = await api.get<FarmingCommitment[]>("/FarmingCommitment/BusinessManager");
    return res.data;
  } catch {
    return [];
  }
}

// Lấy các cam kết còn trống để gán cho mùa vụ
export async function getAvailableCommitments(): Promise<FarmingCommitment[]> {
  try {
    const res = await api.get<FarmingCommitment[]>(
      "/FarmingCommitment/Farmer/AvailableForCropSeason"
    );
    return res.data;
  } catch {
    return [];
  }
}

// Lấy chi tiết 1 cam kết (nếu bạn vẫn muốn dùng cách này)
export async function getCommitmentById(commitmentId: string): Promise<FarmingCommitment | null> {
  try {
    const res = await api.get<FarmingCommitment>(`/FarmingCommitment/${commitmentId}`);
    return res.data;
  } catch {
    return null;
  }
}

export async function createFarmingCommitment(
  data: Partial<FarmingCommitment>
): Promise<FarmingCommitment | null> {
  const res = await api.post<FarmingCommitment>("/FarmingCommitment", data);
  return res.data;
}
export async function updateFarmingCommitment(
  commitmentId: string,
  data: Partial<FarmingCommitment>
): Promise<FarmingCommitment | null> {
  const res = await api.patch<FarmingCommitment>(`/FarmingCommitment/Update/${commitmentId}`, data);
  return res.data;
}

export async function updateFarmingCommitmentStatusByFarmer(data: Partial<FarmingCommitment>, commitmentId: string): Promise<FarmingCommitment | null> {
  const res = await api.patch<FarmingCommitment>(
      `/FarmingCommitment/UpdateStatusByFarmer/${commitmentId}`,
      data
    );
    return res.data;
}
