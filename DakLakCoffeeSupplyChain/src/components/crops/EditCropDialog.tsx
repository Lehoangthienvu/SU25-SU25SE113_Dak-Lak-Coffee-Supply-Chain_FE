'use client';

import { useState, useEffect } from 'react';
import { OpenStreetMapInput } from './OpenStreetMapInput';
import { updateCrop, CropViewAllDto } from '@/lib/api/crops';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Home, Ruler, Edit, X, Hash } from 'lucide-react';

interface EditCropDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    crop: CropViewAllDto | null;
}

export const EditCropDialog: React.FC<EditCropDialogProps> = ({
    open,
    onOpenChange,
    onSuccess,
    crop
}) => {
    console.log('EditCropDialog rendered with crop:', crop);
    const [formData, setFormData] = useState({
        address: '',
        farmName: '',
        cropArea: ''
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Load data khi crop thay đổi
    useEffect(() => {
        if (crop) {
            // Load crop data
            setFormData({
                address: crop.address || '',
                farmName: crop.farmName || '',
                cropArea: crop.cropArea?.toString() || ''
            });
        }
    }, [crop]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!crop) return;

        // Clear previous errors
        setErrors({});

        if (!formData.address.trim() || !formData.farmName.trim()) {
            setErrors({ general: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
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
            setErrors({ address: 'Địa chỉ phải thuộc khu vực Đắk Lắk. Vui lòng chọn từ danh sách gợi ý.' });
            return;
        }

        try {
            setLoading(true);

            // Call API update
            await updateCrop({
                cropId: crop.cropId,
                cropCode: crop.cropCode,
                address: formData.address,
                farmName: formData.farmName,
                cropArea: formData.cropArea ? parseFloat(formData.cropArea.toString()) : undefined
            });

            // Success - show toast and close dialog
            toast.success('Cập nhật vùng trồng thành công!');
            onSuccess();
            handleClose();
        } catch (error: unknown) {
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
                return 'Có lỗi xảy ra khi cập nhật vùng trồng';
            };

            const errorMessage = getErrorMessage(error);

            // Check if error is related to address duplication
            if (errorMessage.includes('địa chỉ') && (errorMessage.includes('đã được sử dụng') || errorMessage.includes('đã tồn tại'))) {
                setErrors({ address: errorMessage });
            } else {
                setErrors({ general: errorMessage });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setErrors({});
        onOpenChange(false);
    };

    if (!crop) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-3 pb-4 border-b border-orange-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                            <Edit className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-gray-900">
                                Chỉnh sửa vùng trồng
                            </DialogTitle>
                            <p className="text-sm text-gray-600 mt-1">
                                Cập nhật thông tin vùng trồng cà phê
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {errors.general && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-sm text-red-600">{errors.general}</p>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Mã Crop */}
                        <div className="md:col-span-2">
                            <div className="space-y-2">
                                <Label htmlFor="cropCode" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <Hash className="w-4 h-4 text-blue-500" />
                                    Mã vùng trồng
                                </Label>
                                <Input
                                    id="cropCode"
                                    type="text"
                                    value={crop.cropCode}
                                    disabled
                                    className="h-11 bg-gray-50 border-gray-200 text-gray-600"
                                />
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <Hash className="w-3 h-3" />
                                    Mã vùng trồng không thể thay đổi
                                </p>
                            </div>
                        </div>

                        {/* Địa chỉ trang trại */}
                        <div className="md:col-span-2">
                            <div className="space-y-2">
                                <Label htmlFor="address" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <MapPin className="w-4 h-4 text-orange-500" />
                                    Địa chỉ trang trại <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <OpenStreetMapInput
                                        value={formData.address}
                                        onChange={(address) => setFormData({ ...formData, address })}
                                        placeholder="Nhập địa chỉ trong khu vực Đắk Lắk (VD: Ea H'leo, Buôn Ma Thuột)"
                                        className="h-11 border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                                    />
                                </div>
                                {errors.address && (
                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {errors.address}
                                    </p>
                                )}
                                {!errors.address && (
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        Tìm kiếm tự động chỉ trong khu vực Đắk Lắk
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Tên trang trại */}
                        <div>
                            <div className="space-y-2">
                                <Label htmlFor="farmName" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <Home className="w-4 h-4 text-orange-500" />
                                    Tên trang trại <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="farmName"
                                    type="text"
                                    value={formData.farmName}
                                    onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                                    placeholder="Tên trang trại của bạn"
                                    className="h-11 border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                                    required
                                />
                            </div>
                        </div>

                        {/* Diện tích */}
                        <div>
                            <div className="space-y-2">
                                <Label htmlFor="cropArea" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <Ruler className="w-4 h-4 text-orange-500" />
                                    Diện tích (ha)
                                </Label>
                                <Input
                                    id="cropArea"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.cropArea}
                                    onChange={(e) => setFormData({ ...formData, cropArea: e.target.value })}
                                    placeholder="0.00"
                                    className="h-11 border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                                />
                            </div>
                        </div>

                    </div>

                    <DialogFooter className="pt-6 border-t border-orange-100">
                        <div className="flex gap-3 w-full">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={loading}
                                className="flex-1 h-11 border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-1 h-11 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Đang cập nhật...
                                    </>
                                ) : (
                                    <>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Cập nhật
                                    </>
                                )}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
