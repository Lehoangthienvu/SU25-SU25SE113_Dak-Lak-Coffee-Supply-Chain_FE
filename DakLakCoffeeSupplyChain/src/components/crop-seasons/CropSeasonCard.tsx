'use client';

import { CropSeasonListItem as CropSeason } from '@/lib/api/cropSeasons';
import { FaUser, FaEdit, FaSeedling, FaCalendarAlt, FaMapMarkedAlt, FaTrash } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import StatusBadge from './StatusBadge';
import { CropSeasonStatusMap } from '@/lib/constants/cropSeasonStatus';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { deleteCropSeasonById } from '@/lib/api/cropSeasons';
import { AppToast } from '@/components/ui/AppToast';

interface Props {
    season: CropSeason;
    onReload: () => void;
}

export default function CropSeasonCard({ season, onReload }: Props) {
    const router = useRouter();
    const { t } = useTranslation();
    const [deleting, setDeleting] = useState(false);

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('vi-VN');
    };

    const handleRowClick = (event: React.MouseEvent) => {
        // Prevent navigation if clicking on the edit button
        if ((event.target as HTMLElement).closest('button')) {
            return;
        }
        router.push(`/dashboard/farmer/crop-seasons/${season.cropSeasonId}`);
    };

    const handleDelete = async (event: React.MouseEvent) => {
        event.stopPropagation();

        if (!confirm(t('cropSeasons.card.confirmDelete'))) {
            return;
        }

        try {
            setDeleting(true);
            const result = await deleteCropSeasonById(season.cropSeasonId);

            if (result.code === 200) {
                AppToast.success(result.message || t('cropSeasons.card.deleteSuccess'));
                onReload();
            } else {
                AppToast.error(result.message || t('cropSeasons.card.deleteError'));
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('cropSeasons.card.deleteError');
            AppToast.error(errorMessage);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <tr
            className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 transition-all duration-200 group cursor-pointer"
            onClick={handleRowClick}
        >
            <td className="px-4 py-3 text-left align-middle">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                        <FaSeedling className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <div className="font-medium text-gray-900 group-hover:text-orange-700 transition-colors">
                            {season.seasonName}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <FaUser className="w-3 h-3" />
                            <span>{t('cropSeasons.card.farmer')}</span>
                        </div>
                    </div>
                </div>
            </td>

            <td className="px-4 py-3 text-center align-middle">
                <div className="flex items-center justify-center gap-1">
                    <FaMapMarkedAlt className="w-3 h-3 text-orange-500" />
                    <span className="font-medium text-gray-700">{season.area} ha</span>
                </div>
            </td>

            <td className="px-4 py-3 text-center align-middle">
                <StatusBadge status={season.status} map={CropSeasonStatusMap} />
            </td>

            <td className="px-4 py-3 text-center align-middle">
                <div className="flex items-center justify-center gap-1">
                    <FaCalendarAlt className="w-3 h-3 text-blue-500" />
                    <div className="text-xs">
                        <div className="font-medium text-gray-700">
                            {formatDate(season.startDate)}
                        </div>
                        <div className="text-gray-500">{t('cropSeasons.card.to')} {formatDate(season.endDate)}</div>
                    </div>
                </div>
            </td>

            <td className="px-4 py-3 text-center align-middle">
                <div className="flex justify-center gap-1">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                            router.push(
                                `/dashboard/farmer/crop-seasons/${season.cropSeasonId}/edit`
                            )
                        }
                        className="text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-md"
                        title={t('cropSeasons.card.edit')}
                    >
                        <FaEdit className="w-3 h-3" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                        title={t('cropSeasons.card.delete')}
                    >
                        <FaTrash className="w-3 h-3" />
                    </Button>
                </div>
            </td>
        </tr>
    );
}
