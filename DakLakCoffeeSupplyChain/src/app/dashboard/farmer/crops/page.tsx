'use client';

import { useState, useEffect } from 'react';
import { CropCard } from '@/components/crops/CropCard';
import { CreateCropDialog } from '@/components/crops/CreateCropDialog';
import { EditCropDialog } from '@/components/crops/EditCropDialog';
import { CropDetailDialog } from '@/components/crops/CropDetailDialog';
import { getCrops, deleteCrop, CropViewAllDto, CropViewDetailsDto } from '@/lib/api/crops';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirmDialog';

export default function CropsPage() {
    const [crops, setCrops] = useState<CropViewAllDto[]>([]);
    const [filteredCrops, setFilteredCrops] = useState<CropViewAllDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDetailDialog, setShowDetailDialog] = useState(false);
    const [editingCrop, setEditingCrop] = useState<CropViewAllDto | null>(null);
    const [viewingCrop, setViewingCrop] = useState<CropViewAllDto | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const loadCrops = async () => {
        try {
            setLoading(true);
            const data = await getCrops();
            console.log('Loaded crops data:', data);
            if (data.length > 0) {
                console.log('First crop data:', data[0]);
                console.log('First crop address:', data[0].address);
            }
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
        const filtered = crops.filter(crop =>
            crop.farmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            crop.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
            crop.cropCode.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredCrops(filtered);
    }, [searchTerm, crops]);

    const handleCreateNew = () => {
        setShowCreateDialog(true);
    };


    const handleView = (crop: CropViewAllDto) => {
        setViewingCrop(crop);
        setShowDetailDialog(true);
    };

    const handleEditFromDetail = (cropWithDetails: CropViewDetailsDto) => {
        console.log('handleEditFromDetail called with cropWithDetails:', cropWithDetails);
        console.log('cropWithDetails.address:', cropWithDetails.address);

        // Convert CropViewDetailsDto to CropViewAllDto for editing
        const cropForEdit: CropViewAllDto = {
            cropId: cropWithDetails.cropId,
            cropCode: cropWithDetails.cropCode,
            address: cropWithDetails.address || '',
            farmName: cropWithDetails.farmName,
            cropArea: cropWithDetails.cropArea,
            status: cropWithDetails.status
        };

        console.log('cropForEdit created:', cropForEdit);
        console.log('cropForEdit.address:', cropForEdit.address);

        setEditingCrop(cropForEdit);
        setShowDetailDialog(false);
        setShowEditDialog(true);
    };

    const handleDelete = async (cropId: string) => {
        try {
            await deleteCrop(cropId);
            toast.success('Xóa vùng trồng thành công!');
            loadCrops();
        } catch (error) {
            console.error('Error deleting crop:', error);
            toast.error('Có lỗi xảy ra khi xóa vùng trồng');
        }
        setDeleteConfirm(null);
    };

    const handleDialogSuccess = () => {
        loadCrops();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-orange-50 to-amber-50">
            <div className="p-6">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">🌱</span>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                        Quản lý vùng trồng
                                    </h1>
                                    <p className="text-gray-600 mt-1">Quản lý các vùng trồng cà phê của bạn</p>
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
                            <Button
                                onClick={handleCreateNew}
                                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                                <Plus className="h-4 w-4" />
                                Tạo vùng trồng mới
                            </Button>
                        </div>
                    </div>
                </div>


                {/* Search Section */}
                <div className="mb-8">
                    <div className="relative max-w-2xl">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <Input
                            type="text"
                            placeholder="Tìm kiếm theo tên trang trại, địa chỉ hoặc mã vùng trồng..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 h-12 border-2 border-gray-200 focus:border-green-400 focus:ring-green-400 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                        />
                    </div>
                </div>

                {filteredCrops.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="max-w-md mx-auto">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                                <span className="text-4xl">🌱</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                {searchTerm ? 'Không tìm thấy vùng trồng nào' : 'Chưa có vùng trồng nào'}
                            </h3>
                            <p className="text-gray-600 mb-8 text-lg">
                                {searchTerm
                                    ? 'Thử thay đổi từ khóa tìm kiếm'
                                    : 'Bắt đầu tạo vùng trồng đầu tiên của bạn'
                                }
                            </p>
                            {!searchTerm && (
                                <Button
                                    onClick={handleCreateNew}
                                    className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                                >
                                    <Plus className="h-5 w-5" />
                                    Tạo vùng trồng đầu tiên
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredCrops.map((crop) => (
                            <CropCard
                                key={crop.cropId}
                                crop={crop}
                                onDelete={(id) => setDeleteConfirm(id)}
                                onView={handleView}
                            />
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={!!deleteConfirm}
                onOpenChange={(open) => !open && setDeleteConfirm(null)}
                onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
                title="Xác nhận xóa"
                description="Bạn có chắc chắn muốn xóa vùng trồng này? Hành động này không thể hoàn tác."
                confirmText="Xóa"
                cancelText="Hủy"
            />

            {/* Create Crop Dialog */}
            <CreateCropDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onSuccess={handleDialogSuccess}
            />

            {/* Edit Crop Dialog */}
            <EditCropDialog
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                onSuccess={handleDialogSuccess}
                crop={editingCrop}
            />

            {/* Crop Detail Dialog */}
            <CropDetailDialog
                open={showDetailDialog}
                onOpenChange={setShowDetailDialog}
                crop={viewingCrop}
                onEdit={handleEditFromDetail}
            />
        </div>
    );
}
