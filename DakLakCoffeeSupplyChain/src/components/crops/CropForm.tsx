'use client';

import { useState } from 'react';
import { OpenStreetMapInput } from './OpenStreetMapInput';
import { createCrop, updateCrop, CropUpdateDto } from '@/lib/api/crops';
import { CropStatus } from '@/lib/constants/cropStatus';
import { toast } from 'sonner';

interface CropFormProps {
    initialData?: CropUpdateDto;
    onSubmit: () => void;
    onCancel?: () => void;
}

export const CropForm: React.FC<CropFormProps> = ({
    initialData,
    onSubmit,
    onCancel
}) => {
    const [formData, setFormData] = useState({
        address: initialData?.address || '',
        farmName: initialData?.farmName || '',
        cropArea: initialData?.cropArea || '',
        status: CropStatus.Active
    });

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.address.trim() || !formData.farmName.trim()) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        // Kiểm tra địa chỉ có thuộc Đắk Lắk không
        const address = formData.address.toLowerCase();
        const isDakLakAddress = address.includes('đắk lắk') ||
            address.includes('dak lak') ||
            address.includes('buôn ma thuột') ||
            address.includes('buon ma thuot') ||
            address.includes('ea ') ||
            address.includes('krông') ||
            address.includes('krong') ||
            address.includes('cư ') ||
            address.includes('cu ') ||
            address.includes('lắk') ||
            address.includes('lak') ||
            address.includes('m\'drắk') ||
            address.includes('mdrak');

        if (!isDakLakAddress) {
            toast.error('Địa chỉ phải thuộc khu vực Đắk Lắk. Vui lòng chọn từ danh sách gợi ý.');
            return;
        }

        try {
            setLoading(true);

            if (initialData) {
                // Update existing crop
                await updateCrop({
                    cropId: initialData.cropId,
                    cropCode: initialData.cropCode,
                    address: formData.address,
                    farmName: formData.farmName,
                    cropArea: formData.cropArea ? parseFloat(formData.cropArea.toString()) : undefined,
                    status: formData.status,
                    note: undefined,
                    isApproved: undefined,
                    rejectReason: undefined
                });
                toast.success('Cập nhật vùng trồng thành công!');
            } else {
                // Create new crop
                await createCrop({
                    address: formData.address,
                    farmName: formData.farmName,
                    cropArea: formData.cropArea ? parseFloat(formData.cropArea.toString()) : undefined
                });
                toast.success('Tạo vùng trồng mới thành công!');
            }

            onSubmit();
        } catch (error: unknown) {
            console.error('Error saving crop:', error);
            const getErrorMessage = (err: unknown): string => {
                if (err && typeof err === 'object' && 'response' in err) {
                    const axiosError = err as { response?: { data?: unknown } };
                    // Check if data is a string (direct error message)
                    if (typeof axiosError.response?.data === 'string') {
                        return axiosError.response.data;
                    }
                    // Check if data has message property
                    if (axiosError.response?.data && typeof axiosError.response.data === 'object' && 'message' in axiosError.response.data) {
                        return (axiosError.response.data as { message: string }).message;
                    }
                    // Check if data has error property
                    if (axiosError.response?.data && typeof axiosError.response.data === 'object' && 'error' in axiosError.response.data) {
                        return (axiosError.response.data as { error: string }).error;
                    }
                }
                if (err && typeof err === 'object' && 'message' in err) {
                    return (err as { message: string }).message;
                }
                return 'Có lỗi xảy ra khi lưu crop';
            };
            toast.error(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {initialData ? 'Chỉnh sửa Crop' : 'Tạo Crop mới'}
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Địa chỉ trang trại <span className="text-red-500">*</span>
                        </label>
                        <OpenStreetMapInput
                            value={formData.address}
                            onChange={(address) => setFormData({ ...formData, address })}
                            placeholder="Nhập địa chỉ trong khu vực Đắk Lắk (VD: Ea H'leo, Buôn Ma Thuột)"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Tìm kiếm tự động chỉ trong khu vực Đắk Lắk
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tên trang trại <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.farmName}
                            onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Tên trang trại của bạn"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Diện tích (ha)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.cropArea}
                            onChange={(e) => setFormData({ ...formData, cropArea: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Trạng thái
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as CropStatus })}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            aria-label="Chọn trạng thái"
                        >
                            <option value={CropStatus.Active}>Hoạt động</option>
                            <option value={CropStatus.Inactive}>Không hoạt động</option>
                            <option value={CropStatus.Harvested}>Đã thu hoạch</option>
                            <option value={CropStatus.Processed}>Đã chế biến</option>
                            <option value={CropStatus.Sold}>Đã bán</option>
                            <option value={CropStatus.Other}>Khác</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Đang lưu...' : (initialData ? 'Cập nhật' : 'Tạo mới')}
                    </button>

                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Hủy
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
};
