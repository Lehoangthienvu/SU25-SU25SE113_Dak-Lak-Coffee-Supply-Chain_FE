export type CropSeasonDetailStatusValue = 'Planned' | 'InProgress' | 'Completed' | 'Cancelled';

export enum CropSeasonDetailStatusEnum {
  Planned = 0,
  InProgress = 1,
  Completed = 2,
  Cancelled = 3,
}

export const CropSeasonDetailStatusMap: Record<CropSeasonDetailStatusValue, {
  label: string;
  color: 'gray' | 'yellow' | 'green' | 'red';
}> = {
  Planned: {
    label: 'cropSeasons.detailStatus.planned',
    color: 'gray',
  },
  InProgress: {
    label: 'cropSeasons.detailStatus.inProgress',
    color: 'yellow',
  },
  Completed: {
    label: 'cropSeasons.detailStatus.completed',
    color: 'green',
  },
  Cancelled: {
    label: 'cropSeasons.detailStatus.cancelled',
    color: 'red',
  },
};

// Mapping number <-> string
export const CropSeasonDetailStatusNumberToValue: Record<number, CropSeasonDetailStatusValue> = {
  0: 'Planned',
  1: 'InProgress',
  2: 'Completed',
  3: 'Cancelled',
};

export const CropSeasonDetailStatusValueToNumber: Record<CropSeasonDetailStatusValue, number> = {
  Planned: 0,
  InProgress: 1,
  Completed: 2,
  Cancelled: 3,
};
