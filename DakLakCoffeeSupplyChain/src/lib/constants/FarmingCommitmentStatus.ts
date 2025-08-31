export type FarmingCommitmentStatusValue = 'Pending' | 'Active' | 'Completed' | 'Cancelled' | 'Breached' | 'Rejected';

export const FarmingCommitmentStatusMap: Record<FarmingCommitmentStatusValue, {
  label: string;
  color: 'green' | 'yellow' | 'blue' | 'red' | 'gray';
  icon: string;
}> = {
  'Active': {
    label: 'Đang hoạt động',
    color: 'green',
    icon: 'A'
  },
  'Completed': {
    label: 'Đã hoàn thành',
    color: 'gray',
    icon: 'D'
  },
  'Pending': {
    label: 'Đang chờ duyệt',
    color: 'blue',
    icon: 'P'
  },
  'Cancelled': {
    label: 'Đã hủy hợp đồng',
    color: 'red',
    icon: 'C'
  },
  'Breached': {
    label: 'Đã bị vi phạm',
    color: 'red',
    icon: 'X'
  },
  'Rejected': {
    label: 'Đã bị từ chối',
    color: 'red',
    icon: 'X'
  }
};

export const getFarmingCommitmentStatusMap = (t: (key: string) => string) => {
  return {
    Pending: {
      label: t('farmingCommitment.status.pending'),
      color: 'blue' as const,
      icon: 'P'
    },
    Active: {
      label: t('farmingCommitment.status.active'),
      color: 'green' as const,
      icon: 'A'
    },
    Completed: {
      label: t('farmingCommitment.status.completed'),
      color: 'gray' as const,
      icon: 'D'
    },
    Cancelled: {
      label: t('farmingCommitment.status.cancelled'),
      color: 'red' as const,
      icon: 'C'
    },
    Breached: {
      label: t('farmingCommitment.status.breached'),
      color: 'red' as const,
      icon: 'X'
    },
    Rejected: {
      label: t('farmingCommitment.status.rejected'),
      color: 'red' as const,
      icon: 'X'
    }
  };
};
