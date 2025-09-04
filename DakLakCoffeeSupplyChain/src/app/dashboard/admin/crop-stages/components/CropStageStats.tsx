"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    BarChart3,
    TrendingUp,
    Calendar,
    Hash,
    Sprout,
    Flower2,
    Apple,
    ShoppingBasket,
} from "lucide-react";
import { CropStage } from "@/lib/api/cropStage";

interface CropStageStatsProps {
    readonly stages: CropStage[];
}

export function CropStageStats({ stages }: CropStageStatsProps) {
    // Tính toán thống kê
    const totalStages = stages.length;
    const hasDescription = stages.filter(stage => stage.description && stage.description.trim()).length;
    const descriptionPercentage = totalStages > 0 ? Math.round((hasDescription / totalStages) * 100) : 0;

    // Tìm giai đoạn đầu và cuối
    const firstStage = stages.length > 0 ? stages[0] : null;
    const lastStage = stages.length > 0 ? stages[stages.length - 1] : null;

    // Đếm số giai đoạn theo loại
    const stageTypes = {
        planting: stages.filter(s => s.stageCode.toLowerCase().includes('plant') || s.stageCode.toLowerCase().includes('giao')).length,
        flowering: stages.filter(s => s.stageCode.toLowerCase().includes('flower') || s.stageCode.toLowerCase().includes('hoa')).length,
        fruiting: stages.filter(s => s.stageCode.toLowerCase().includes('fruit') || s.stageCode.toLowerCase().includes('qua')).length,
        harvesting: stages.filter(s => s.stageCode.toLowerCase().includes('harvest') || s.stageCode.toLowerCase().includes('thu')).length,
    };

    // Lấy icon cho loại giai đoạn
    const getStageTypeIcon = (type: string) => {
        switch (type) {
            case 'planting':
                return <Sprout className="w-4 h-4 text-green-600" />;
            case 'flowering':
                return <Flower2 className="w-4 h-4 text-pink-500" />;
            case 'fruiting':
                return <Apple className="w-4 h-4 text-red-500" />;
            case 'harvesting':
                return <ShoppingBasket className="w-4 h-4 text-amber-600" />;
            default:
                return <Hash className="w-4 h-4 text-gray-600" />;
        }
    };

    const getStageTypeName = (type: string) => {
        switch (type) {
            case 'planting':
                return 'Gieo trồng';
            case 'flowering':
                return 'Ra hoa';
            case 'fruiting':
                return 'Đậu quả';
            case 'harvesting':
                return 'Thu hoạch';
            default:
                return 'Khác';
        }
    };

    return (
        <div className="space-y-6">
            {/* Tổng quan */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Tổng giai đoạn</p>
                                <p className="text-2xl font-bold text-blue-600">{totalStages}</p>
                            </div>
                            <BarChart3 className="w-8 h-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Có mô tả</p>
                                <p className="text-2xl font-bold text-green-600">{hasDescription}</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Tỷ lệ mô tả</p>
                                <p className="text-2xl font-bold text-purple-600">{descriptionPercentage}%</p>
                            </div>
                            <Calendar className="w-8 h-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Thứ tự cao nhất</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {lastStage?.orderIndex || 0}
                                </p>
                            </div>
                            <Hash className="w-8 h-8 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Giai đoạn đầu và cuối */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Sprout className="w-5 h-5 text-green-600" />
                            Giai đoạn đầu tiên
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {firstStage ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="font-mono">
                                        {firstStage.stageCode.toUpperCase()}
                                    </Badge>
                                    <Badge variant="secondary">
                                        Thứ tự: {firstStage.orderIndex}
                                    </Badge>
                                </div>
                                <h3 className="font-semibold text-lg">{firstStage.stageName}</h3>
                                {firstStage.description && (
                                    <p className="text-sm text-gray-600">{firstStage.description}</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-500">Chưa có giai đoạn nào</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ShoppingBasket className="w-5 h-5 text-amber-600" />
                            Giai đoạn cuối cùng
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {lastStage ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="font-mono">
                                        {lastStage.stageCode.toUpperCase()}
                                    </Badge>
                                    <Badge variant="secondary">
                                        Thứ tự: {lastStage.orderIndex}
                                    </Badge>
                                </div>
                                <h3 className="font-semibold text-lg">{lastStage.stageName}</h3>
                                {lastStage.description && (
                                    <p className="text-sm text-gray-600">{lastStage.description}</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-500">Chưa có giai đoạn nào</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Phân loại giai đoạn */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Phân loại Giai đoạn
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(stageTypes).map(([type, count]) => (
                            <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-center mb-2">
                                    {getStageTypeIcon(type)}
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{count}</p>
                                <p className="text-sm text-gray-600">{getStageTypeName(type)}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Chu trình hoàn chỉnh */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Chu trình Giai đoạn
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {stages.length > 0 ? (
                        <div className="space-y-3">
                            {stages.map((stage, index) => (
                                <div key={stage.stageId} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                                        {stage.orderIndex}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-medium">{stage.stageName}</h4>
                                            <Badge variant="outline" className="text-xs font-mono">
                                                {stage.stageCode}
                                            </Badge>
                                        </div>
                                        {stage.description && (
                                            <p className="text-sm text-gray-600">{stage.description}</p>
                                        )}
                                    </div>
                                    {index < stages.length - 1 && (
                                        <div className="flex-shrink-0 text-gray-400">
                                            <TrendingUp className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">Chưa có giai đoạn nào</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
