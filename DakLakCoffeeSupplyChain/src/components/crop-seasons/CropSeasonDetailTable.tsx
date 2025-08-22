"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/crop-seasons/StatusBadge";
import {
  CropSeasonDetailStatusMap,
} from "@/lib/constants/cropSeasonDetailStatus";
import { toast } from "sonner";
import { useConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { CropSeasonDetail } from "@/lib/api/cropSeasons";
import { Edit, Trash, Eye, Coffee, MapPin, Calendar, TrendingUp, Target } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import UpdateCropSeasonDetailDialog from "@/app/dashboard/farmer/crop-seasons/[id]/details/edit/page";
import { softDeleteCropSeasonDetail } from "@/lib/api/cropSeasonDetail";

interface Props {
  details: CropSeasonDetail[];
  cropSeasonId: string;
  onReload: () => void;
}

export default function CropSeasonDetailTable({
  details,
  cropSeasonId,
  onReload,
}: Props) {
  const [editingDetailId, setEditingDetailId] = useState<string | null>(null);
  const router = useRouter();
  const { openDialog, ConfirmationDialog } = useConfirmationDialog();

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

  const handleDelete = async (detailId: string, name: string) => {
    openDialog({
      title: "Xác nhận xóa vùng trồng",
      message: `Bạn có chắc muốn xoá vùng trồng: ${name}?`,
      confirmText: "Xóa",
      cancelText: "Hủy",
      type: "danger",
      onConfirm: async () => {
        try {
          await softDeleteCropSeasonDetail(detailId);
          toast.success("Xoá vùng trồng thành công");
          onReload();
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : "Xoá vùng trồng thất bại";
          toast.error(errorMessage);
        }
      }
    });
  };

  if (details.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Coffee className="w-6 h-6 text-orange-600" />
        </div>
        <p className="text-gray-500 text-sm font-medium mb-1">
          Không có dữ liệu vùng trồng
        </p>
        <p className="text-gray-400 text-xs">
          Bắt đầu thêm vùng trồng đầu tiên cho mùa vụ này
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-green-50 to-emerald-50 text-gray-700 font-semibold">
            <tr>
              <th className="text-left px-3 py-2">Loại cà phê</th>
              <th className="text-left px-3 py-2">Diện tích</th>
              <th className="text-left px-3 py-2">Chất lượng</th>
              <th className="text-left px-3 py-2">Năng suất (dự kiến)</th>
              <th className="text-left px-3 py-2">Năng suất thực</th>
              <th className="text-left px-3 py-2">% đạt</th>
              <th className="text-left px-3 py-2">Thời gian thu hoạch</th>
              <th className="text-left px-3 py-2">Trạng thái</th>
              <th className="text-left px-3 py-2">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-green-100">
            {details.map((detail) => (
              <tr key={detail.detailId} className="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-md flex items-center justify-center">
                      <Coffee className="w-3 h-3 text-white" />
                    </div>
                    <span className="font-medium text-gray-800 text-xs">{detail.typeName}</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-orange-500" />
                    {detail.areaAllocated && detail.areaAllocated > 0
                      ? <span className="font-medium text-gray-700 text-xs">{detail.areaAllocated} ha</span>
                      : <span className="italic text-red-500 text-xs">Chưa nhập</span>}
                  </div>
                </td>
                <td className="px-3 py-2">
                  {detail.plannedQuality?.trim()
                    ? <span className="font-medium text-gray-700 text-xs">{detail.plannedQuality}</span>
                    : <span className="italic text-gray-500 text-xs">Chưa có</span>}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <Target className="w-3 h-3 text-blue-500" />
                    <span className="font-medium text-gray-700 text-xs">{detail.estimatedYield ?? "-"} Kg</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  {detail.actualYield !== null ? (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="font-medium text-gray-700 text-xs">{detail.actualYield} Kg</span>
                    </div>
                  ) : (
                    <span className="italic text-gray-500 text-xs">Chưa thu hoạch</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {(() => {
                    const percent = calculateYieldPercentage(detail.actualYield, detail.estimatedYield);
                    if (percent === null) {
                      return <span className="italic text-gray-500 text-xs">-</span>;
                    }
                    return (
                      <span className={`font-bold text-xs ${getYieldColor(percent)}`}>
                        {percent}%
                      </span>
                    );
                  })()}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-purple-500" />
                    {detail.expectedHarvestStart
                      ? <span className="text-xs text-gray-700">
                        {formatDate(detail.expectedHarvestStart)} - {formatDate(detail.expectedHarvestEnd)}
                      </span>
                      : <span className="text-gray-500 text-xs">-</span>}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <StatusBadge
                    status={detail.status}
                    map={CropSeasonDetailStatusMap}
                  />
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
                      <DialogContent title="Chỉnh sửa vùng trồng">
                        <UpdateCropSeasonDetailDialog
                          detailId={detail.detailId}
                          cropSeasonId={cropSeasonId}
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

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        handleDelete(detail.detailId, detail.typeName)
                      }
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <Trash className="w-3 h-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog />
    </>
  );
}
