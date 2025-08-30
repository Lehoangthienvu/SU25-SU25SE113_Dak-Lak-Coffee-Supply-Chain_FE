'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  getInboundRequestDetailForFarmer
} from '@/lib/api/warehouseInboundRequest';
import {
  getAllProcessingBatchProgresses
} from '@/lib/api/processingBatchProgress';
import { getAllProcessingBatches } from '@/lib/api/processingBatches';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ClipboardList,
  CalendarCheck,
  CalendarClock,
  FileText,
  Coffee,
  Leaf,
  PackageCheck,
  Repeat2,
  ArrowLeft,
  Package,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

export default function FarmerInboundRequestDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [batchProgresses, setBatchProgresses] = useState<any[]>([]);
  const [batchData, setBatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      try {
        const result = await getInboundRequestDetailForFarmer(id as string);
        if (result?.status === 1) {
          setData(result.data);

          const batches = await getAllProcessingBatches();
          const thisBatch = (batches || []).find(b => b.batchId === result.data.batchId);
          setBatchData(thisBatch || null);

          const progresses = await getAllProcessingBatchProgresses();
          const progressOfBatch = progresses.filter(p => p.batchId === result.data.batchId);
          setBatchProgresses(progressOfBatch);
        } else {
          throw new Error(result?.message || t('farmerDeliveryRequest.error.loadData'));
        }
      } catch (err: any) {
        setError(err.message);
        toast.error(t('farmerDeliveryRequest.error.loadDetail') + ': ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, t]);

  const formatDate = (value: string | null | undefined) => {
    if (!value) return t('farmerDeliveryRequest.common.na');
    const d = new Date(value);
    return isNaN(d.getTime()) ? t('farmerDeliveryRequest.common.unknown') : d.toLocaleDateString('vi-VN');
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Pending': return t('farmerDeliveryRequest.status.pending');
      case 'Approved': return t('farmerDeliveryRequest.status.approved');
      case 'Rejected': return t('farmerDeliveryRequest.status.rejected');
      case 'Cancelled': return t('farmerDeliveryRequest.status.cancelled');
      case 'Completed': return t('farmerDeliveryRequest.status.completed');
      default: return status;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Cancelled': return 'bg-gray-200 text-gray-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Tính toán số lượng còn lại chính xác
  const totalProcessed = batchProgresses.reduce((sum, p) => sum + (p.outputQuantity ?? 0), 0);
  
  // Số lượng còn lại = đã sơ chế - đã yêu cầu trong request hiện tại
  // Lưu ý: Đây chỉ là số lượng còn lại của request hiện tại, không phải của toàn bộ batch
  const remainingForThisRequest = Math.max(0, totalProcessed - (data?.requestedQuantity ?? 0));
  
  // Số lượng còn lại thực tế của batch (cần tính từ tất cả requests và receipts)
  const remainingForBatch = batchData ? (batchData.totalOutputQuantity || 0) - (data?.requestedQuantity ?? 0) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('farmerDeliveryRequest.loading.loadingData')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('farmerDeliveryRequest.detail.error.loadData')}</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('farmerDeliveryRequest.detail.back')}
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('farmerDeliveryRequest.detail.error.notFound')}</h2>
          <p className="text-gray-600 mb-4">{t('farmerDeliveryRequest.detail.error.notFoundMessage')}</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('farmerDeliveryRequest.detail.back')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 py-6 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-orange-100">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/farmer/warehouse-request')}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('farmerDeliveryRequest.detail.backToList')}
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800 mb-1">
                {t('farmerDeliveryRequest.detail.title')}
              </h1>
              <p className="text-gray-600 text-sm">
                {t('farmerDeliveryRequest.detail.subtitle')}
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-xs">{t('farmerDeliveryRequest.detail.stats.requestedQuantity')}</p>
                  <p className="text-xl font-bold">{data.requestedQuantity} {t('farmerDeliveryRequest.common.kg')}</p>
                </div>
                <Package className="w-6 h-6 text-orange-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs">{t('farmerDeliveryRequest.detail.stats.processed')}</p>
                  <p className="text-xl font-bold">{totalProcessed} {t('farmerDeliveryRequest.common.kg')}</p>
                </div>
                <TrendingUp className="w-6 h-6 text-green-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs">{t('farmerDeliveryRequest.detail.stats.remaining')}</p>
                  <p className="text-xl font-bold">{Math.max(0, remainingForThisRequest)} {t('farmerDeliveryRequest.common.kg')}</p>
                </div>
                <Repeat2 className="w-6 h-6 text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs">{t('farmerDeliveryRequest.detail.stats.status')}</p>
                  <p className="text-lg font-bold">{getStatusLabel(data.status)}</p>
                </div>
                <Clock className="w-6 h-6 text-purple-200" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Details */}
            <Card className="border-orange-100">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-orange-600" />
                  {t('farmerDeliveryRequest.detail.sections.requestInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailItem icon={<ClipboardList />} label={t('farmerDeliveryRequest.detail.fields.requestCode')} value={data.requestCode} />
                  <DetailItem
                    icon={<PackageCheck />}
                    label={t('farmerDeliveryRequest.detail.fields.status')}
                    value={<Badge className={`capitalize ${getStatusStyle(data.status)}`}>{getStatusLabel(data.status)}</Badge>}
                  />
                  <DetailItem icon={<Repeat2 />} label={t('farmerDeliveryRequest.detail.fields.requestedQuantity')} value={`${data.requestedQuantity} ${t('farmerDeliveryRequest.common.kg')}`} />
                  <DetailItem icon={<CalendarClock />} label={t('farmerDeliveryRequest.detail.fields.preferredDeliveryDate')} value={formatDate(data.preferredDeliveryDate)} />
                  <DetailItem icon={<CalendarCheck />} label={t('farmerDeliveryRequest.detail.fields.actualDeliveryDate')} value={formatDate(data.actualDeliveryDate)} />
                  <DetailItem icon={<FileText />} label={t('farmerDeliveryRequest.detail.fields.note')} value={data.note || t('farmerDeliveryRequest.common.na')} />
                </div>
              </CardContent>
            </Card>

            {/* Batch Information */}
            <Card className="border-orange-100">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-600" />
                  {t('farmerDeliveryRequest.detail.sections.batchInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailItem icon={<ClipboardList />} label={t('farmerDeliveryRequest.detail.fields.batchCode')} value={data.batchCode} />
                  <DetailItem icon={<Coffee />} label={t('farmerDeliveryRequest.detail.fields.coffeeType')} value={data.coffeeType} />
                  <DetailItem icon={<Leaf />} label={t('farmerDeliveryRequest.detail.fields.seasonCode')} value={data.seasonCode} />
                  <DetailItem icon={<PackageCheck />} label={t('farmerDeliveryRequest.detail.fields.totalProcessed')} value={`${totalProcessed} ${t('farmerDeliveryRequest.common.kg')}`} />
                  <DetailItem icon={<Repeat2 />} label={t('farmerDeliveryRequest.detail.fields.remainingAvailable')} value={`${Math.max(0, remainingForBatch)} ${t('farmerDeliveryRequest.common.kg')}`} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Status Summary */}
            <Card className="border-orange-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  {t('farmerDeliveryRequest.detail.sections.statusSummary')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('farmerDeliveryRequest.detail.fields.requestedQuantity')}:</span>
                    <span className="font-medium">{data.requestedQuantity} {t('farmerDeliveryRequest.common.kg')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('farmerDeliveryRequest.detail.stats.processed')}:</span>
                    <span className="font-medium text-green-600">{totalProcessed} {t('farmerDeliveryRequest.common.kg')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('farmerDeliveryRequest.detail.stats.remaining')}:</span>
                    <span className="font-medium text-blue-600">{Math.max(0, remainingForThisRequest)} {t('farmerDeliveryRequest.common.kg')}</span>
                  </div>
                  <div className="pt-2 border-t border-orange-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{t('farmerDeliveryRequest.detail.fields.status')}:</span>
                      <Badge className={`capitalize ${getStatusStyle(data.status)}`}>
                        {getStatusLabel(data.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="border-orange-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-800">
                  {t('farmerDeliveryRequest.detail.sections.actions')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push('/dashboard/farmer/warehouse-request')}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('farmerDeliveryRequest.detail.actions.viewAllRequests')}
                  </Button>
                  {data.status === 'Pending' && (
                    <Button
                      variant="outline"
                      className="w-full justify-start text-orange-600 border-orange-200 hover:bg-orange-50"
                      onClick={() => router.push('/dashboard/farmer/warehouse-request/create')}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      {t('farmerDeliveryRequest.detail.actions.createNewRequest')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg">
      <div className="p-2 bg-orange-100 rounded-md text-orange-600">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <div className="font-semibold text-gray-800">{value}</div>
      </div>
    </div>
  );
}
