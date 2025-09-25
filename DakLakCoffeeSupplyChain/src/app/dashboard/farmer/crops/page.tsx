'use client';

import { useState, useEffect } from 'react';
import { CropForm } from '@/components/crops/CropForm';
import { CropCard } from '@/components/crops/CropCard';
import { getCrops, deleteCrop, CropViewAllDto, CropUpdateDto } from '@/lib/api/crops';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirmDialog';

export default function CropsPage() {
    const [crops, setCrops] = useState<CropViewAllDto[]>([]);
    const [filteredCrops, setFilteredCrops] = useState<CropViewAllDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCrop, setEditingCrop] = useState<CropUpdateDto | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const loadCrops = async () => {
        try {
            setLoading(true);
            const data = await getCrops();
            setCrops(data);
            setFilteredCrops(data);
        } catch (error) {
            console.error('Error loading crops:', error);
            toast.error('Có lỗi xảy ra khi tải danh sách crops');
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
        setEditingCrop(null);
        setShowForm(true);
    };

    const handleEdit = (crop: CropViewAllDto) => {
        setEditingCrop({
            cropId: crop.cropId,
            cropCode: crop.cropCode,
            address: crop.address,
            farmName: crop.farmName,
            cropArea: crop.cropArea,
            status: crop.status as any
        });
        setShowForm(true);
    };

    const handleDelete = async (cropId: string) => {
        try {
            await deleteCrop(cropId);
            toast.success('Xóa crop thành công!');
            loadCrops();
        } catch (error) {
            console.error('Error deleting crop:', error);
            toast.error('Có lỗi xảy ra khi xóa crop');
        }
        setDeleteConfirm(null);
    };

    const handleFormSubmit = () => {
        setShowForm(false);
        setEditingCrop(null);
        loadCrops();
    };

    const handleFormCancel = () => {
        setShowForm(false);
        setEditingCrop(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Crops</h1>
                    <p className="text-gray-600 mt-1">Quản lý các trang trại cà phê của bạn</p>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={loadCrops}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Làm mới
                    </Button>
                    <Button
                        onClick={handleCreateNew}
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Tạo Crop mới
                    </Button>
                </div>
            </div>

            {showForm && (
                <div className="mb-6">
                    <CropForm
                        initialData={editingCrop || undefined}
                        onSubmit={handleFormSubmit}
                        onCancel={handleFormCancel}
                    />
                </div>
            )}

            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        type="text"
                        placeholder="Tìm kiếm theo tên trang trại, địa chỉ hoặc mã crop..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {filteredCrops.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {searchTerm ? 'Không tìm thấy crop nào' : 'Chưa có crop nào'}
                    </h3>
                    <p className="text-gray-500 mb-4">
                        {searchTerm
                            ? 'Thử thay đổi từ khóa tìm kiếm'
                            : 'Bắt đầu tạo crop đầu tiên của bạn'
                        }
                    </p>
                    {!searchTerm && (
                        <Button onClick={handleCreateNew}>
                            <Plus className="h-4 w-4 mr-2" />
                            Tạo Crop đầu tiên
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCrops.map((crop) => (
                        <CropCard
                            key={crop.cropId}
                            crop={crop}
                            onEdit={handleEdit}
                            onDelete={(id) => setDeleteConfirm(id)}
                        />
                    ))}
                </div>
            )}

            <ConfirmDialog
                open={!!deleteConfirm}
                onOpenChange={(open) => !open && setDeleteConfirm(null)}
                onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
                title="Xác nhận xóa"
                description="Bạn có chắc chắn muốn xóa crop này? Hành động này không thể hoàn tác."
                confirmText="Xóa"
                cancelText="Hủy"
            />
        </div>
    );
}
