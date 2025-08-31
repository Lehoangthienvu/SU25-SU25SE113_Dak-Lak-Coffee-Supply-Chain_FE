export type CropSeasonDetailStatusValue = 'Planned' | 'InProgress' | 'Completed' | 'Cancelled';

export enum CropSeasonDetailStatusEnum {
  Planned = 0,
  InProgress = 1,
  Completed = 2,
  Cancelled = 3,
}

// Function để lấy label theo ngôn ngữ
export const getCropSeasonDetailStatusLabel = (
  status: CropSeasonDetailStatusValue,
  t: (key: string) => string
): string => {
  switch (status) {
    case 'Planned':
      return t('cropProgress.detailStatus.planned');
    case 'InProgress':
      return t('cropProgress.detailStatus.inProgress');
    case 'Completed':
      return t('cropProgress.detailStatus.completed');
    case 'Cancelled':
      return t('cropProgress.detailStatus.cancelled');
    default:
      return String(status);
  }
};

// Function để lấy display map theo ngôn ngữ
export const getCropSeasonDetailStatusMap = (t: (key: string) => string) => ({
  Planned: {
    label: t('cropProgress.detailStatus.planned'),
    color: 'gray' as const,
  },
  InProgress: {
    label: t('cropProgress.detailStatus.inProgress'),
    color: 'yellow' as const,
  },
  Completed: {
    label: t('cropProgress.detailStatus.completed'),
    color: 'green' as const,
  },
  Cancelled: {
    label: t('cropProgress.detailStatus.cancelled'),
    color: 'red' as const,
  },
});

// Legacy: Giữ lại để tương thích ngược (sẽ deprecated)
export const CropSeasonDetailStatusMap: Record<CropSeasonDetailStatusValue, {
  label: string;
  color: 'gray' | 'yellow' | 'green' | 'red';
}> = {
  Planned: {
    label: 'cropProgress.detailStatus.planned',
    color: 'gray',
  },
  InProgress: {
    label: 'cropProgress.detailStatus.inProgress',
    color: 'yellow',
  },
  Completed: {
    label: 'cropProgress.detailStatus.completed',
    color: 'green',
  },
  Cancelled: {
    label: 'cropProgress.detailStatus.cancelled',
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
