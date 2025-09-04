"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirmDialog";
import { AppToast } from "@/components/ui/AppToast";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    Loader2,
    Sprout,
    Flower2,
    Apple,
    TrendingUp,
    ShoppingBasket,
    Coffee,
    TreePine,
} from "lucide-react";
import { getCropStages, CropStage, deleteCropStage } from "@/lib/api/cropStage";
import { CropStageForm } from "./components/CropStageForm";
import { CropStageDetailDialog } from "./components/CropStageDetailDialog";
import { CropStageStats } from "./components/CropStageStats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminCropStagesPage() {
    const [stages, setStages] = useState<CropStage[]>([]);
    const [filteredStages, setFilteredStages] = useState<CropStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStage, setSelectedStage] = useState<CropStage | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [stageToDelete, setStageToDelete] = useState<CropStage | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [stageToView, setStageToView] = useState<CropStage | null>(null);

    // Load danh sách giai đoạn
    const loadStages = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getCropStages();
            const sortedData = data.toSorted((a, b) => a.orderIndex - b.orderIndex);
            setStages(sortedData);
            setFilteredStages(sortedData);
        } catch (error) {
            console.error("Lỗi khi tải danh sách giai đoạn:", error);
            AppToast.error("Không thể tải danh sách giai đoạn");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStages();
    }, [loadStages]);

    // Tìm kiếm
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredStages(stages);
        } else {
            const filtered = stages.filter(
                (stage) =>
                    stage.stageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    stage.stageCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    stage.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredStages(filtered);
        }
    }, [searchTerm, stages]);

    // Lấy icon cho giai đoạn
    const getStageIcon = (stageCode: string) => {
        const code = stageCode.toLowerCase();

        if (code.includes('plant') || code.includes('giao') || code.includes('trong')) {
            return <Sprout className="w-5 h-5 text-green-600" />;
        }
        if (code.includes('flower') || code.includes('hoa') || code.includes('no')) {
            return <Flower2 className="w-5 h-5 text-pink-500" />;
        }
        if (code.includes('fruit') || code.includes('qua') || code.includes('trai')) {
            return <Apple className="w-5 h-5 text-red-500" />;
        }
        if (code.includes('ripen') || code.includes('chin') || code.includes('mature')) {
            return <TrendingUp className="w-5 h-5 text-orange-500" />;
        }
        if (code.includes('harvest') || code.includes('thu') || code.includes('gat')) {
            return <ShoppingBasket className="w-5 h-5 text-amber-600" />;
        }
        if (code.includes('coffee') || code.includes('ca phe')) {
            return <Coffee className="w-5 h-5 text-brown-600" />;
        }

        return <TreePine className="w-5 h-5 text-gray-600" />;
    };

    // Mở form thêm mới
    const handleAddNew = () => {
        setSelectedStage(null);
        setIsFormOpen(true);
    };

    // Mở form chỉnh sửa
    const handleEdit = (stage: CropStage) => {
        setSelectedStage(stage);
        setIsFormOpen(true);
    };

    // Mở dialog xem chi tiết
    const handleViewDetail = (stage: CropStage) => {
        setStageToView(stage);
        setIsDetailDialogOpen(true);
    };

    // Mở dialog xóa
    const handleDelete = (stage: CropStage) => {
        setStageToDelete(stage);
        setIsDeleteDialogOpen(true);
    };

    // Xác nhận xóa
    const confirmDelete = async () => {
        if (!stageToDelete) return;

        try {
            setDeleting(true);
            await deleteCropStage(stageToDelete.stageId);

            AppToast.success("Đã xóa giai đoạn thành công!");
            setIsDeleteDialogOpen(false);
            setStageToDelete(null);
            loadStages();
        } catch (error) {
            console.error("Lỗi khi xóa giai đoạn:", error);
            AppToast.error("Không thể xóa giai đoạn");
        } finally {
            setDeleting(false);
        }
    };

    // Đóng form
    const handleFormClose = () => {
        setIsFormOpen(false);
        setSelectedStage(null);
    };

    // Form submit thành công
    const handleFormSuccess = () => {
        handleFormClose();
        loadStages();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý Giai đoạn Cây trồng</h1>
                    <p className="text-gray-600 mt-1">
                        Quản lý các giai đoạn phát triển của cây cà phê
                    </p>
                </div>
                <Button onClick={handleAddNew} className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm giai đoạn mới
                </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="list" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="list">Danh sách Giai đoạn</TabsTrigger>
                    <TabsTrigger value="stats">Thống kê & Báo cáo</TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="space-y-6">
                    {/* Thống kê */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Tổng giai đoạn</p>
                                        <p className="text-2xl font-bold text-blue-600">{stages.length}</p>
                                    </div>
                                    <TreePine className="w-8 h-8 text-blue-600" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Đang hiển thị</p>
                                        <p className="text-2xl font-bold text-green-600">{filteredStages.length}</p>
                                    </div>
                                    <Eye className="w-8 h-8 text-green-600" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Giai đoạn đầu</p>
                                        <p className="text-lg font-bold text-orange-600">
                                            {stages.length > 0 ? stages[0].stageName : "N/A"}
                                        </p>
                                    </div>
                                    <Sprout className="w-8 h-8 text-orange-600" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Giai đoạn cuối</p>
                                        <p className="text-lg font-bold text-red-600">
                                            {stages.length > 0 ? stages[stages.length - 1].stageName : "N/A"}
                                        </p>
                                    </div>
                                    <ShoppingBasket className="w-8 h-8 text-red-600" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tìm kiếm */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <Search className="w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Tìm kiếm theo tên, mã giai đoạn hoặc mô tả..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="flex-1"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bảng danh sách */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TreePine className="w-5 h-5" />
                                Danh sách Giai đoạn
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {(() => {
                                if (loading) {
                                    return (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                            <span>Đang tải dữ liệu...</span>
                                        </div>
                                    );
                                }

                                if (filteredStages.length === 0) {
                                    const message = searchTerm ? "Không tìm thấy giai đoạn nào" : "Chưa có giai đoạn nào";
                                    return (
                                        <div className="text-center py-8 text-gray-500">
                                            {message}
                                        </div>
                                    );
                                }

                                return (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Thứ tự</TableHead>
                                                    <TableHead>Giai đoạn</TableHead>
                                                    <TableHead>Mã giai đoạn</TableHead>
                                                    <TableHead>Mô tả</TableHead>
                                                    <TableHead className="text-center">Thao tác</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredStages.map((stage) => (
                                                    <TableRow key={stage.stageId}>
                                                        <TableCell>
                                                            <Badge variant="outline" className="font-mono">
                                                                {stage.orderIndex}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                {getStageIcon(stage.stageCode)}
                                                                <span className="font-medium">{stage.stageName}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary" className="font-mono">
                                                                {stage.stageCode.toUpperCase()}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="text-gray-600 text-sm">
                                                                {stage.description || "Không có mô tả"}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center justify-center gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleViewDetail(stage)}
                                                                    title="Xem chi tiết"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleEdit(stage)}
                                                                    title="Chỉnh sửa"
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleDelete(stage)}
                                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    title="Xóa"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                );
                            })()}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="stats" className="space-y-6">
                    <CropStageStats stages={stages} />
                </TabsContent>
            </Tabs>

            {/* Form Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle>
                            {selectedStage ? "Chỉnh sửa Giai đoạn" : "Thêm Giai đoạn Mới"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden">
                        <CropStageForm
                            stage={selectedStage}
                            onSuccess={handleFormSuccess}
                            onCancel={handleFormClose}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Xác nhận xóa giai đoạn"
                description={
                    <div>
                        Bạn có chắc chắn muốn xóa giai đoạn <strong>"{stageToDelete?.stageName}"</strong>?
                        <br />
                        <span className="text-red-600 font-medium">
                            Hành động này không thể hoàn tác!
                        </span>
                    </div>
                }
                onConfirm={confirmDelete}
                loading={deleting}
                confirmText={deleting ? "Đang xóa..." : "Xóa giai đoạn"}
                cancelText="Hủy"
            />

            {/* Detail Dialog */}
            <CropStageDetailDialog
                stage={stageToView}
                isOpen={isDetailDialogOpen}
                onClose={() => {
                    setIsDetailDialogOpen(false);
                    setStageToView(null);
                }}
            />
        </div>
    );
}
