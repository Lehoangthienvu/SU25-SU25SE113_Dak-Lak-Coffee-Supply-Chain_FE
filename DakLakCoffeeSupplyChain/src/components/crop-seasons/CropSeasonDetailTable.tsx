"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/crop-seasons/StatusBadge";
import {
  CropSeasonDetailStatusMap,
} from "@/lib/constants/cropSeasonDetailStatus";
import { CropSeasonDetail } from "@/lib/api/cropSeasons";
import { Edit, Coffee, MapPin, Calendar, Target } from "lucide-react";
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
  const { t } = useTranslation();
  const [editingDetailId, setEditingDetailId] = useState<string | null>(null);
  const router = useRouter();

  const formatDate = (date?: string) => {
    if (!date) return t('cropSeasons.details.notUpdated');
    const d = new Date(date);
    return isNaN(d.getTime()) ? t('cropSeasons.details.notUpdated') : d.toLocaleDateString("vi-VN");
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

  const handleRowClick = (detailId: string, event: React.MouseEvent) => {
    // Prevent navigation if clicking on the edit button
    if ((event.target as HTMLElement).closest('button')) {
      return;
    }
    router.push(`/dashboard/farmer/crop-progress/${detailId}`);
  };

  if (details.length === 0)
    return (
      <div className="text-center py-8 text-gray-500">
        <Coffee className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>{t('cropSeasons.detailTable.noPlantingAreas')}</p>
      </div>
    );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-green-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-green-50 to-emerald-50 text-gray-700 font-semibold">
            <tr>
              <th className="px-3 py-3 text-left">{t('cropSeasons.detailTable.coffeeType')}</th>
              <th className="px-3 py-3 text-center">{t('cropSeasons.detailTable.area')}</th>
              <th className="px-3 py-3 text-center">{t('cropSeasons.detailTable.estimatedYield')}</th>
              <th className="px-3 py-3 text-center">{t('cropSeasons.detailTable.actualYield')}</th>
              <th className="px-3 py-3 text-center">{t('cropSeasons.detailTable.ratio')}</th>
              <th className="px-3 py-3 text-center">{t('cropSeasons.detailTable.status')}</th>
              <th className="px-3 py-3 text-center">{t('cropSeasons.detailTable.expectedHarvest')}</th>
              <th className="px-3 py-3 text-center">{t('cropSeasons.detailTable.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-green-100">
            {details.map((detail) => (
              <tr
                key={detail.detailId}
                className="hover:bg-green-50 transition-colors cursor-pointer"
                onClick={(e) => handleRowClick(detail.detailId, e)}
              >
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <Coffee className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{detail.typeName}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{t('cropSeasons.detailTable.plantingArea')}</span>
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
                      <div className="text-gray-500">{t('cropSeasons.detailTable.to')} {formatDate(detail.expectedHarvestEnd)}</div>
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
                      <DialogContent title={t('cropSeasons.detailTable.updateDetailTitle')} className="max-w-lg">
                        <UpdateCropSeasonDetailDialog
                          detailId={detail.detailId}
                          onClose={() => setEditingDetailId(null)}
                          onSuccess={onReload}
                        />
                      </DialogContent>
                    </Dialog>
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
