'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getLogsByInventoryId } from '@/lib/api/inventoryLogs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, History, TrendingUp, TrendingDown, Package, User, Clock, FileText, BarChart3, Calendar, Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function StaffInventoryLogsPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      try {
        const result = await getLogsByInventoryId(id as string);
        if (Array.isArray(result) && result.length > 0) {
          setLogs(result);
        } else {
          setError(t('inventoryHistory.error.noLogs'));
        }
      } catch (err: any) {
        setError(err.message || t('inventoryHistory.error.loadFailed'));
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchLogs();
  }, [id]);

  // Tính toán thống kê
  const totalLogs = logs.length;
  const increaseLogs = logs.filter(log => log.actionType === "increase").length;
  const decreaseLogs = logs.filter(log => log.actionType === "decrease").length;
  const todayLogs = logs.filter(log => {
    const today = new Date().toDateString();
    const logDate = new Date(log.loggedAt).toDateString();
    return today === logDate;
  }).length;

  const getActionIcon = (actionType: string) => {
    if (actionType?.toLowerCase().includes('increase') || actionType?.toLowerCase().includes('nhập')) {
      return <TrendingUp className="w-5 h-5 text-emerald-600" />;
    } else if (actionType?.toLowerCase().includes('decrease') || actionType?.toLowerCase().includes('xuất')) {
      return <TrendingDown className="w-5 h-5 text-rose-600" />;
    }
    return <Package className="w-5 h-5 text-blue-600" />;
  };

  const getActionColor = (actionType: string) => {
    if (actionType?.toLowerCase().includes('increase') || actionType?.toLowerCase().includes('nhập')) {
      return 'border-emerald-500 bg-emerald-50';
    } else if (actionType?.toLowerCase().includes('decrease') || actionType?.toLowerCase().includes('xuất')) {
      return 'border-rose-500 bg-rose-50';
    }
    return 'border-blue-500 bg-blue-50';
  };

  const getActionLabel = (actionType: string) => {
    if (actionType?.toLowerCase().includes('increase') || actionType?.toLowerCase().includes('nhập')) {
      return '📥 Nhập kho';
    } else if (actionType?.toLowerCase().includes('decrease') || actionType?.toLowerCase().includes('xuất')) {
      return '📤 Xuất kho';
    }
    return t('inventoryHistory.actionLabels.change');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
      {/* Header với gradient xanh lá */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <History className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">📑 {t('inventoryHistory.title')}</h1>
                <p className="text-green-100 text-lg">{t('inventoryHistory.subtitle')}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/staff/inventories')}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('inventoryHistory.actions.backToList')}
            </Button>
          </div>
          
          {/* Thống kê nhanh */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-green-200" />
                <span className="text-green-200 text-sm">{t('inventoryHistory.stats.totalLogs')}</span>
              </div>
              <p className="text-white font-bold text-xl">{totalLogs}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-200" />
                <span className="text-emerald-200 text-sm">{t('inventoryHistory.stats.inbound')}</span>
              </div>
              <p className="text-emerald-200 font-bold text-xl">{increaseLogs}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-rose-200" />
                <span className="text-rose-200 text-sm">{t('inventoryHistory.stats.outbound')}</span>
              </div>
              <p className="text-rose-200 font-bold text-xl">{decreaseLogs}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-green-200" />
                <span className="text-green-200 text-sm">{t('inventoryHistory.stats.today')}</span>
              </div>
              <p className="text-white font-bold text-xl">{todayLogs}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nội dung chính */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
          <CardTitle className="text-xl font-bold text-green-800 flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <FileText className="w-4 h-4 text-green-600" />
            </div>
            {t('inventoryHistory.sections.detailedHistory')}
            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 text-xs">
              {totalLogs} log
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading && (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">{t('inventoryHistory.loading.title')}</p>
            </div>
          )}

          {!loading && error && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">❌</span>
              </div>
              <p className="text-red-600 font-medium text-lg">{error}</p>
            </div>
          )}

          {!loading && !error && logs.length > 0 && (
            <div className="p-6">
              <div className="space-y-4">
                {logs.map((log, index) => (
                  <div
                    key={log.logId}
                    className={`border-l-4 ${getActionColor(log.actionType)} p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 relative`}
                  >
                    {/* Timeline dot */}
                    <div className={`absolute -left-2 top-6 w-4 h-4 rounded-full ${
                      log.actionType?.toLowerCase().includes('increase') || log.actionType?.toLowerCase().includes('nhập')
                        ? 'bg-emerald-500'
                        : log.actionType?.toLowerCase().includes('decrease') || log.actionType?.toLowerCase().includes('xuất')
                        ? 'bg-rose-500'
                        : 'bg-blue-500'
                    }`}></div>
                    
                    {/* Header với action type và timestamp */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                          {getActionIcon(log.actionType)}
                        </div>
                        <div>
                          <Badge
                            className={`capitalize px-3 py-1 text-sm font-semibold rounded-full ${
                              log.actionType?.toLowerCase().includes('increase') || log.actionType?.toLowerCase().includes('nhập')
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : log.actionType?.toLowerCase().includes('decrease') || log.actionType?.toLowerCase().includes('xuất')
                                ? 'bg-rose-100 text-rose-800 border-rose-200'
                                : 'bg-blue-100 text-blue-800 border-blue-200'
                            }`}
                          >
                            {getActionLabel(log.actionType)}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(log.loggedAt).toLocaleString("vi-VN")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 font-medium">{t('inventoryHistory.fields.logId')}</p>
                        <p className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {log.logId}
                        </p>
                      </div>
                    </div>

                    {/* Thông tin chi tiết */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-12">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <Package className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 font-medium">{t('inventoryHistory.fields.quantityChanged')}</p>
                            <p className={`text-lg font-bold ${
                              log.actionType?.toLowerCase().includes('increase') || log.actionType?.toLowerCase().includes('nhập')
                                ? 'text-emerald-600'
                                : log.actionType?.toLowerCase().includes('decrease') || log.actionType?.toLowerCase().includes('xuất')
                                ? 'text-rose-600'
                                : 'text-blue-600'
                            }`}>
                              {(log.actionType?.toLowerCase().includes('increase') || log.actionType?.toLowerCase().includes('nhập')) ? '+' : '-'}
                              {log.quantityChanged} kg
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 font-medium">{t('inventoryHistory.fields.updatedBy')}</p>
                            <p className="text-sm font-semibold text-gray-900">{log.updatedByName || t('inventoryHistory.common.system')}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <FileText className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 font-medium">{t('inventoryHistory.fields.note')}</p>
                            <p className="text-sm text-gray-900">{log.note || t('inventoryHistory.common.noNote')}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <Clock className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 font-medium">{t('inventoryHistory.fields.timestamp')}</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {new Date(log.loggedAt).toLocaleDateString("vi-VN")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && !error && logs.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg mb-2">{t('inventoryHistory.empty.title')}</p>
              <p className="text-gray-400 text-sm">{t('inventoryHistory.empty.description')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
