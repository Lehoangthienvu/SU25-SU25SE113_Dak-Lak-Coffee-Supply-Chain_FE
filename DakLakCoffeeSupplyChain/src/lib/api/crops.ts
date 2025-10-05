import api from "./axios";
import { CropStatus } from "../constants/cropStatus";

export interface CropCreateDto {
  address: string;
  farmName: string;
  cropArea?: number;
  note?: string;
  images?: File[];
  videos?: File[];
  documents?: File[];
}

export interface CropUpdateDto {
  cropId: string;
  cropCode: string;
  address: string;
  farmName: string;
  cropArea?: number;
  note?: string;
  status: CropStatus;
  isApproved?: boolean | null;
  rejectReason?: string;
  
  // Media files for update
  images?: File[];
  videos?: File[];
  documents?: File[];
  
  // Existing media URLs to keep (comma-separated strings)
  existingImages?: string;
  existingVideos?: string;
  existingDocuments?: string;
}

export interface CropViewAllDto {
  cropId: string;
  cropCode: string;
  address: string;
  farmName: string;
  cropArea?: number;
  status: CropStatus;
  note?: string;
  isApproved?: boolean | null;
}

export interface DocumentInfoDto {
  fileName: string;
  url: string;
}

export interface CropViewDetailsDto {
  cropId: string;
  cropCode: string;
  address: string;
  farmName: string;
  cropArea?: number;
  status: CropStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  note?: string;
  isApproved?: boolean | null;
  approvedAt?: string;
  approvedBy?: string;
  rejectReason?: string;
  images?: string[];
  videos?: string[];
  documents?: string[]; // Backend returns List<string> URLs, not DocumentInfoDto[]
}

// API functions
export const getCrops = async (): Promise<CropViewAllDto[]> => {
  const response = await api.get('/crops');
  return response.data.data || response.data;
};

export const getCropById = async (id: string): Promise<CropViewDetailsDto> => {
  const response = await api.get(`/crops/${id}`);
  return response.data.data || response.data;
};

export const createCrop = async (data: CropCreateDto): Promise<CropViewAllDto> => {
  const formData = new FormData();
  
  // Add basic fields
  formData.append('address', data.address);
  formData.append('farmName', data.farmName);
  if (data.cropArea) {
    formData.append('cropArea', data.cropArea.toString());
  }
  if (data.note) {
    formData.append('note', data.note);
  }
  
  // Add files
  if (data.images) {
    data.images.forEach(file => formData.append('images', file));
  }
  if (data.videos) {
    data.videos.forEach(file => formData.append('videos', file));
  }
  if (data.documents) {
    data.documents.forEach(file => formData.append('documents', file));
  }
  
  const response = await api.post('/crops', formData);
  // Handle new response structure: { message: "...", data: {...} }
  return response.data.data || response.data.crop || response.data;
};

export const updateCrop = async (data: CropUpdateDto): Promise<CropViewAllDto> => {
  // Backend expects JSON body for update, not FormData
  const updatePayload = {
    cropId: data.cropId,
    cropCode: data.cropCode,
    address: data.address,
    farmName: data.farmName,
    cropArea: data.cropArea,
    status: data.status,
    note: data.note,
    isApproved: data.isApproved,
    rejectReason: data.rejectReason
  };
  
  const response = await api.put(`/crops/${data.cropId}`, updatePayload);
  // Handle new response structure: { message: "...", data: {...} }
  return response.data.data || response.data;
};

export const deleteCrop = async (id: string): Promise<void> => {
  await api.delete(`/crops/${id}/softDelete`);
};

// Hard delete (permanent deletion) - use with caution
export const hardDeleteCrop = async (id: string): Promise<void> => {
  await api.delete(`/crops/${id}/hardDelete`);
};

// Approve crop
export const approveCrop = async (id: string): Promise<CropViewDetailsDto> => {
  const response = await api.put(`/crops/${id}/approve`, {});
  return response.data.data || response.data;
};

// Reject crop
export const rejectCrop = async (id: string, reason: string): Promise<CropViewDetailsDto> => {
  const response = await api.put(`/crops/${id}/reject`, { rejectReason: reason });
  return response.data.data || response.data;
};

