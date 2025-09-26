'use client';

import { useState } from 'react';
import { OpenStreetMapInput } from './OpenStreetMapInput';
import { createCrop } from '@/lib/api/crops';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Home, Ruler, Plus, X } from 'lucide-react';

interface CreateCropDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export const CreateCropDialog: React.FC<CreateCropDialogProps> = ({
    open,
    onOpenChange,
    onSuccess
}) => {
    const [formData, setFormData] = useState({
        address: '',
        farmName: '',
        cropArea: ''
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Clear previous errors
        setErrors({});

        if (!formData.address.trim() || !formData.farmName.trim()) {
            setErrors({ general: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
            return;
        }

        // Validate địa chỉ Đắk Lắk
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

            // Call API create
            await createCrop({
                address: formData.address,
                farmName: formData.farmName,
                cropArea: formData.cropArea ? parseFloat(formData.cropArea.toString()) : undefined
            });

            // Success - show toast and close dialog
            toast.success('Tạo vùng trồng thành công!');
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
                return 'Có lỗi xảy ra khi tạo vùng trồng';
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
        setFormData({
            address: '',
            farmName: '',
            cropArea: ''
        });
        setErrors({});
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-3 pb-4 border-b border-orange-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                            <Plus className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-gray-900">
                                Tạo vùng trồng mới
                            </DialogTitle>
                            <p className="text-sm text-gray-600 mt-1">
                                Thêm vùng trồng cà phê mới vào hệ thống
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
                                className="flex-1 h-11 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Đang tạo...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Tạo vùng trồng
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
