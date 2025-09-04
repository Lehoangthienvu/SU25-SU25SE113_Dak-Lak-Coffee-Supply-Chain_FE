"use client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Sprout,
    Flower2,
    Apple,
    TrendingUp,
    ShoppingBasket,
    Coffee,
    TreePine,
    Calendar,
    Hash,
    FileText,
    X,
} from "lucide-react";
import { CropStage } from "@/lib/api/cropStage";

interface CropStageDetailDialogProps {
    readonly stage: CropStage | null;
    readonly isOpen: boolean;
    readonly onClose: () => void;
}

export function CropStageDetailDialog({ stage, isOpen, onClose }: CropStageDetailDialogProps) {
    if (!stage) return null;

    // Lấy icon cho giai đoạn
    const getStageIcon = (stageCode: string) => {
        const code = stageCode.toLowerCase();

        if (code.includes('plant') || code.includes('giao') || code.includes('trong')) {
            return <Sprout className="w-8 h-8 text-green-600" />;
        }
        if (code.includes('flower') || code.includes('hoa') || code.includes('no')) {
            return <Flower2 className="w-8 h-8 text-pink-500" />;
        }
        if (code.includes('fruit') || code.includes('qua') || code.includes('trai')) {
            return <Apple className="w-8 h-8 text-red-500" />;
        }
        if (code.includes('ripen') || code.includes('chin') || code.includes('mature')) {
            return <TrendingUp className="w-8 h-8 text-orange-500" />;
        }
        if (code.includes('harvest') || code.includes('thu') || code.includes('gat')) {
            return <ShoppingBasket className="w-8 h-8 text-amber-600" />;
        }
        if (code.includes('coffee') || code.includes('ca phe')) {
            return <Coffee className="w-8 h-8 text-brown-600" />;
        }

        return <TreePine className="w-8 h-8 text-gray-600" />;
    };

    // Lấy màu nền cho giai đoạn
    const getStageColor = (stageCode: string) => {
        const code = stageCode.toLowerCase();

        if (code.includes('plant') || code.includes('giao') || code.includes('trong')) {
            return "bg-green-50 border-green-200";
        }
        if (code.includes('flower') || code.includes('hoa') || code.includes('no')) {
            return "bg-pink-50 border-pink-200";
        }
        if (code.includes('fruit') || code.includes('qua') || code.includes('trai')) {
            return "bg-red-50 border-red-200";
        }
        if (code.includes('ripen') || code.includes('chin') || code.includes('mature')) {
            return "bg-orange-50 border-orange-200";
        }
        if (code.includes('harvest') || code.includes('thu') || code.includes('gat')) {
            return "bg-amber-50 border-amber-200";
        }
        if (code.includes('coffee') || code.includes('ca phe')) {
            return "bg-yellow-50 border-yellow-200";
        }

        return "bg-gray-50 border-gray-200";
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Chi tiết Giai đoạn</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="h-8 w-8 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Header với icon và tên */}
                    <Card className={`${getStageColor(stage.stageCode)} border-2`}>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-full shadow-sm">
                                    {getStageIcon(stage.stageCode)}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                        {stage.stageName}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="font-mono">
                                            {stage.stageCode.toUpperCase()}
                                        </Badge>
                                        <Badge variant="outline" className="font-mono">
                                            Thứ tự: {stage.orderIndex}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Thông tin chi tiết */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Mã giai đoạn */}
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Hash className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Mã giai đoạn</p>
                                        <p className="font-mono font-medium text-blue-900">
                                            {stage.stageCode}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Thứ tự */}
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Calendar className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Thứ tự</p>
                                        <p className="text-2xl font-bold text-green-900">
                                            {stage.orderIndex}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Mô tả */}
                    {stage.description && (
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <FileText className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-600 mb-2">Mô tả</p>
                                        <p className="text-gray-800 whitespace-pre-line">
                                            {stage.description}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Thông tin hệ thống */}
                    <Card className="bg-gray-50">
                        <CardContent className="p-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">
                                Thông tin hệ thống
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600">ID giai đoạn:</p>
                                    <p className="font-mono text-gray-900">{stage.stageId}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Trạng thái:</p>
                                    <Badge variant="outline" className="text-green-600 border-green-600">
                                        Hoạt động
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
}
