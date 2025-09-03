'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getOutboundRequestById, cancelOutboundRequest } from '@/lib/api/warehouseOutboundRequest';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

export default function ViewOutboundRequestDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    getOutboundRequestById(id)
      .then((res) => {
        if (res?.status === 1 && res?.data) {
          setData(res.data);
        } else {
          alert(res?.message || t('managerWarehouseRequest.error.loadDetail'));
        }
      })
      .catch((err) => alert(t('managerWarehouseRequest.error.loadData') + ': ' + err.message))
      .finally(() => setLoading(false));
  }, [id, t]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
      case '0':
        return <Badge variant="secondary">{t('managerWarehouseRequest.status.pending')}</Badge>;
      case 'Accepted':
      case '1':
        return <Badge className="bg-green-100 text-green-800">{t('managerWarehouseRequest.status.accepted')}</Badge>;
      case 'Completed':
        return <Badge className="bg-blue-100 text-blue-800">{t('managerWarehouseRequest.status.completed')}</Badge>;
      case 'Rejected':
      case '2':
        return <Badge className="bg-red-100 text-red-800">{t('managerWarehouseRequest.status.rejected')}</Badge>;
      case 'Cancelled':
      case '3':
        return <Badge className="bg-gray-100 text-gray-700">{t('managerWarehouseRequest.status.cancelled')}</Badge>;
      default:
        return <Badge variant="outline">{status || t('managerWarehouseRequest.status.unknown')}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return t('managerWarehouseRequest.common.noData');
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? t('managerWarehouseRequest.common.noData')
      : d.toLocaleString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
  };

  const handleCancel = async () => {
    if (!data) return;
    const confirm = window.confirm(t('managerWarehouseRequest.confirmation.cancelMessage'));
    if (!confirm) return;

    try {
      const result = await cancelOutboundRequest(data.outboundRequestId);
      alert('✅ ' + result.message);
      router.push('/dashboard/manager/warehouse-request');
    } catch (err: any) {
      alert('❌ ' + err.message);
    }
  };

  if (loading) return <p className="p-6">{t('managerWarehouseRequest.loading.loadingDetail')}</p>;
  if (!data) return <p className="p-6 text-red-500">{t('managerWarehouseRequest.common.notFound')}</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t('managerWarehouseRequest.detail.title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div><strong>{t('managerWarehouseRequest.fields.requestCode')}:</strong> {data.outboundRequestCode || t('managerWarehouseRequest.common.unknown')}</div>
        <div><strong>{t('managerWarehouseRequest.fields.warehouse')}:</strong> {data.warehouseName || t('managerWarehouseRequest.common.unknown')}</div>

        <div><strong>{t('managerWarehouseRequest.fields.inventory')}:</strong> {data.inventoryName || t('managerWarehouseRequest.common.unknown')}</div>
        <div><strong>{t('managerWarehouseRequest.fields.quantity')}:</strong> {data.requestedQuantity} {data.unit}</div>

        <div><strong>{t('managerWarehouseRequest.fields.purpose')}:</strong> {data.purpose || t('managerWarehouseRequest.common.noData')}</div>
        <div><strong>{t('managerWarehouseRequest.fields.reason')}:</strong> {data.reason || t('managerWarehouseRequest.common.noData')}</div>

        <div>
          <strong>{t('managerWarehouseRequest.fields.order')}:</strong>{' '}
          {data.orderItemId
            ? <code className="text-gray-600">{data.orderItemId.slice(0, 8)}...</code>
            : t('managerWarehouseRequest.common.noData')}
        </div>

        <div><strong>{t('managerWarehouseRequest.fields.requester')}:</strong> {data.requestedByName || t('managerWarehouseRequest.common.unknown')}</div>
        <div><strong>{t('managerWarehouseRequest.fields.status')}:</strong> {getStatusBadge(data.status)}</div>

        <div><strong>{t('managerWarehouseRequest.fields.createdAt')}:</strong> {formatDate(data.createdAt)}</div>
        <div><strong>{t('managerWarehouseRequest.fields.updatedAt')}:</strong> {formatDate(data.updatedAt)}</div>

        {data.status === 'Rejected' && (
          <div className="md:col-span-2 text-red-600">
            <strong>{t('managerWarehouseRequest.fields.rejectionReason')}:</strong> {data.reason || t('managerWarehouseRequest.common.noData')}
          </div>
        )}
      </div>

      <div className="pt-6 flex gap-4">
        <Button variant="outline" onClick={() => router.push('/dashboard/manager/warehouse-request')}>
          {t('managerWarehouseRequest.detail.backToList')}
        </Button>

        {data.status === 'Pending' && (
          <Button variant="destructive" onClick={handleCancel}>
            {t('managerWarehouseRequest.actions.cancelRequest')}
          </Button>
        )}
      </div>
    </div>
  );
}
