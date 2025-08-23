'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getOutboundRequestById, acceptOutboundRequest } from '@/lib/api/warehouseOutboundRequest';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog';
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

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    getOutboundRequestById(id)
      .then((res) => {
        if (res?.data) setData(res.data);
        else throw new Error(res?.message || 'Không lấy được dữ liệu');
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAccept = async () => {
    if (!data) return;

    openDialog({
      title: "Xác nhận duyệt yêu cầu",
      message: "Bạn chắc chắn muốn duyệt yêu cầu này?",
      confirmText: "Duyệt",
      cancelText: "Hủy",
      type: "info",
      onConfirm: async () => {
        try {
          const result = await acceptOutboundRequest(data.outboundRequestId);
          toast.success(result.message);
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
        return <Badge className="bg-gray-200 text-gray-800">⏳ Đang chờ duyệt</Badge>;
      case 'Accepted':
        return <Badge className="bg-blue-100 text-blue-800">✅ Đã duyệt</Badge>;
      case 'Completed':
        return <Badge className="bg-green-100 text-green-800">✔️ Đã hoàn tất</Badge>;
      case 'Cancelled':
        return <Badge className="bg-red-100 text-red-800">❌ Đã huỷ</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? 'Không xác định' : d.toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-green-600 rounded-full"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-6 text-red-500">Không tìm thấy yêu cầu.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              📦 Chi tiết yêu cầu xuất kho
            </h1>
            <p className="text-gray-600">Xem thông tin chi tiết về yêu cầu</p>
          </div>
          <Button variant="outline" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Button>
        </div>

        {/* Detail card */}
        <div className="bg-white shadow rounded-2xl p-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
            <DetailItem icon={<Package className="text-green-600" />} label="Mã yêu cầu" value={data.outboundRequestCode} />
            <DetailItem icon={<Warehouse className="text-blue-600" />} label="Kho" value={data.warehouseName || "Không rõ"} />

            <DetailItem icon={<ListOrdered className="text-purple-600" />} label="Hàng tồn kho" value={data.inventoryName || "Không rõ"} />
            <DetailItem icon={<ClipboardCheck className="text-orange-600" />} label="Số lượng" value={`${data.requestedQuantity} ${data.unit}`} />

            <DetailItem icon={<FileText className="text-rose-600" />} label="Mục đích xuất kho" value={data.purpose || "Không có"} />
            <DetailItem icon={<StickyNote className="text-red-600" />} label="Lý do" value={data.reason || "Không có"} />

            <DetailItem icon={<User className="text-indigo-600" />} label="Người yêu cầu" value={data.requestedByName || "Không xác định"} />
            <DetailItem icon={<CalendarClock className="text-gray-600" />} label="Ngày tạo" value={formatDate(data.createdAt)} />

            <DetailItem icon={<CalendarClock className="text-gray-600" />} label="Cập nhật lần cuối" value={formatDate(data.updatedAt)} />
            <DetailItem icon={<Package className="text-green-600" />} label="Trạng thái" value={getStatusBadge(data.status)} />

            {data.orderItemId && (
              <div className="md:col-span-2">
                <strong>Liên kết đơn hàng:</strong> {data.orderItemId}
                {data.orderItemProductName && (
                  <span className="ml-2 text-gray-600">
                    ({data.orderItemProductName} - {data.orderItemQuantity} {data.orderItemUnit})
                  </span>
                )}
              </div>
            )}

            {data.note && (
              <div className="md:col-span-2">
                <strong>Ghi chú:</strong> {data.note}
              </div>
            )}
          </div>

          {/* Action */}
          <div className="pt-6 flex gap-4">

            {data.status === 'Pending' && (
              <Button className="bg-green-600 text-white" onClick={handleAccept}>
                Duyệt yêu cầu
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
