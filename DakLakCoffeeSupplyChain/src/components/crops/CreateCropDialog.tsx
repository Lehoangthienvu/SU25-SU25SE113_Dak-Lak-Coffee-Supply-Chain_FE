'use client';

import { useState } from 'react';
import { OpenStreetMapInput } from './OpenStreetMapInput';
import { createCrop } from '@/lib/api/crops';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Home, Ruler, Plus, X, Upload, Image, Video, File, Trash2 } from 'lucide-react';

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
        cropArea: '',
        note: ''
    });

    const [images, setImages] = useState<File[]>([]);
    const [videos, setVideos] = useState<File[]>([]);
    const [documents, setDocuments] = useState<File[]>([]);

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Validation functions
    const validateAddress = (address: string): string | null => {
        if (!address.trim()) {
            return 'Địa chỉ trang trại là bắt buộc';
        }
        if (address.trim().length < 10) {
            return 'Địa chỉ phải có ít nhất 10 ký tự';
        }
        if (address.trim().length > 200) {
            return 'Địa chỉ không được vượt quá 200 ký tự';
        }
        const lowerAddress = address.toLowerCase();
        const isDakLakAddress = lowerAddress.includes('đắk lắk') ||
            lowerAddress.includes('dak lak') ||
            lowerAddress.includes('buôn ma thuột') ||
            lowerAddress.includes('buon ma thuot') ||
            lowerAddress.includes('ea ') ||
            lowerAddress.includes('krông') ||
            lowerAddress.includes('krong') ||
            lowerAddress.includes('cư ') ||
            lowerAddress.includes('cu ') ||
            lowerAddress.includes('lắk') ||
            lowerAddress.includes('lak') ||
            lowerAddress.includes('m\'drắk') ||
            lowerAddress.includes('mdrak');

        if (!isDakLakAddress) {
            return 'Địa chỉ phải thuộc khu vực Đắk Lắk. Vui lòng chọn từ danh sách gợi ý.';
        }
        return null;
    };

    const validateFarmName = (farmName: string): string | null => {
        if (!farmName.trim()) {
            return 'Tên trang trại là bắt buộc';
        }
        if (farmName.trim().length < 3) {
            return 'Tên trang trại phải có ít nhất 3 ký tự';
        }
        if (farmName.trim().length > 100) {
            return 'Tên trang trại không được vượt quá 100 ký tự';
        }
        const farmNameRegex = /^[a-zA-ZÀ-ỹ0-9\s\-_.,()]+$/;
        if (!farmNameRegex.test(farmName.trim())) {
            return 'Tên trang trại chỉ được chứa chữ cái, số, dấu cách và các ký tự: - _ . , ( )';
        }
        return null;
    };

    const validateCropArea = (cropArea: string): string | null => {
        if (!cropArea || cropArea.trim() === '') {
            return null; // Optional field
        }
        const areaValue = parseFloat(cropArea);
        if (isNaN(areaValue)) {
            return 'Diện tích phải là số hợp lệ';
        }
        if (areaValue < 0) {
            return 'Diện tích phải là số dương';
        }
        if (areaValue > 10000) {
            return 'Diện tích không được vượt quá 10,000 ha';
        }
        if (areaValue < 0.01) {
            return 'Diện tích phải lớn hơn 0.01 ha';
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Clear previous errors
        setErrors({});

        // Validate all fields using validation functions
        const newErrors: { [key: string]: string } = {};

        const addressError = validateAddress(formData.address);
        if (addressError) {
            newErrors.address = addressError;
        }

        const farmNameError = validateFarmName(formData.farmName);
        if (farmNameError) {
            newErrors.farmName = farmNameError;
        }

        const cropAreaError = validateCropArea(formData.cropArea);
        if (cropAreaError) {
            newErrors.cropArea = cropAreaError;
        }

        // If there are validation errors, set them and return
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setLoading(true);

            // Call API create
            await createCrop({
                address: formData.address,
                farmName: formData.farmName,
                cropArea: formData.cropArea ? parseFloat(formData.cropArea.toString()) : undefined,
                note: formData.note,
                images: images.length > 0 ? images : undefined,
                videos: videos.length > 0 ? videos : undefined,
                documents: documents.length > 0 ? documents : undefined
            });

            // Success - show toast and close dialog
            toast.success('Tạo vùng trồng thành công!');
            onSuccess();
            handleClose();
        } catch (error: unknown) {
            const getErrorMessage = (err: unknown): string => {
                // Handle string errors (from axios interceptor)
                if (typeof err === 'string') {
                    return err;
                }

                if (err && typeof err === 'object' && 'response' in err) {
                    const axiosError = err as {
                        response?: {
                            data?: unknown;
                            status?: number;
                            statusText?: string;
                        }
                    };

                    // Check if data is a string (direct error message)
                    if (typeof axiosError.response?.data === 'string') {
                        return axiosError.response.data;
                    }

                    // Check if data is an object with various error message properties
                    if (axiosError.response?.data && typeof axiosError.response.data === 'object') {
                        const data = axiosError.response.data as Record<string, unknown>;

                        // Check for common error message properties
                        if (typeof data.message === 'string') return data.message;
                        if (typeof data.error === 'string') return data.error;
                        if (data.errors) {
                            // Handle validation errors array
                            if (Array.isArray(data.errors)) {
                                return data.errors.join(', ');
                            }
                            return String(data.errors);
                        }
                        if (typeof data.title === 'string') return data.title;
                        if (typeof data.detail === 'string') return data.detail;

                        // Check for nested error objects
                        if (data.error && typeof data.error === 'object') {
                            const errorObj = data.error as Record<string, unknown>;
                            if (typeof errorObj.message === 'string') return errorObj.message;
                            if (typeof errorObj.detail === 'string') return errorObj.detail;
                        }
                    }

                    // Fallback to status text if available
                    if (axiosError.response?.statusText) {
                        return axiosError.response.statusText;
                    }
                }

                if (err && typeof err === 'object' && 'message' in err) {
                    return (err as { message: string }).message;
                }

                return 'Có lỗi xảy ra khi tạo vùng trồng';
            };

            const errorMessage = getErrorMessage(error);

            // Check if error is related to specific fields
            const lowerErrorMessage = errorMessage.toLowerCase();

            // Check for address-related errors (duplicate, already exists, etc.)
            if (lowerErrorMessage.includes('địa chỉ') || lowerErrorMessage.includes('address')) {
                setErrors({ address: errorMessage });
            } else if (lowerErrorMessage.includes('tên trang trại') || lowerErrorMessage.includes('farm name') || lowerErrorMessage.includes('farmname')) {
                setErrors({ farmName: errorMessage });
            } else if (lowerErrorMessage.includes('diện tích') || lowerErrorMessage.includes('area') || lowerErrorMessage.includes('croparea')) {
                setErrors({ cropArea: errorMessage });
            } else if (lowerErrorMessage.includes('đã được sử dụng') ||
                lowerErrorMessage.includes('đã tồn tại') ||
                lowerErrorMessage.includes('already exists') ||
                lowerErrorMessage.includes('duplicate') ||
                lowerErrorMessage.includes('trùng lặp') ||
                lowerErrorMessage.includes('đã có') ||
                lowerErrorMessage.includes('conflict') ||
                lowerErrorMessage.includes('unique') ||
                lowerErrorMessage.includes('constraint')) {
                // Generic duplicate/constraint error - assume it's address related for now
                setErrors({ address: errorMessage });
            } else if (lowerErrorMessage.includes('validation') ||
                lowerErrorMessage.includes('required') ||
                lowerErrorMessage.includes('invalid') ||
                lowerErrorMessage.includes('bắt buộc') ||
                lowerErrorMessage.includes('không hợp lệ')) {
                // Generic validation error - show as toast for now
                toast.error(errorMessage);
            } else {
                // For general errors, show as toast instead of inline error
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            address: '',
            farmName: '',
            cropArea: '',
            note: ''
        });
        setImages([]);
        setVideos([]);
        setDocuments([]);
        setErrors({});
        onOpenChange(false);
    };

    // File upload handlers
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setImages(prev => [...prev, ...files]);
    };

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setVideos(prev => [...prev, ...files]);
    };

    const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setDocuments(prev => [...prev, ...files]);
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const removeVideo = (index: number) => {
        setVideos(prev => prev.filter((_, i) => i !== index));
    };

    const removeDocument = (index: number) => {
        setDocuments(prev => prev.filter((_, i) => i !== index));
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
                                        onChange={(address) => {
                                            setFormData({ ...formData, address });
                                            // Real-time validation for address
                                            const addressError = validateAddress(address);
                                            setErrors(prev => ({
                                                ...prev,
                                                address: addressError || ''
                                            }));
                                        }}
                                        placeholder="Nhập địa chỉ trong khu vực Đắk Lắk (VD: Ea H'leo, Buôn Ma Thuột)"
                                        hasError={!!errors.address}
                                    />
                                </div>
                                {errors.address ? (
                                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                        <MapPin className="w-3 h-3" />
                                        {errors.address}
                                    </p>
                                ) : (
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
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
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData({ ...formData, farmName: value });
                                        // Real-time validation for farm name
                                        const farmNameError = validateFarmName(value);
                                        setErrors(prev => ({
                                            ...prev,
                                            farmName: farmNameError || ''
                                        }));
                                    }}
                                    placeholder="Tên trang trại của bạn"
                                    className={`h-11 border-orange-200 focus:border-orange-500 focus:ring-orange-500 ${errors.farmName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                                        }`}
                                    required
                                />
                                {errors.farmName && (
                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                        <Home className="w-3 h-3" />
                                        {errors.farmName}
                                    </p>
                                )}
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
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData({ ...formData, cropArea: value });
                                        // Real-time validation for crop area
                                        const cropAreaError = validateCropArea(value);
                                        setErrors(prev => ({
                                            ...prev,
                                            cropArea: cropAreaError || ''
                                        }));
                                    }}
                                    placeholder="0.00"
                                    className={`h-11 border-orange-200 focus:border-orange-500 focus:ring-orange-500 ${errors.cropArea ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                                        }`}
                                />
                                {errors.cropArea && (
                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                        <Ruler className="w-3 h-3" />
                                        {errors.cropArea}
                                    </p>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* File Upload Section */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-orange-500" />
                            Tài liệu đính kèm
                        </h3>

                        {/* Images Upload */}
                        <div>
                            <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <Image className="w-4 h-4 text-green-500" />
                                Hình ảnh
                            </Label>
                            <div className="space-y-3">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="image-upload"
                                />
                                <label
                                    htmlFor="image-upload"
                                    className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-green-300 rounded-lg cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors"
                                >
                                    <Upload className="w-4 h-4 text-green-500" />
                                    <span className="text-sm text-green-600">Chọn hình ảnh</span>
                                </label>
                                {images.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {images.map((file, index) => (
                                            <div key={index} className="relative group">
                                                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                                    <img
                                                        src={URL.createObjectURL(file)}
                                                        alt={`Preview ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Videos Upload */}
                        <div>
                            <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <Video className="w-4 h-4 text-blue-500" />
                                Video
                            </Label>
                            <div className="space-y-3">
                                <input
                                    type="file"
                                    accept="video/*"
                                    multiple
                                    onChange={handleVideoUpload}
                                    className="hidden"
                                    id="video-upload"
                                />
                                <label
                                    htmlFor="video-upload"
                                    className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                                >
                                    <Upload className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm text-blue-600">Chọn video</span>
                                </label>
                                {videos.length > 0 && (
                                    <div className="space-y-2">
                                        {videos.map((file, index) => (
                                            <div key={index} className="relative group bg-gray-100 rounded-lg p-2">
                                                <div className="flex items-center gap-2">
                                                    <Video className="w-4 h-4 text-blue-500" />
                                                    <span className="text-sm text-gray-700 truncate">{file.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeVideo(index)}
                                                        className="ml-auto w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Documents Upload */}
                        <div>
                            <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <File className="w-4 h-4 text-orange-500" />
                                Tài liệu (PDF, Word, Excel...)
                            </Label>
                            <div className="space-y-3">
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                                    multiple
                                    onChange={handleDocumentUpload}
                                    className="hidden"
                                    id="document-upload"
                                />
                                <label
                                    htmlFor="document-upload"
                                    className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-orange-300 rounded-lg cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors"
                                >
                                    <Upload className="w-4 h-4 text-orange-500" />
                                    <span className="text-sm text-orange-600">Chọn tài liệu</span>
                                </label>
                                {documents.length > 0 && (
                                    <div className="space-y-2">
                                        {documents.map((file, index) => (
                                            <div key={index} className="relative group bg-gray-100 rounded-lg p-2">
                                                <div className="flex items-center gap-2">
                                                    <File className="w-4 h-4 text-orange-500" />
                                                    <span className="text-sm text-gray-700 truncate">{file.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeDocument(index)}
                                                        className="ml-auto w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
