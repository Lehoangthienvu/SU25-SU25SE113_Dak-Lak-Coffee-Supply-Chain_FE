"use client";

import { JSX, useCallback, useState } from "react";
import {
    getCropStages,
    CropStage
} from "@/lib/api/cropStage";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    Plane,
    Flower2,
    Apple,
    Candy,
    ShoppingBasket,
    StickyNote,
    Sprout,
    Leaf,
    TreePine,
    Coffee
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Dynamic icon mapping function that can handle new stage codes
const getStageIcon = (stageCode: string, stageName: string): JSX.Element => {
    const code = stageCode.toLowerCase();
    const name = stageName.toLowerCase();

    // Specific mappings for known stage codes
    if (code.includes('plant') || code.includes('giao') || code.includes('trong') ||
        name.includes('giao') || name.includes('trồng')) {
        return (
            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-green-100">
                <Plane className="h-4 w-4 text-green-600" />
            </div>
        );
    }

    if (code.includes('flower') || code.includes('hoa') || code.includes('nở') ||
        name.includes('hoa') || name.includes('nở')) {
        return (
            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-pink-100">
                <Flower2 className="h-4 w-4 text-pink-500" />
            </div>
        );
    }

    if (code.includes('fruit') || code.includes('quả') || code.includes('trái') ||
        name.includes('quả') || name.includes('trái')) {
        return (
            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100">
                <Apple className="h-4 w-4 text-red-500" />
            </div>
        );
    }

    if (code.includes('ripen') || code.includes('chín') || code.includes('mature') ||
        name.includes('chín') || name.includes('trưởng')) {
        return (
            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-yellow-100">
                <Candy className="h-4 w-4 text-yellow-600" />
            </div>
        );
    }

    if (code.includes('harvest') || code.includes('thu') || code.includes('gặt') ||
        name.includes('thu') || name.includes('gặt')) {
        return (
            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-amber-100">
                <ShoppingBasket className="h-4 w-4 text-amber-700" />
            </div>
        );
    }

    if (code.includes('seed') || code.includes('hạt') || code.includes('mầm') ||
        name.includes('hạt') || name.includes('mầm')) {
        return (
            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100">
                <Sprout className="h-4 w-4 text-blue-600" />
            </div>
        );
    }

    if (code.includes('growth') || code.includes('tăng') || code.includes('phát') ||
        name.includes('tăng') || name.includes('phát')) {
        return (
            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-100">
                <Leaf className="h-4 w-4 text-emerald-600" />
            </div>
        );
    }

    if (code.includes('coffee') || code.includes('cà phê') ||
        name.includes('cà phê') || name.includes('coffee')) {
        return (
            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-brown-100">
                <Coffee className="h-4 w-4 text-brown-600" />
            </div>
        );
    }

    // Fallback: generate icon based on stage name or code
    const fallbackIcon = (
        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100">
            <TreePine className="h-4 w-4 text-gray-600" />
        </div>
    );

    return fallbackIcon;
};


export default function CropStagesDialog() {
    const [stages, setStages] = useState<CropStage[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchStages = useCallback(async () => {
        if (stages.length > 0) return;
        setLoading(true);
        try {
            const data = await getCropStages();
            console.log("Fetched crop stages:", data); // Debug log
            setStages(data.sort((a, b) => a.orderIndex - b.orderIndex));
        } catch (error) {
            console.error("Error fetching crop stages:", error); // Debug log
            toast.error("Không thể tải danh sách giai đoạn mùa vụ");
        } finally {
            setLoading(false);
        }
    }, [stages]);

    return (
        <Dialog onOpenChange={(open) => open && fetchStages()}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                >
                    <StickyNote className="w-4 h-4" />
                    Ghi chú giai đoạn
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                        📌 Giai đoạn mùa vụ
                    </DialogTitle>
                </DialogHeader>
                {loading ? (
                    <div className="flex justify-center py-6">
                        <Loader2 className="animate-spin h-5 w-5 mr-2" />
                        Đang tải dữ liệu...
                    </div>
                ) : stages.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">
                        Không có dữ liệu.
                    </p>
                ) : (
                    <ul className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {stages.map((stage) => (
                            <li
                                key={stage.stageId}
                                className="border rounded-lg p-3 bg-white hover:bg-gray-50 transition"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-sm font-medium text-orange-700 flex items-center gap-2">
                                        {getStageIcon(stage.stageCode, stage.stageName)}
                                        {stage.stageName}
                                    </h3>
                                    <Badge variant="outline" className="text-xs">
                                        {stage.stageCode ? stage.stageCode.toUpperCase() : "N/A"}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {stage.description}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </DialogContent>
        </Dialog>
    );
}
