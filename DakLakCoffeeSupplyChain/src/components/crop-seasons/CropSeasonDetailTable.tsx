"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/crop-seasons/StatusBadge";
import {
  CropSeasonDetailStatusMap,
} from "@/lib/constants/cropSeasonDetailStatus";
import { CropSeasonDetail } from "@/lib/api/cropSeasons";
import { Edit, Eye, Coffee, MapPin, Calendar, Target } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import UpdateCropSeasonDetailDialog from "./UpdateCropSeasonDetailDialog";

interface Props {
  details: CropSeasonDetail[];
  onReload: () => void;
}

export default function CropSeasonDetailTable({
  details,
  onReload,
}: Props) {
  const [editingDetailId, setEditingDetailId] = useState<string | null>(null);
  const router = useRouter();

  const formatDate = (date?: string) => {
    if (!date) return "Chưa cập nhật";
    const d = new Date(date);
    return isNaN(d.getTime()) ? "Chưa cập nhật" : d.toLocaleDateString("vi-VN");
  };

  const calculateYieldPercentage = (
    actual?: number | null,
    estimated?: number | null
  ) => {
    if (!actual || !estimated || estimated === 0) return null;
    return Math.round((actual / estimated) * 100);
  };

  const getYieldColor = (percent: number) => {
    if (percent < 70) return "text-red-500";
    if (percent < 90) return "text-yellow-500";
    return "text-green-600";
  };

  if (details.length === 0)
    return (
      <div className="text-center py-8 text-gray-500">
        <Coffee className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Chưa có vùng trồng nào được tạo.</p>
      </div>
    );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-green-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-green-50 to-emerald-50 text-gray-700 font-semibold">
            <tr>
              <th className="px-3 py-3 text-left">Loại cà phê</th>
              <th className="px-3 py-3 text-center">Diện tích (ha)</th>
              <th className="px-3 py-3 text-center">Sản lượng ước tính</th>
              <th className="px-3 py-3 text-center">Sản lượng thu hoạch</th>
              <th className="px-3 py-3 text-center">Tỷ lệ (%)</th>
              <th className="px-3 py-3 text-center">Trạng thái</th>
              <th className="px-3 py-3 text-center">Thu hoạch dự kiến</th>
              <th className="px-3 py-3 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-green-100">
            {details.map((detail) => (
              <tr key={detail.detailId} className="hover:bg-green-50 transition-colors">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <Coffee className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{detail.typeName}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>Vùng trồng</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Target className="w-3 h-3 text-green-500" />
                    <span className="font-medium text-gray-700">{detail.areaAllocated} ha</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="font-medium text-gray-700">
                    {detail.committedQuantity ? `${detail.committedQuantity} kg` : "—"}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="font-medium text-gray-700">
                    {detail.actualYield ? `${detail.actualYield} kg` : "—"}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  {(() => {
                    const percent = calculateYieldPercentage(detail.actualYield, detail.estimatedYield);
                    if (percent === null) return "—";
                    return (
                      <span className={`font-medium ${getYieldColor(percent)}`}>
                        {percent}%
                      </span>
                    );
                  })()}
                </td>
                <td className="px-3 py-3 text-center">
                  <StatusBadge status={detail.status} map={CropSeasonDetailStatusMap} />
                </td>
                <td className="px-3 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-500" />
                    <div className="text-xs">
                      <div className="font-medium text-gray-700">
                        {formatDate(detail.expectedHarvestStart)}
                      </div>
                      <div className="text-gray-500">đến {formatDate(detail.expectedHarvestEnd)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <Dialog
                      open={editingDetailId === detail.detailId}
                      onOpenChange={(open) =>
                        setEditingDetailId(open ? detail.detailId : null)
                      }
                    >
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-amber-600 hover:text-amber-800 hover:bg-amber-50">
                          <Edit className="w-3 h-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent title="Cập nhật chi tiết vùng trồng" className="max-w-lg">
                        <UpdateCropSeasonDetailDialog
                          detailId={detail.detailId}
                          onClose={() => setEditingDetailId(null)}
                          onSuccess={onReload}
                        />
                      </DialogContent>
                    </Dialog>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        router.push(
                          `/dashboard/farmer/crop-progress/${detail.detailId}`
                        )
                      }
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
