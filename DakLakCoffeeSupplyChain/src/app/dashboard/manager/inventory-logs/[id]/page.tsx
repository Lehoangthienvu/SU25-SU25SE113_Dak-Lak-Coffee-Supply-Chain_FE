'use client';

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useRouter } from "next/navigation";
import { getInventoryLogById } from "@/lib/api/inventoryLogs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, Warehouse, Coffee, Calendar, User, FileText, Activity, TrendingUp, TrendingDown, Clock, Hash, MapPin, BarChart3 } from "lucide-react";

export default function InventoryLogDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const logId = params?.id as string;
  const router = useRouter();

  const [log, setLog] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const data = await getInventoryLogById(logId);
        setLog(data);
      } catch (err: any) {
        setError(err.message || t('managerInventoryLogs.detail.error.loadData'));
      } finally {
        setLoading(false);
      }
    }

    if (logId) fetchData();
  }, [logId, t]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">{t('managerInventoryLogs.detail.loading.title')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-red-500 text-lg mb-2">{t('managerInventoryLogs.detail.error.loadData')}</p>
          <p className="text-gray-600">{error}</p>
          <Button 
            onClick={() => router.back()} 
            className="mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('managerInventoryLogs.detail.back')}
          </Button>
        </div>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-600 text-lg">{t('managerInventoryLogs.detail.error.notFound')}</p>
          <Button 
            onClick={() => router.back()} 
            className="mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('managerInventoryLogs.detail.back')}
          </Button>
        </div>
      </div>
    );
  }

  const isIncrease = log?.actionType === "increase";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      {/* Header với gradient xanh dương */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t('managerInventoryLogs.detail.title')}</h1>
              <p className="text-blue-100 text-lg">{t('managerInventoryLogs.detail.subtitle')}</p>
            </div>
            <div className="text-right">
              <Badge
                className={`capitalize px-4 py-2 text-lg font-semibold rounded-full ${
                  isIncrease
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : "bg-rose-100 text-rose-800 border-rose-200"
                }`}
              >
                {isIncrease ? t('managerInventoryLogs.table.actions.inbound') : t('managerInventoryLogs.table.actions.outbound')}
              </Badge>
            </div>
          </div>
          
          {/* Thông tin nhanh */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-blue-200" />
                <span className="text-blue-200 text-sm">{t('managerInventoryLogs.detail.fields.timestamp')}</span>
              </div>
              <p className="text-white font-semibold">
                {log?.loggedAt && new Date(log.loggedAt).toLocaleString("vi-VN")}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Hash className="w-4 h-4 text-blue-200" />
                <span className="text-blue-200 text-sm">{t('managerInventoryLogs.detail.fields.logId')}</span>
              </div>
              <p className="text-white font-semibold font-mono">{log?.logId || t('managerInventoryLogs.common.na')}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-blue-200" />
                <span className="text-blue-200 text-sm">{t('managerInventoryLogs.detail.fields.updatedBy')}</span>
              </div>
              <p className="text-white font-semibold">{log?.updatedByName || t('managerInventoryLogs.common.system')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nút quay lại */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="h-10 px-4 text-sm border-blue-200 hover:border-blue-300 hover:bg-blue-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('managerInventoryLogs.detail.backToList')}
        </Button>
      </div>

      {/* Layout chính */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Cột chính - 2 cột */}
        <div className="xl:col-span-2 space-y-6">
          {/* Thông tin lô hàng */}
          <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <CardTitle className="text-xl font-bold text-blue-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                {t('managerInventoryLogs.detail.sections.batchInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">{t('managerInventoryLogs.detail.fields.batchCode')}</p>
                      <p className="text-lg font-semibold text-gray-900">{log?.batchCode || t('managerInventoryLogs.common.na')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Coffee className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">{t('managerInventoryLogs.detail.fields.product')}</p>
                      <p className="text-lg font-semibold text-gray-900">{log?.coffeeTypeName || t('managerInventoryLogs.common.na')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <Activity className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">{t('managerInventoryLogs.detail.fields.coffeeType')}</p>
                      <p className="text-lg font-semibold text-gray-900">{log?.coffeeTypeName || t('managerInventoryLogs.common.na')}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">{t('managerInventoryLogs.detail.fields.seasonCode')}</p>
                      <p className="text-lg font-semibold text-gray-900">{log?.seasonCode || t('managerInventoryLogs.common.na')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">{t('managerInventoryLogs.detail.fields.farmerName')}</p>
                      <p className="text-lg font-semibold text-gray-900">{log?.farmerName || t('managerInventoryLogs.common.na')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Warehouse className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">{t('managerInventoryLogs.detail.fields.warehouseName')}</p>
                      <p className="text-lg font-semibold text-gray-900">{log?.warehouseName || t('managerInventoryLogs.common.na')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chi tiết thay đổi */}
          <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <CardTitle className="text-xl font-bold text-blue-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                {t('managerInventoryLogs.detail.sections.changeDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">{t('managerInventoryLogs.detail.fields.inventoryCode')}</p>
                      <p className="text-lg font-semibold text-gray-900 font-mono">{log?.inventoryCode || t('managerInventoryLogs.common.na')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">{t('managerInventoryLogs.detail.fields.quantityChanged')}</p>
                      <p className={`text-2xl font-bold ${
                        isIncrease ? "text-emerald-600" : "text-rose-600"
                      }`}>
                        {isIncrease ? "+" : "-"}{log?.quantityChanged || 0} {t('managerInventoryLogs.common.kg')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">{t('managerInventoryLogs.detail.fields.note')}</p>
                      <p className="text-lg text-gray-900">{log?.note || t('managerInventoryLogs.common.noNote')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">{t('managerInventoryLogs.detail.fields.updatedBy')}</p>
                      <p className="text-lg font-semibold text-gray-900">{log?.updatedByName || t('managerInventoryLogs.common.system')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Thống kê nhanh */}
          <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <CardTitle className="text-lg font-bold text-blue-800 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                {t('managerInventoryLogs.detail.sections.quickStats')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 font-medium mb-2">{t('managerInventoryLogs.detail.fields.actionType')}</p>
                  <Badge
                    className={`capitalize px-3 py-2 text-sm font-semibold rounded-full ${
                      isIncrease
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : "bg-rose-100 text-rose-800 border-rose-200"
                    }`}
                  >
                    {isIncrease ? t('managerInventoryLogs.table.actions.inbound') : t('managerInventoryLogs.table.actions.outbound')}
                  </Badge>
                </div>

                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 font-medium mb-2">Trạng thái</p>
                  <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-2 text-sm font-semibold rounded-full">
                    {t('managerInventoryLogs.detail.status.completed')}
                  </Badge>
                </div>

                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 font-medium mb-2">{t('managerInventoryLogs.detail.fields.logId')}</p>
                  <p className="text-xs font-mono text-gray-600 bg-gray-100 p-2 rounded border">
                    {log?.logId || t('managerInventoryLogs.common.na')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hành động */}
          <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <CardTitle className="text-lg font-bold text-blue-800 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                {t('managerInventoryLogs.detail.sections.actions')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-10 text-sm border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {t('managerInventoryLogs.detail.actions.printDetails')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-10 text-sm border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  {t('managerInventoryLogs.detail.actions.viewWarehouseLocation')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
