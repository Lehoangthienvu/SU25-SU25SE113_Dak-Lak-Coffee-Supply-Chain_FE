'use client';

import { CropSeasonListItem as CropSeason } from '@/lib/api/cropSeasons';
import { FaUser, FaTrashAlt, FaEdit, FaEye, FaSeedling, FaCalendarAlt, FaMapMarkedAlt } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import StatusBadge from './StatusBadge';
import { CropSeasonStatusMap } from '@/lib/constants/cropSeasonStatus';
import { toast } from 'sonner';
import { deleteCropSeasonById } from '@/lib/api/cropSeasons';
import { Button } from '@/components/ui/button';

interface Props {
    season: CropSeason;
    onDeleted?: (id: string) => void;
}

export default function CropSeasonCard({ season, onDeleted }: Props) {
    const router = useRouter();

    const handleDelete = async () => {
        const confirmed = window.confirm('Bạn có chắc chắn muốn xoá mùa vụ này?');
        if (!confirmed) return;

        try {
            const result = await deleteCropSeasonById(season.cropSeasonId);
            if (result.code === 200) {
                toast.success('Đã xoá mùa vụ thành công.');
                onDeleted?.(season.cropSeasonId);
            } else {
                toast.error(result.message || 'Xoá mùa vụ thất bại.');
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi xoá mùa vụ.';
            toast.error(errorMessage);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('vi-VN');
    };

    return (
        <tr className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 transition-all duration-200 group">
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
                            <span>Nông dân</span>
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
                        <div className="text-gray-500">đến {formatDate(season.endDate)}</div>
                    </div>
                </div>
            </td>

            <td className="px-4 py-3 text-center align-middle">
                <div className="flex justify-center gap-1">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                            router.push(`/dashboard/farmer/crop-seasons/${season.cropSeasonId}`)
                        }
                        className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md"
                        title="Xem chi tiết"
                    >
                        <FaEye className="w-3 h-3" />
                    </Button>

                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                            router.push(
                                `/dashboard/farmer/crop-seasons/${season.cropSeasonId}/edit`
                            )
                        }
                        className="text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-md"
                        title="Sửa"
                    >
                        <FaEdit className="w-3 h-3" />
                    </Button>

                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDelete}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                        title="Xoá"
                    >
                        <FaTrashAlt className="w-3 h-3" />
                    </Button>
                </div>
            </td>
        </tr>
    );
}
