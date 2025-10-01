import api from "./axios";
import { FarmingCommitment } from "./farmingCommitments";

export type ProcurementPlan = {
  planId: string;
  planCode: string;
  title: string;
  description: string;
  totalQuantity: number;
  createdBy: {
    managerId: string;
    userId: string;
    managerCode: string;
    companyName: string;
    companyAddress: string;
    website: string;
    contactEmail: string;
  };
  startDate: string;
  endDate: string;
  progressPercentage: number;
  createdAt: string;
  updatedAt: string;
  status: string | number;
  procurementPlansDetails: Partial<ProcurementPlansDetails>[];
  commitments: Partial<FarmingCommitment>[];
  procurementPlansDetailsUpdateDto: Partial<ProcurementPlansDetails>[];
  //procurementPlansDetailsCreateDto: Partial<ProcurementPlansDetails>[];
};

export type ProcurementPlansDetails = {
  planDetailsId: string;
  planDetailCode: string;
  planId: string;
  coffeeTypeId: string;
  coffeeType: {
    coffeeTypeId: string;
    typeCode: string;
    typeName: string;
    botanicalName: string;
    description: string;
    typicalRegion: string;
    specialtyLevel: string;
  };
  processMethodId?: number | undefined;
  processingMethodName: string | undefined;
  targetQuantity: number;
  targetRegion: string;
  targetRegions: string[];
  minimumRegistrationQuantity: number;
  minPriceRange: number;
  maxPriceRange: number;
  expectedYieldPerHectare: number;
  note: string;
  progressPercentage: number;
  registeredQuantity: number;
  status: string | number;
  createdAt: string;
  updatedAt: string;
};

export async function getAllProcurementPlans(): Promise<ProcurementPlan[]> {
  const response = await api.get("/ProcurementPlans");
  return response.data;
}

export async function getAllAvailableProcurementPlans(): Promise<ProcurementPlan[]> {
  const response = await api.get("/ProcurementPlans/Available");
  return response.data;
}

export async function getProcurementPlanById(planId: string): Promise<ProcurementPlan | null> {
  const response = await api.get(`/ProcurementPlans/${planId}`);
  return response.data;
}

export async function getProcurementPlanDetailById(planId: string): Promise<ProcurementPlan | null> {
  const response = await api.get(`/ProcurementPlans/Available/${planId}`);
  return response.data;
}

export async function createProcurementPlan(data: Partial<ProcurementPlan>): Promise<ProcurementPlan | null> {
  const response = await api.post(`/ProcurementPlans`, data)
  return response.data
}

export async function updateProcurementPlan(planId: string, data: Partial<ProcurementPlan>): Promise<ProcurementPlan | null> {
  const response = await api.patch(`/ProcurementPlans/Update/${planId}`, data);
  return response.data;
}

export async function updateProcurementPlanStatus(
  planId: string,
  data: Partial<ProcurementPlan>
): Promise<ProcurementPlan | null> {
  const response = await api.patch(`/ProcurementPlans/UpdateStatus/${planId}`, data);
  return response.data;
}

export async function deleteProcurementPlan(planId: string): Promise<ProcurementPlan | null> {
  const response = await api.patch(`/ProcurementPlans/soft-delete/${planId}`);
  return response.data;
}
