'use client';

import { CropViewAllDto } from '@/lib/api/crops';
import { CropStatus, CropStatusLabels, CropStatusColors, CropStatusIconColors } from '@/lib/constants/cropStatus';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Ruler, Calendar, Trash2, Hash, Circle } from 'lucide-react';

interface CropCardProps {
    crop: CropViewAllDto;
    onDelete: (cropId: string) => void;
    onView?: (crop: CropViewAllDto) => void;
}

const getStatusColor = (status: CropStatus) => {
    return CropStatusColors[status] || 'bg-gray-100 text-gray-800';
};

const getStatusLabel = (status: CropStatus) => {
    return CropStatusLabels[status] || status;
};

export const CropCard: React.FC<CropCardProps> = ({ crop, onDelete, onView }) => {
    const handleCardClick = () => {
        if (onView) {
            onView(crop);
        }
    };

    return (
        <div
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:border-green-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden"
            onClick={handleCardClick}
        >
            {/* Background gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-emerald-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            {/* Content */}
            <div className="relative z-10">
                {/* Header - Farm Name */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                            {crop.farmName}
                        </h3>
                    </div>
                </div>

                {/* Info Section */}
                <div className="space-y-3">
                    {/* Code */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl group-hover:bg-green-50 transition-colors">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Hash className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">Mã vùng trồng</p>
                            <p className="text-sm text-gray-600 mt-1 font-mono">{crop.cropCode}</p>
                        </div>
                    </div>

                    {/* Area */}
                    {crop.cropArea && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl group-hover:bg-green-50 transition-colors">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Ruler className="h-4 w-4 text-orange-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-700">Diện tích</p>
                                <p className="text-sm text-gray-600 mt-1">
                                    <span className="font-semibold text-green-600">{crop.cropArea} ha</span>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Status */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl group-hover:bg-green-50 transition-colors">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Circle className={`h-4 w-4 ${CropStatusIconColors[crop.status]}`} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">Trạng thái</p>
                            <div className="mt-1">
                                <Badge className={`${getStatusColor(crop.status)} border-0 shadow-sm text-xs`}>
                                    {getStatusLabel(crop.status)}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


