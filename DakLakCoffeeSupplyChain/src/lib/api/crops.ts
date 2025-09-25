import api from "./axios";

export interface CropCreateDto {
  address: string;
  farmName: string;
  cropArea?: number;
  status: 'Active' | 'Inactive' | 'Harvested' | 'Processed' | 'Sold';
}

export interface CropUpdateDto {
  cropId: string;
  cropCode: string;
  address: string;
  farmName: string;
  cropArea?: number;
  status: 'Active' | 'Inactive' | 'Harvested' | 'Processed' | 'Sold';
}

export interface CropViewAllDto {
  cropId: string;
  cropCode: string;
  address: string;
  farmName: string;
  cropArea?: number;
  status: string;
}

export interface CropViewDetailsDto {
  cropId: string;
  cropCode: string;
  address: string;
  farmName: string;
  cropArea?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdByName?: string;
  updatedByName?: string;
}

// API functions
export const getCrops = async (): Promise<CropViewAllDto[]> => {
  const response = await api.get('/crops');
  return response.data;
};

export const getCropById = async (id: string): Promise<CropViewDetailsDto> => {
  const response = await api.get(`/crops/${id}`);
  return response.data;
};

export const createCrop = async (data: CropCreateDto): Promise<CropViewAllDto> => {
  const response = await api.post('/crops', data);
  return response.data;
};

export const updateCrop = async (data: CropUpdateDto): Promise<CropViewAllDto> => {
  const response = await api.put(`/crops/${data.cropId}`, data);
  return response.data;
};

export const deleteCrop = async (id: string): Promise<void> => {
  await api.delete(`/crops/${id}`);
};
