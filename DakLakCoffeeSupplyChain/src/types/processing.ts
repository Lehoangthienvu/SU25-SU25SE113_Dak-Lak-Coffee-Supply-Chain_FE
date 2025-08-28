export interface ValidationError {
  errorKey: string;
  parameters: Record<string, any>;
  timestamp: string;
  errorType: string;
}

export interface ProcessedError {
  title: string;
  details: string[];
  severity: 'error' | 'warning' | 'info';
  actionRequired: string;
}

export interface ProcessingFormData {
  batchId: string;
  outputQuantity: number;
  outputUnit: string;
  wasteType?: string;
  wasteQuantity?: number;
  wasteUnit?: string;
  notes?: string;
}

export interface ProcessingWaste {
  wasteId: string;
  wasteCode: string;
  wasteType: string;
  quantity: number;
  unit: string;
  createdAt: string;
}

export interface ProcessingParameter {
  parameterId: string;
  parameterName: string;
  parameterValue: string;
  unit: string;
  recordedAt: string;
}

export interface MediaFile {
  mediaId: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  caption: string;
  uploadedAt: string;
}

export interface ProcessingBatchProgress {
  progressId: string;
  batchId: string;
  batchCode: string;
  stepIndex: number;
  stageId: number;
  stageName: string;
  stageDescription?: string;
  progressDate: string;
  outputQuantity?: number;
  outputUnit?: string;
  photoUrl?: string | null;
  videoUrl?: string | null;
  updatedByName?: string;
  createdAt: string;
  updatedAt: string;
  mediaFiles?: MediaFile[];
  wastes?: ProcessingWaste[];
  parameters?: ProcessingParameter[];
}

export interface ProcessingBatch {
  batchId: string;
  batchName: string;
  methodName: string;
  inputQuantity: number;
  inputUnit: string;
  status: string;
  currentStep: number;
  totalSteps: number;
}

export interface ApiResponse<T = any> {
  status: string;
  message: string;
  data?: T;
}
