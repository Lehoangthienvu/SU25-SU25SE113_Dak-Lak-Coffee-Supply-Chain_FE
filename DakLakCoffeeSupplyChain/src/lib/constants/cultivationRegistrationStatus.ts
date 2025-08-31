export type CultivationRegistrationStatusValue = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export const getCultivationRegistrationStatusMap = (t: (key: string) => string) => ({
  'Approved': {
    label: t('cultivationRegistration.status.approved'),
    color: 'green' as const,
    icon: 'A'
  },
  'Rejected': {
    label: t('cultivationRegistration.status.rejected'),
    color: 'red' as const,
    icon: 'R'
  },
  'Pending': {
    label: t('cultivationRegistration.status.pending'),
    color: 'blue' as const,
    icon: 'P'
  },
  'Cancelled': {
    label: t('cultivationRegistration.status.cancelled'),
    color: 'red' as const,
    icon: 'C'
  },
});

// Legacy export for backward compatibility
export const CultivationRegistrationStatusMap = getCultivationRegistrationStatusMap(() => '');
