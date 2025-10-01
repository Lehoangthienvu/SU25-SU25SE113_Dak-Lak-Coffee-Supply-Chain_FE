'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CropViewAllDto, CropViewDetailsDto, getCropById } from '@/lib/api/crops';
import { CropStatus, CropStatusLabels, CropStatusColors, CropStatusIconColors } from '@/lib/constants/cropStatus';
import { MapPin, Home, Ruler, Activity, Hash, Calendar, Edit, X, Loader2, Circle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

interface CropDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    crop: CropViewAllDto | null;
    onEdit?: (cropWithDetails: CropViewDetailsDto) => void;
}

export const CropDetailDialog: React.FC<CropDetailDialogProps> = ({
    open,
    onOpenChange,
    crop,
    onEdit
}) => {
    const [cropDetails, setCropDetails] = useState<CropViewDetailsDto | null>(null);
    const [loading, setLoading] = useState(false);

    const loadCropDetails = useCallback(async () => {
        if (!crop) return;

        try {
            setLoading(true);
            console.log('Loading crop details for ID:', crop.cropId);
            const details = await getCropById(crop.cropId);
            console.log('Crop details loaded:', details);
            console.log('CreatedAt:', details.createdAt);
            console.log('UpdatedAt:', details.updatedAt);
            setCropDetails(details);
        } catch (error) {
            console.error('Error loading crop details:', error);
            // Fallback data nếu API lỗi
            setCropDetails({
                ...crop,
                createdAt: '',
                updatedAt: '',
                createdBy: '',
                updatedBy: '',
                isDeleted: false
            });
        } finally {
            setLoading(false);
        }
    }, [crop]);

    useEffect(() => {
        if (open && crop) {
            loadCropDetails();
        }
    }, [open, crop, loadCropDetails]);

    if (!crop) return null;

    const getStatusColor = (status: CropStatus) => {
        return CropStatusColors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusIcon = (status: CropStatus) => {
        return <Circle className={`w-4 h-4 ${CropStatusIconColors[status]}`} />;
    };

    const getStatusLabel = (status: CropStatus) => {
        return CropStatusLabels[status] || status;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-3 pb-4 border-b border-orange-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                            <Home className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-gray-900">
                                Chi tiết vùng trồng
                            </DialogTitle>
                            <p className="text-sm text-gray-600 mt-1">
                                Thông tin chi tiết về vùng trồng cà phê
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Thông tin cơ bản */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Mã vùng trồng */}
                        <div className="md:col-span-2">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Hash className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm font-semibold text-gray-700">Mã vùng trồng</span>
                                </div>
                                <p className="text-lg font-mono text-gray-900">{crop.cropCode}</p>
                            </div>
                        </div>

                        {/* Tên trang trại */}
                        <div>
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Home className="w-4 h-4 text-orange-500" />
                                    <span className="text-sm font-semibold text-gray-700">Tên trang trại</span>
                                </div>
                                <p className="text-gray-900 font-medium">{crop.farmName}</p>
                            </div>
                        </div>

                        {/* Diện tích */}
                        <div>
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Ruler className="w-4 h-4 text-orange-500" />
                                    <span className="text-sm font-semibold text-gray-700">Diện tích</span>
                                </div>
                                <p className="text-gray-900 font-medium">
                                    {crop.cropArea ? `${crop.cropArea} ha` : 'Chưa cập nhật'}
                                </p>
                            </div>
                        </div>

                        {/* Trạng thái */}
                        <div className="md:col-span-2">
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Activity className="w-4 h-4 text-orange-500" />
                                    <span className="text-sm font-semibold text-gray-700">Trạng thái</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(crop.status)}
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(crop.status)}`}>
                                        {getStatusLabel(crop.status)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Địa chỉ */}
                    <div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <MapPin className="w-4 h-4 text-orange-500" />
                                <span className="text-sm font-semibold text-gray-700">Địa chỉ trang trại</span>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-gray-900">
                                    {cropDetails?.address || crop.address || 'Chưa cập nhật địa chỉ'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Thông tin bổ sung */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Ngày tạo */}
                        <div>
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm font-semibold text-gray-700">Ngày tạo</span>
                                </div>
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-gray-500">Đang tải...</span>
                                    </div>
                                ) : (
                                    <p className="text-gray-900">
                                        {cropDetails?.createdAt ? new Date(cropDetails.createdAt).toLocaleDateString('vi-VN') : 'Chưa có thông tin'}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Ngày cập nhật */}
                        <div>
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm font-semibold text-gray-700">Ngày cập nhật</span>
                                </div>
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-gray-500">Đang tải...</span>
                                    </div>
                                ) : (
                                    <p className="text-gray-900">
                                        {cropDetails?.updatedAt ? new Date(cropDetails.updatedAt).toLocaleDateString('vi-VN') : 'Chưa có thông tin'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="pt-6 border-t border-orange-100">
                    <div className="flex gap-3 w-full">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 h-11 border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            <X className="w-4 h-4 mr-2" />
                            Đóng
                        </Button>
                        {onEdit && cropDetails && (
                            <Button
                                type="button"
                                onClick={() => onEdit(cropDetails)}
                                className="flex-1 h-11 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold"
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Chỉnh sửa
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
