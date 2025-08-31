export type CropSeasonStatusValue = 'Active' | 'Paused' | 'Completed' | 'Cancelled';

export enum CropSeasonStatusEnum {
  Active = 0,
  Paused = 1,
  Completed = 2,
  Cancelled = 3,
}

export const CropSeasonStatusMap: Record<CropSeasonStatusValue, {
  label: string;
  color: 'green' | 'yellow' | 'blue' | 'red';
  icon: string;
}> = {
  Active: { label: 'cropSeasons.status.active', color: 'green', icon: 'Đ' },
  Paused: { label: 'cropSeasons.status.paused', color: 'yellow', icon: 'T' },
  Completed: { label: 'cropSeasons.status.completed', color: 'blue', icon: 'H' },
  Cancelled: { label: 'cropSeasons.status.cancelled', color: 'red', icon: 'Đ' },
};

export const CropSeasonStatusNumberToValue: Record<number, CropSeasonStatusValue> = {
  0: 'Active',
  1: 'Paused',
  2: 'Completed',
  3: 'Cancelled',
};

export const CropSeasonStatusValueToNumber: Record<CropSeasonStatusValue, number> = {
  Active: 0,
  Paused: 1,
  Completed: 2,
  Cancelled: 3,
};
