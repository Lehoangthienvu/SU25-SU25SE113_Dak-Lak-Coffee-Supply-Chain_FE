import api from "./axios";

export type REGIONS = {
  name: string;
  code: string;
  division_type: string;
  codename: string;
  phone_code: number;
  wards: Partial<wards>[];
}

type wards = {
  name: string;
  code: string;
  division_type: string;
  codename: string;
  province_code: number;
}

export async function getTargetRegionOptions(): Promise<REGIONS[]> {
  const response = await api.get("/Region/wards");
  //console.log("Fetched target region options:", response.data);
  return response.data;
}
