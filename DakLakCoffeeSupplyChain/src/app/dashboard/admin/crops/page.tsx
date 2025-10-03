'use client';

import { useState, useEffect } from 'react';
import { CropCard } from '@/components/crops/CropCard';
import { CropDetailDialog } from '@/components/crops/CropDetailDialog';
import { getCrops, CropViewAllDto, CropViewDetailsDto, approveCrop, rejectCrop } from '@/lib/api/crops';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, RefreshCw, Filter, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type ApprovalStatus = 'all' | 'pending' | 'approved' | 'rejected';

export default function AdminCropsPage() {
    const [crops, setCrops] = useState<CropViewAllDto[]>([]);
    const [filteredCrops, setFilteredCrops] = useState<CropViewAllDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDetailDialog, setShowDetailDialog] = useState(false);
    const [viewingCrop, setViewingCrop] = useState<CropViewAllDto | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [approvalFilter, setApprovalFilter] = useState<ApprovalStatus>('all');

    const loadCrops = async () => {
        try {
            setLoading(true);
            const data = await getCrops();
            console.log('Loaded crops data:', data);
            setCrops(data);
            setFilteredCrops(data);
        } catch (error) {
            console.error('Error loading crops:', error);
            toast.error('Có lỗi xảy ra khi tải danh sách vùng trồng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCrops();
    }, []);

    useEffect(() => {
        let filtered = crops;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(crop =>
                crop.farmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                crop.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                crop.cropCode.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by approval status
        if (approvalFilter !== 'all') {
            filtered = filtered.filter(crop => {
                switch (approvalFilter) {
                    case 'pending':
                        return crop.isApproved === null || crop.isApproved === undefined;
                    case 'approved':
                        return crop.isApproved === true;
                    case 'rejected':
                        return crop.isApproved === false;
                    default:
                        return true;
                }
            });
        }

        setFilteredCrops(filtered);
    }, [searchTerm, crops, approvalFilter]);

    const handleView = (crop: CropViewAllDto) => {
        setViewingCrop(crop);
        setShowDetailDialog(true);
    };

    const handleDialogSuccess = () => {
        loadCrops();
    };

    const handleApprove = async (cropId: string) => {
        try {
            console.log('Approving crop:', cropId);
            await approveCrop(cropId);
            toast.success('Đã duyệt vùng trồng thành công!');
            setShowDetailDialog(false);
            loadCrops();
        } catch (error) {
            console.error('Error approving crop:', error);
            toast.error('Có lỗi xảy ra khi duyệt vùng trồng');
        }
    };

    const handleReject = async (cropId: string, reason: string) => {
        try {
            await rejectCrop(cropId, reason);
            toast.success('Đã từ chối vùng trồng thành công!');
            setShowDetailDialog(false);
            loadCrops();
        } catch (error) {
            console.error('Error rejecting crop:', error);
            toast.error('Có lỗi xảy ra khi từ chối vùng trồng');
        }
    };

    const getApprovalStats = () => {
        const total = crops.length;
        const pending = crops.filter(c => c.isApproved === null || c.isApproved === undefined).length;
        const approved = crops.filter(c => c.isApproved === true).length;
        const rejected = crops.filter(c => c.isApproved === false).length;

        return { total, pending, approved, rejected };
    };

    const stats = getApprovalStats();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="w-full bg-orange-50 min-h-screen">
            <div className="p-6">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">🌱</span>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                        Quản lý vùng trồng
                                    </h1>
                                    <p className="text-gray-600 mt-1">Duyệt và quản lý các vùng trồng cà phê</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                variant="outline"
                                onClick={loadCrops}
                                className="flex items-center gap-2 border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Làm mới
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-blue-600 font-bold">📊</span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Tổng số</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <span className="text-yellow-600 font-bold">⏳</span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Chờ duyệt</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Đã duyệt</p>
                                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                <XCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Từ chối</p>
                                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filter Section */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <Input
                                type="text"
                                placeholder="Tìm kiếm theo tên trang trại, địa chỉ hoặc mã vùng trồng..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 h-12 border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                            />
                        </div>
                        <div className="flex gap-3">
                            <Select value={approvalFilter} onValueChange={(value: ApprovalStatus) => setApprovalFilter(value)}>
                                <SelectTrigger className="w-48 h-12 border-2 border-gray-200 focus:border-blue-400 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4 text-gray-500" />
                                        <SelectValue placeholder="Lọc theo trạng thái" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    <SelectItem value="pending">Chờ duyệt</SelectItem>
                                    <SelectItem value="approved">Đã duyệt</SelectItem>
                                    <SelectItem value="rejected">Từ chối</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {filteredCrops.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="max-w-md mx-auto">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                                <span className="text-4xl">🌱</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                {searchTerm || approvalFilter !== 'all' ? 'Không tìm thấy vùng trồng nào' : 'Chưa có vùng trồng nào'}
                            </h3>
                            <p className="text-gray-600 mb-8 text-lg">
                                {searchTerm || approvalFilter !== 'all'
                                    ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc'
                                    : 'Chưa có farmer nào tạo vùng trồng'
                                }
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredCrops.map((crop) => (
                            <CropCard
                                key={crop.cropId}
                                crop={crop}
                                onView={handleView}
                                onDelete={() => {}} // Admin không xóa crop
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Crop Detail Dialog with Admin Actions */}
            <CropDetailDialog
                open={showDetailDialog}
                onOpenChange={(open) => {
                    setShowDetailDialog(open);
                }}
                crop={viewingCrop}
                onEdit={undefined} // Admin không edit crop
                onApprove={handleApprove}
                onReject={handleReject}
                isAdmin={true}
            />

        </div>
    );
}
