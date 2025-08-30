'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getOutboundRequestById, acceptOutboundRequest } from '@/lib/api/warehouseOutboundRequest';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Package,
  Warehouse,
  ListOrdered,
  User,
  FileText,
  CalendarClock,
  ClipboardCheck,
  StickyNote,
} from 'lucide-react';

export default function ViewOutboundRequestDetailStaff() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { openDialog, ConfirmationDialog } = useConfirmationDialog();
  const { t } = useTranslation();

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    getOutboundRequestById(id)
      .then((res) => {
        if (res?.data) setData(res.data);
        else throw new Error(res?.message || t('outboundRequestDetail.error.loadFailed'));
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAccept = async () => {
    if (!data) return;

    openDialog({
      title: t('warehouseOutboundRequests.confirmModal.title'),
      message: t('warehouseOutboundRequests.confirmModal.description'),
      confirmText: t('warehouseOutboundRequests.confirmModal.acceptButton'),
      cancelText: t('warehouseOutboundRequests.confirmModal.cancelButton'),
      type: "info",
      onConfirm: async () => {
        try {
          const result = await acceptOutboundRequest(data.outboundRequestId);
          toast.success(t('warehouseOutboundRequests.success.acceptSuccess'));
          router.push('/dashboard/staff/outbounds');
        } catch (err: any) {
          toast.error(err.message);
        }
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge className="bg-gray-200 text-gray-800">⏳ {t('warehouseOutboundRequests.detail.status.pending')}</Badge>;
      case 'Accepted':
        return <Badge className="bg-blue-100 text-blue-800">✅ {t('warehouseOutboundRequests.detail.status.accepted')}</Badge>;
      case 'Completed':
        return <Badge className="bg-green-100 text-green-800">✔️ {t('outboundRequestDetail.status.completed')}</Badge>;
      case 'Cancelled':
        return <Badge className="bg-red-100 text-red-800">❌ {t('warehouseOutboundRequests.detail.status.cancelled')}</Badge>;
      case 'Rejected':
        return <Badge className="bg-red-100 text-red-800">❌ {t('warehouseOutboundRequests.detail.status.rejected')}</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? t('outboundRequestDetail.common.unknown') : d.toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-green-600 rounded-full"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-6 text-red-500">{t('outboundRequestDetail.error.notFound')}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              📦 {t('outboundRequestDetail.title')}
            </h1>
            <p className="text-gray-600">{t('outboundRequestDetail.subtitle')}</p>
          </div>
          <Button variant="outline" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t('outboundRequestDetail.actions.back')}
          </Button>
        </div>

        {/* Detail card */}
        <div className="bg-white shadow rounded-2xl p-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
            <DetailItem icon={<Package className="text-green-600" />} label={t('outboundRequestDetail.fields.requestCode')} value={data.outboundRequestCode} />
            <DetailItem icon={<Warehouse className="text-blue-600" />} label={t('outboundRequestDetail.fields.warehouse')} value={data.warehouseName || t('outboundRequestDetail.common.unknown')} />

            <DetailItem icon={<ListOrdered className="text-purple-600" />} label={t('outboundRequestDetail.fields.inventory')} value={data.inventoryName || t('outboundRequestDetail.common.unknown')} />
            <DetailItem icon={<ClipboardCheck className="text-orange-600" />} label={t('outboundRequestDetail.fields.quantity')} value={`${data.requestedQuantity} ${data.unit}`} />

            <DetailItem icon={<FileText className="text-rose-600" />} label={t('outboundRequestDetail.fields.purpose')} value={data.purpose || t('outboundRequestDetail.common.noData')} />
            <DetailItem icon={<StickyNote className="text-red-600" />} label={t('outboundRequestDetail.fields.reason')} value={data.reason || t('outboundRequestDetail.common.noData')} />

            <DetailItem icon={<User className="text-indigo-600" />} label={t('outboundRequestDetail.fields.requestedBy')} value={data.requestedByName || t('outboundRequestDetail.common.unknown')} />
            <DetailItem icon={<CalendarClock className="text-gray-600" />} label={t('outboundRequestDetail.fields.createdAt')} value={formatDate(data.createdAt)} />

            <DetailItem icon={<CalendarClock className="text-gray-600" />} label={t('outboundRequestDetail.fields.updatedAt')} value={formatDate(data.updatedAt)} />
            <DetailItem icon={<Package className="text-green-600" />} label={t('outboundRequestDetail.fields.status')} value={getStatusBadge(data.status)} />

            {data.orderItemId && (
              <div className="md:col-span-2">
                <strong>{t('outboundRequestDetail.fields.orderLink')}:</strong> {data.orderItemId}
                {data.orderItemProductName && (
                  <span className="ml-2 text-gray-600">
                    ({data.orderItemProductName} - {data.orderItemQuantity} {data.orderItemUnit})
                  </span>
                )}
              </div>
            )}

            {data.note && (
              <div className="md:col-span-2">
                <strong>{t('outboundRequestDetail.fields.note')}:</strong> {data.note}
              </div>
            )}
          </div>

          {/* Action */}
          <div className="pt-6 flex gap-4">

            {data.status === 'Pending' && (
              <Button className="bg-green-600 text-white" onClick={handleAccept}>
                {t('outboundRequestDetail.actions.approve')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog />
    </div>
  );
}

// Component hiển thị 1 field với icon
function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg">
      <div className="p-2 bg-gray-100 rounded-md">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <div className="font-semibold text-gray-800">{value}</div>
      </div>
    </div>
  );
}
