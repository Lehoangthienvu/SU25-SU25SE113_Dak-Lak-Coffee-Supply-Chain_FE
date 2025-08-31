export type CultivationRegistrationDetailStatusValue = 'Pending' | 'Approved' | 'Rejected';

export const getCultivationRegistrationDetailStatusMap = (t: (key: string) => string) => ({
  'Approved': {
    label: t('cultivationRegistration.status.detailApproved'),
    color: 'green' as const,
    icon: 'A'
  },
  'Rejected': {
    label: t('cultivationRegistration.status.detailRejected'),
    color: 'red' as const,
    icon: 'R'
  },
  'Pending': {
    label: t('cultivationRegistration.status.detailPending'),
    color: 'blue' as const,
    icon: 'P'
  }
});

// Legacy export for backward compatibility
export const CultivationRegistrationDetailStatusMap = getCultivationRegistrationDetailStatusMap(() => '');
