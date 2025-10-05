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
  documents?: DocumentInfoDto[];
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
  return response.data;
};

export const updateCrop = async (data: CropUpdateDto): Promise<CropViewAllDto> => {
  const formData = new FormData();
  
  // Add basic fields
  formData.append('cropId', data.cropId);
  formData.append('cropCode', data.cropCode);
  formData.append('address', data.address);
  formData.append('farmName', data.farmName);
  if (data.cropArea) {
    formData.append('cropArea', data.cropArea.toString());
  }
  if (data.note) {
    formData.append('note', data.note);
  }
  formData.append('status', data.status);
  if (data.isApproved !== undefined && data.isApproved !== null) {
    formData.append('isApproved', data.isApproved.toString());
  }
  if (data.rejectReason) {
    formData.append('rejectReason', data.rejectReason);
  }
  
  // Add existing media URLs
  if (data.existingImages) {
    formData.append('existingImages', data.existingImages);
  }
  if (data.existingVideos) {
    formData.append('existingVideos', data.existingVideos);
  }
  if (data.existingDocuments) {
    formData.append('existingDocuments', data.existingDocuments);
  }
  
  // Add new media files
  if (data.images) {
    data.images.forEach(file => formData.append('images', file));
  }
  if (data.videos) {
    data.videos.forEach(file => formData.append('videos', file));
  }
  if (data.documents) {
    data.documents.forEach(file => formData.append('documents', file));
  }
  
  const response = await api.put(`/crops/${data.cropId}`, formData);
  return response.data;
};

export const deleteCrop = async (id: string): Promise<void> => {
  await api.delete(`/crops/${id}/softDelete`);
};

// Hard delete (permanent deletion) - use with caution
export const hardDeleteCrop = async (id: string): Promise<void> => {
  await api.delete(`/crops/${id}/hardDelete`);
};

// Approve crop
export const approveCrop = async (id: string): Promise<void> => {
  await api.put(`/crops/${id}/approve`, {});
};

// Reject crop
export const rejectCrop = async (id: string, reason: string): Promise<void> => {
  await api.put(`/crops/${id}/reject`, { rejectReason: reason });
};

