export type ProcurementPlanStatusValue = 'Draft' | 'Open' | 'Closed' | 'Cancelled';

export const ProcurementPlanStatusMap: Record<ProcurementPlanStatusValue, {
  label: string;
  color: 'green' | 'yellow' | 'blue' | 'red';
  icon: string; 
}> = {
  Open: {
    label: 'Đang mở',
    color: 'green',
    icon: 'O'
  },
  Closed: {
    label: 'Đã đóng',
    color: 'yellow',
    icon: 'C'
  },
  Draft: {
    label: 'Bản nháp',
    color: 'blue',
    icon: 'D'
  },
  Cancelled: {
    label: 'Đã hủy',
    color: 'red',
    icon: 'Đ'
  }
};

// Function để lấy status map với i18n
export const getProcurementPlanStatusMap = (t: (key: string) => string) => {
  return {
    Open: {
      label: t('procurementPlan.status.open'),
      color: 'green' as const,
      icon: 'O'
    },
    Closed: {
      label: t('procurementPlan.status.closed'),
      color: 'yellow' as const,
      icon: 'C'
    },
    Draft: {
      label: t('procurementPlan.status.draft'),
      color: 'blue' as const,
      icon: 'D'
    },
    Cancelled: {
      label: t('procurementPlan.status.cancelled'),
      color: 'red' as const,
      icon: 'Đ'
    }
  };
};
