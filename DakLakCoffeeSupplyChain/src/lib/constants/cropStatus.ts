export enum CropStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Harvested = 'Harvested',
  Processed = 'Processed',
  Sold = 'Sold',
  Other = 'Other'
}

export const CropStatusLabels: Record<CropStatus, string> = {
  [CropStatus.Active]: 'Hoạt động',
  [CropStatus.Inactive]: 'Không hoạt động',
  [CropStatus.Harvested]: 'Đã thu hoạch',
  [CropStatus.Processed]: 'Đã chế biến',
  [CropStatus.Sold]: 'Đã bán',
  [CropStatus.Other]: 'Khác'
};

export const CropStatusColors: Record<CropStatus, string> = {
  [CropStatus.Active]: 'bg-green-100 text-green-800',
  [CropStatus.Inactive]: 'bg-gray-100 text-gray-800',
  [CropStatus.Harvested]: 'bg-yellow-100 text-yellow-800',
  [CropStatus.Processed]: 'bg-blue-100 text-blue-800',
  [CropStatus.Sold]: 'bg-purple-100 text-purple-800',
  [CropStatus.Other]: 'bg-gray-100 text-gray-800'
};

export const CropStatusIconColors: Record<CropStatus, string> = {
  [CropStatus.Active]: 'text-green-500',
  [CropStatus.Inactive]: 'text-gray-500',
  [CropStatus.Harvested]: 'text-yellow-500',
  [CropStatus.Processed]: 'text-blue-500',
  [CropStatus.Sold]: 'text-purple-500',
  [CropStatus.Other]: 'text-gray-500'
};