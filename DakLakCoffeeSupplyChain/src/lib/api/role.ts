import api from "./axios";

export type Role = {
  roleId: number;
  roleName: string;
};

export async function getBusinessAndFarmerRole(): Promise<Role[]> {
  const response = await api.get("/Roles/BusinessAndFarmer");
  return response.data;
}
