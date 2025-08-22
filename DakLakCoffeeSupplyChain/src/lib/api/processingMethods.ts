import api from "./axios";

export interface ProcessingMethod {
  methodId: string;
  methodCode: string;
  name: string;
  description: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt?: string;
}

export const getAllProcessingMethods = async (): Promise<ProcessingMethod[]> => {
  try {
    const response = await api.get('/ProcessingMethod');
    return response.data;
  } catch (error) {
    console.error('Error fetching processing methods:', error);
    throw error;
  }
};

export const getProcessingMethodById = async (id: string): Promise<ProcessingMethod> => {
  try {
    const response = await api.get(`/ProcessingMethod/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching processing method:', error);
    throw error;
  }
};

export const createProcessingMethod = async (data: Partial<ProcessingMethod>): Promise<ProcessingMethod> => {
  try {
    const response = await api.post('/ProcessingMethod', data);
    return response.data;
  } catch (error) {
    console.error('Error creating processing method:', error);
    throw error;
  }
};

export const updateProcessingMethod = async (id: string, data: Partial<ProcessingMethod>): Promise<ProcessingMethod> => {
  try {
    const response = await api.put(`/ProcessingMethod/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating processing method:', error);
    throw error;
  }
};

export const deleteProcessingMethod = async (id: string): Promise<void> => {
  try {
    await api.delete(`/ProcessingMethod/${id}`);
  } catch (error) {
    console.error('Error deleting processing method:', error);
    throw error;
  }
};
