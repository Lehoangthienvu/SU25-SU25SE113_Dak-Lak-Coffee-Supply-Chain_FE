import api from "./axios";

export type SystemConfiguration = {
  name: string;
  description: string;
  minValue: number | null;
  maxValue: number | null;
  unit: string;
  isActive: boolean;
  effectedDateFrom: string;
  effectedDateTo: string | null;
  createdAt: string;
  updatedAt: string;
  targetEntity: string | null;
  targetField: string | null;
  operator: string | null;
  scopeType: string | null;
  scopeId: string | null;
  severity: string | null;
  ruleGroup: string | null;
  versionNo: string | null;
  createdBy: string | null;
  updatedBy: string | null;
};

export async function getAllSytemConfiguration(): Promise<SystemConfiguration[]> {
  const response = await api.get("/SystemConfiguration");
  return response.data;
}

export async function getSytemConfigurationByName(name: string): Promise<SystemConfiguration> {
  const response = await api.get(`/SystemConfiguration/${name}`);
  return response.data;
}
