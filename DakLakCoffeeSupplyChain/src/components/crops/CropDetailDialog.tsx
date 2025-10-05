'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CropViewAllDto, CropViewDetailsDto, getCropById } from '@/lib/api/crops';
import { CropStatus, CropStatusLabels, CropStatusColors, CropStatusIconColors } from '@/lib/constants/cropStatus';
import { MapPin, Home, Ruler, Activity, Hash, Calendar, Edit, X, Loader2, Circle, CheckCircle, XCircle, Clock, FileText, Image, Video, File } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

interface CropDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    crop: CropViewAllDto | null;
    onEdit?: (cropWithDetails: CropViewDetailsDto) => void;
    // Admin functions
    onApprove?: (cropId: string) => void;
    onReject?: (cropId: string, reason: string) => void;
    isAdmin?: boolean;
}

export const CropDetailDialog: React.FC<CropDetailDialogProps> = ({
    open,
    onOpenChange,
    crop,
    onEdit,
    onApprove,
    onReject,
    isAdmin = false
}) => {
    // Helper function to extract filename from URL
    const extractFileName = (url: string): string => {
        try {
            // Remove query parameters and hash
            const cleanUrl = url.split('?')[0].split('#')[0];
            
            // Get the last part of the URL
            const fileName = cleanUrl.split('/').pop() || '';
            
            // If it's a Cloudinary URL, try to extract original filename
            if (fileName.includes('.')) {
                return fileName;
            }
            
            // If no extension, try to get meaningful name from URL
            const urlParts = cleanUrl.split('/');
            const lastPart = urlParts[urlParts.length - 1];
            
            // If it's a UUID-like string, use generic name
            if (lastPart.match(/^[a-f0-9-]{36}$/i)) {
                return `File ${urlParts.length}`;
            }
            
            return lastPart || 'File';
        } catch {
            return 'File';
        }
    };
    const [cropDetails, setCropDetails] = useState<CropViewDetailsDto | null>(null);
    const [loading, setLoading] = useState(false);
    
    // Admin states
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Admin handlers
    const handleApprove = async () => {
        if (!crop || !onApprove) return;
        try {
            setActionLoading(true);
            await onApprove(crop.cropId);
            setShowRejectForm(false);
            setRejectReason('');
        } catch (error) {
            console.error('Error approving crop:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!crop || !onReject || !rejectReason.trim()) return;
        try {
            setActionLoading(true);
            await onReject(crop.cropId, rejectReason);
            setShowRejectForm(false);
            setRejectReason('');
        } catch (error) {
            console.error('Error rejecting crop:', error);
        } finally {
            setActionLoading(false);
        }
    };

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
                isDeleted: false,
                images: [],
                videos: [],
                documents: []
            });
        } finally {
            setLoading(false);
        }
    }, [crop]);

    useEffect(() => {
        if (open && crop) {
            loadCropDetails();
        } else if (!open) {
            // Reset admin states when dialog closes
            setShowRejectForm(false);
            setRejectReason('');
            setActionLoading(false);
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
                    {/* Approval Status */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Trạng thái duyệt</h3>
                                {cropDetails?.isApproved === true ? (
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <span className="text-green-600 font-semibold">Đã duyệt</span>
                                    </div>
                                ) : cropDetails?.isApproved === false ? (
                                    <div className="flex items-center gap-2">
                                        <XCircle className="h-5 w-5 text-red-600" />
                                        <span className="text-red-600 font-semibold">Từ chối</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-yellow-600" />
                                        <span className="text-yellow-600 font-semibold">Chờ duyệt</span>
                                    </div>
                                )}
                                {cropDetails?.approvedAt && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        Ngày duyệt: {new Date(cropDetails.approvedAt).toLocaleDateString('vi-VN')}
                                    </p>
                                )}
                                {cropDetails?.rejectReason && (
                                    <p className="text-sm text-red-600 mt-1">
                                        Lý do từ chối: {cropDetails.rejectReason}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

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
                                    {cropDetails?.address || 'Chưa cập nhật địa chỉ'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Ghi chú */}
                    {cropDetails?.note && (
                        <div>
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <FileText className="w-4 h-4 text-green-500" />
                                    <span className="text-sm font-semibold text-gray-700">Ghi chú</span>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-gray-900">{cropDetails.note}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Media Files */}
                    {(cropDetails?.images?.length || cropDetails?.videos?.length || cropDetails?.documents?.length) && (
                        <div>
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Tài liệu đính kèm</h3>
                                
                                {/* All Media as Documents */}
                                <div className="space-y-2">
                                    {/* Images as Documents */}
                                    {cropDetails.images && cropDetails.images.map((url, index) => (
                                        <div key={`img-${index}`} className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
                                            <File className="w-4 h-4 text-gray-500" />
                                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                                {extractFileName(url) || `Tài liệu ${index + 1}`}
                                            </a>
                                        </div>
                                    ))}
                                    
                                    {/* Videos as Documents */}
                                    {cropDetails.videos && cropDetails.videos.map((url, index) => (
                                        <div key={`vid-${index}`} className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
                                            <File className="w-4 h-4 text-gray-500" />
                                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                                {extractFileName(url) || `Tài liệu ${(cropDetails.images?.length || 0) + index + 1}`}
                                            </a>
                                        </div>
                                    ))}
                                    
                                    {/* Documents */}
                                    {cropDetails.documents && cropDetails.documents.map((doc, index) => (
                                        <div key={`doc-${index}`} className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
                                            <File className="w-4 h-4 text-gray-500" />
                                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                                {doc.fileName}
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

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
                    {/* Admin Actions */}
                    {isAdmin && cropDetails && (
                        <div className="mb-4">
                            {/* Reject Form */}
                            {showRejectForm && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <Label className="text-sm font-semibold text-red-700">
                                        Lý do từ chối *
                                    </Label>
                                    <Textarea
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="Nhập lý do từ chối..."
                                        className="min-h-[80px] border-red-300 focus:border-red-500 mt-2"
                                    />
                                </div>
                            )}

                            {/* Admin Action Buttons */}
                            {cropDetails.isApproved !== true ? (
                                <div className="flex gap-2 mb-4">
                                    <Button
                                        onClick={() => setShowRejectForm(!showRejectForm)}
                                        variant="outline"
                                        size="sm"
                                        className="border-red-300 text-red-700 hover:bg-red-50"
                                    >
                                        <XCircle className="w-4 h-4 mr-1" />
                                        {showRejectForm ? 'Hủy' : 'Từ chối'}
                                    </Button>
                                    
                                    {showRejectForm ? (
                                        <Button
                                            onClick={handleReject}
                                            disabled={actionLoading || !rejectReason.trim()}
                                            size="sm"
                                            className="bg-red-500 hover:bg-red-600 text-white"
                                        >
                                            {actionLoading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleApprove}
                                            disabled={actionLoading}
                                            size="sm"
                                            className="bg-green-500 hover:bg-green-600 text-white"
                                        >
                                            {actionLoading ? 'Đang xử lý...' : 'Duyệt'}
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-green-700">
                                        <CheckCircle className="w-4 h-4" />
                                        <span className="text-sm font-medium">
                                            {cropDetails.isApproved ? 'Đã duyệt' : 'Đã từ chối'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Main Footer Buttons */}
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
                        {onEdit && cropDetails && !isAdmin && (
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
