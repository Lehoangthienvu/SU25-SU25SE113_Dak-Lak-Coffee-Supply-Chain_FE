import { CropSeasonStatusMap, CropSeasonStatusValue } from '@/lib/constants/cropSeasonStatus';
import { useTranslation } from 'react-i18next';
import FilterBadge from './FilterBadge';

interface FilterStatusPanelProps {
    selectedStatus: string | null;
    setSelectedStatus: (value: string | null) => void;
    statusCounts: Record<CropSeasonStatusValue, number>;
}

export default function FilterStatusPanel({
    selectedStatus,
    setSelectedStatus,
    statusCounts,
}: FilterStatusPanelProps) {
    const { t } = useTranslation();

    return (
        <div className="space-y-4">
            {/* FilterBadge cho tất cả */}
            <FilterBadge
                icon="📊"
                label={t('cropSeasons.list.filter.allStatuses')}
                count={
                    Object.values(statusCounts).reduce((sum, val) => sum + (val || 0), 0)
                }
                color="orange"
                active={selectedStatus === null}
                onClick={() => setSelectedStatus(null)}
            />

            {/* Các filter theo từng trạng thái */}
            {Object.entries(CropSeasonStatusMap).map(([key, { label, color, icon }]) => (
                <FilterBadge
                    key={key}
                    icon={icon}
                    label={label}
                    color={color}
                    count={statusCounts[key as CropSeasonStatusValue] || 0}
                    active={selectedStatus === key}
                    onClick={() => setSelectedStatus(key === selectedStatus ? null : key)}
                />
            ))}
        </div>
    );
}
