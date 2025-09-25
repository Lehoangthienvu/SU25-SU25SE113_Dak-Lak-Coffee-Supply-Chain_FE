'use client';

import { CropViewAllDto } from '@/lib/api/crops';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Ruler, Calendar, Edit, Trash2 } from 'lucide-react';

interface CropCardProps {
    crop: CropViewAllDto;
    onEdit: (crop: CropViewAllDto) => void;
    onDelete: (cropId: string) => void;
}

const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case 'active':
            return 'bg-green-100 text-green-800';
        case 'inactive':
            return 'bg-gray-100 text-gray-800';
        case 'harvested':
            return 'bg-yellow-100 text-yellow-800';
        case 'processed':
            return 'bg-blue-100 text-blue-800';
        case 'sold':
            return 'bg-purple-100 text-purple-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
        case 'active':
            return 'Hoạt động';
        case 'inactive':
            return 'Không hoạt động';
        case 'harvested':
            return 'Đã thu hoạch';
        case 'processed':
            return 'Đã chế biến';
        case 'sold':
            return 'Đã bán';
        default:
            return status;
    }
};

export const CropCard: React.FC<CropCardProps> = ({ crop, onEdit, onDelete }) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {crop.cropCode}
                    </h3>
                    <Badge className={getStatusColor(crop.status)}>
                        {getStatusLabel(crop.status)}
                    </Badge>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(crop)}
                        className="h-8 w-8 p-0"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(crop.cropId)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-gray-900">{crop.farmName}</p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                        <p className="text-sm text-gray-600">{crop.address}</p>
                    </div>
                </div>

                {crop.cropArea && (
                    <div className="flex items-center gap-3">
                        <Ruler className="h-5 w-5 text-gray-400" />
                        <div>
                            <p className="text-sm text-gray-600">
                                Diện tích: <span className="font-medium">{crop.cropArea} ha</span>
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
