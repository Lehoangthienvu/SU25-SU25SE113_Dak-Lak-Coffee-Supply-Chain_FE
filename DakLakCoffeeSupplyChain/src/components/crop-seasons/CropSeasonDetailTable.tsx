"use client";

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/crop-seasons/StatusBadge";
import {
  getCropSeasonDetailStatusMap,
  CropSeasonDetailStatusNumberToValue,
} from "@/lib/constants/cropSeasonDetailStatus";
import { CropSeasonDetail } from "@/lib/api/cropSeasonDetail";
import { Edit, Coffee, MapPin, Calendar, Target, ChevronDown, ChevronRight } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import UpdateCropSeasonDetailDialog from "./UpdateCropSeasonDetailDialog";
// import { softDeleteCropSeasonDetail } from "@/lib/api/cropSeasonDetail"; // Comment lại - Không sử dụng delete
// import { AppToast } from "@/components/ui/AppToast"; // Comment lại - Không sử dụng delete
import { formatDate } from "@/lib/utils";

interface Props {
  details: CropSeasonDetail[];
  onReload: () => void;
}

export default function CropSeasonDetailTable({
  details,
  onReload,
}: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const [editingDetailId, setEditingDetailId] = useState<string | null>(null);
  const [isClosingDialog, setIsClosingDialog] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());


  // Prevent body scroll and handle dialog backdrop clicks
  React.useEffect(() => {
    if (editingDetailId) {
      document.body.style.overflow = 'hidden';

      // Add event listener to prevent clicks on backdrop from triggering row clicks
      const handleDocumentClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        // Check if click is on dialog backdrop (outside dialog content)
        if (target.closest('[data-radix-dialog-overlay]') && !target.closest('[data-radix-dialog-content]')) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
      };

      const handleMouseDown = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        // Check if click is on dialog backdrop (outside dialog content)
        if (target.closest('[data-radix-dialog-overlay]') && !target.closest('[data-radix-dialog-content]')) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
      };

      const handlePointerDown = (e: PointerEvent) => {
        const target = e.target as HTMLElement;
        // Check if click is on dialog backdrop (outside dialog content)
        if (target.closest('[data-radix-dialog-overlay]') && !target.closest('[data-radix-dialog-content]')) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
      };

      document.addEventListener('click', handleDocumentClick, true);
      document.addEventListener('mousedown', handleMouseDown, true);
      document.addEventListener('pointerdown', handlePointerDown, true);

      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('click', handleDocumentClick, true);
        document.removeEventListener('mousedown', handleMouseDown, true);
        document.removeEventListener('pointerdown', handlePointerDown, true);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [editingDetailId, isClosingDialog]);

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

  const toggleRowExpansion = (detailId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(detailId)) {
        newSet.delete(detailId);
      } else {
        newSet.add(detailId);
      }
      return newSet;
    });
  };

  const handleRowClick = (detailId: string, event: React.MouseEvent) => {
    // Prevent navigation if dialog is open or closing
    if (editingDetailId || isClosingDialog) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // Prevent navigation if clicking on buttons or interactive elements
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]') || target.closest('[data-radix-collection-item]')) {
      return;
    }

    // Prevent navigation if clicking on dialog backdrop
    if (target.closest('[data-radix-dialog-overlay]') || target.closest('[data-radix-dialog-content]')) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // Additional check for dialog backdrop
    const dialogOverlay = document.querySelector('[data-radix-dialog-overlay]');
    if (dialogOverlay && dialogOverlay.contains(target)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    router.push(`/dashboard/farmer/crop-progress/${detailId}`);
  };

  // Comment lại chức năng delete - Farmer không có quyền xóa vùng trồng đã có tiến độ
  /*
  const handleDelete = async (detailId: string) => {
    if (!confirm(t('cropSeasons.detailTable.confirmDelete'))) {
      return;
    }

    try {
      setDeletingDetailId(detailId);
      await softDeleteCropSeasonDetail(detailId);
      AppToast.success(t('cropSeasons.detailTable.deleteSuccess'));
      onReload();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('cropSeasons.detailTable.deleteError');
      AppToast.error(errorMessage);
    } finally {
      setDeletingDetailId(null);
    }
  };
  */

  if (details.length === 0)
    return (
      <div className="text-center py-8 text-gray-500">
        <Coffee className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>{t('cropSeasons.detailTable.noPlantingAreas')}</p>
      </div>
    );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-green-100 overflow-hidden relative">
      {editingDetailId && (
        <div
          className="absolute inset-0 bg-transparent z-10"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        />
      )}
      <div className="space-y-2 p-4">
        {details.map((detail: CropSeasonDetail) => {
          const isExpanded = expandedRows.has(detail.detailId);
          const yieldPercent = calculateYieldPercentage(detail.actualYield, detail.estimatedYield);

          return (
            <div key={detail.detailId} className="border border-green-100 rounded-lg overflow-hidden">
              {/* Compact Row - Always Visible */}
              <div
                className={`p-4 cursor-pointer transition-colors ${(editingDetailId || isClosingDialog) ? 'cursor-default' : 'hover:bg-green-50'}`}
                onClick={(e) => {
                  // Prevent expansion if clicking on buttons
                  const target = e.target as HTMLElement;
                  if (target.closest('button') || target.closest('[role="button"]') || target.closest('[data-radix-collection-item]')) {
                    return;
                  }
                  toggleRowExpansion(detail.detailId);
                }}
              >
                <div className="flex items-center justify-between">
                  {/* Left side - Coffee type and basic info */}
                  <div className="flex items-center gap-3 flex-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRowExpansion(detail.detailId);
                      }}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                    </Button>

                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <Coffee className="w-4 h-4 text-white" />
                    </div>

                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{detail.typeName}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {detail.areaAllocated} ha
                        </span>
                        <StatusBadge
                          status={CropSeasonDetailStatusNumberToValue[detail.status] || 'Planned'}
                          map={getCropSeasonDetailStatusMap(t)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right side - Yield info and actions */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {detail.estimatedYield ? `${detail.estimatedYield.toLocaleString()} kg` : "—"}
                      </div>
                      <div className="text-xs text-gray-500">Ước tính</div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {detail.actualYield ? `${detail.actualYield} kg` : "—"}
                      </div>
                      <div className="text-xs text-gray-500">Thực tế</div>
                    </div>

                    {yieldPercent !== null && (
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getYieldColor(yieldPercent)}`}>
                          {yieldPercent}%
                        </div>
                        <div className="text-xs text-gray-500">Tỷ lệ</div>
                      </div>
                    )}

                    <Dialog
                      open={editingDetailId === detail.detailId}
                      onOpenChange={(open) => {
                        if (!open) {
                          setIsClosingDialog(true);
                          setTimeout(() => {
                            setEditingDetailId(null);
                            setIsClosingDialog(false);
                          }, 100);
                        } else {
                          setEditingDetailId(detail.detailId);
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent
                        title={t('cropSeasons.detailTable.updateDetailTitle')}
                        className="max-w-lg"
                      >
                        <UpdateCropSeasonDetailDialog
                          detailId={detail.detailId}
                          onClose={() => setEditingDetailId(null)}
                          onSuccess={onReload}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>

              {/* Expanded Details - Show when clicked */}
              {isExpanded && (
                <div className="border-t border-green-100 bg-green-50/30 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Farm Information */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-600" />
                        Thông tin trang trại
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-gray-500">Tên trang trại:</span>
                          <span className="ml-2 text-gray-900">{detail.farmName || t('cropSeasons.detailTable.plantingArea')}</span>
                        </div>
                        {(detail.address || detail.Address) && (
                          <div>
                            <span className="text-gray-500">Địa chỉ:</span>
                            <span className="ml-2 text-gray-900">{detail.address || detail.Address}</span>
                          </div>
                        )}
                        {detail.cropArea && (
                          <div>
                            <span className="text-gray-500">Tổng diện tích:</span>
                            <span className="ml-2 text-gray-900">{detail.cropArea} ha</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Harvest Schedule */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        Lịch thu hoạch
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-gray-500">Bắt đầu:</span>
                          <span className="ml-2 text-gray-900">{formatDate(detail.expectedHarvestStart)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Kết thúc:</span>
                          <span className="ml-2 text-gray-900">{formatDate(detail.expectedHarvestEnd)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Production Details */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <Target className="w-4 h-4 text-orange-600" />
                        Chi tiết sản xuất
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-gray-500">Diện tích phân bổ:</span>
                          <span className="ml-2 text-gray-900">{detail.areaAllocated} ha</span>
                        </div>
                        {detail.plannedQuality && (
                          <div>
                            <span className="text-gray-500">Chất lượng dự kiến:</span>
                            <span className="ml-2 text-gray-900">{detail.plannedQuality}</span>
                          </div>
                        )}
                        {/* {detail.qualityGrade && (
                            <div>
                              <span className="text-gray-500">Đánh giá chất lượng:</span>
                              <span className="ml-2 text-gray-900">{detail.qualityGrade}</span>
                            </div>
                          )} */}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-4 border-t border-green-200 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/farmer/crop-progress/${detail.detailId}`);
                      }}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      Xem tiến độ
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
