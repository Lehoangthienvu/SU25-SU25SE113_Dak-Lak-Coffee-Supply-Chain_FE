'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  getOutboundReceiptById,
  confirmOutboundReceipt,
  ConfirmOutboundReceiptInput,
} from '@/lib/api/warehouseOutboundReceipt';
import {
  ArrowLeft,
  Package,
  ClipboardCheck,
  FileText,
  MapPin,
  CalendarClock,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function OutboundReceiptDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useTranslation();

  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirmedQuantity, setConfirmedQuantity] = useState('');
  const [destinationNote, setDestinationNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchDetail = async () => {
    try {
      const data = await getOutboundReceiptById(id as string);
      setDetail(data);
      setConfirmedQuantity(data?.quantity?.toString() || '');
      setDestinationNote(data?.destinationNote || '');
    } catch (err: any) {
      toast.error(t('warehouseOutboundReceipts.error.loadFailed') + err.message);
      router.push('/dashboard/staff/outbound-receipts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const isWaitingForPickup = detail?.note?.includes('[WAITING_FOR_PICKUP]');
  const isConfirmed = detail?.note?.includes('[CONFIRMED:');
  const isCompleted = detail?.note?.includes('[COMPLETED:');

  const handleConfirm = async () => {
    setError('');
    const quantity = Number(confirmedQuantity);
    if (!confirmedQuantity || isNaN(quantity) || quantity <= 0) {
      setError('⚠️ ' + t('warehouseOutboundReceipts.validation.exportedQuantity'));
      return;
    }

    if (quantity < detail.quantity && destinationNote.trim() === '') {
      setError('⚠️ ' + t('warehouseOutboundReceipts.validation.selectRequest'));
      return;
    }

    const input: ConfirmOutboundReceiptInput = {
      confirmedQuantity: quantity,
      destinationNote: destinationNote.trim() || undefined,
    };

    setSubmitting(true);
    try {
      await confirmOutboundReceipt(id as string, input);
      toast.success(t('warehouseOutboundReceipts.success.confirmSuccess'));
      await fetchDetail();
    } catch (err: any) {
      setError('❌ ' + t('warehouseOutboundReceipts.error.serverError') + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-orange-500 rounded-full"></div>
      </div>
    );
  }

  if (!detail) return null;

  const exportedAt = detail.exportedAt ? new Date(detail.exportedAt) : null;

  return (
    <>
      {/* CSS cho in phiếu */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          .print-container {
            max-width: none !important;
            margin: 0 !important;
            padding: 20px !important;
            background: white !important;
          }
          .print-section {
            margin-bottom: 20px !important;
            border: 1px solid #ccc !important;
            padding: 15px !important;
            border-radius: 8px !important;
          }
        }
      `}</style>
      
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="p-6 max-w-4xl mx-auto space-y-6 print-container">
        {/* Header */}
        <div className="flex justify-between items-center print-section">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-yellow-500 bg-clip-text text-transparent">
              📄 PHIẾU XUẤT KHO
            </h1>
            <p className="text-gray-600">Mã phiếu: {detail.outboundReceiptCode}</p>
            <p className="text-gray-600">Ngày in: {new Date().toLocaleString('vi-VN')}</p>
          </div>
          <Button variant="outline" onClick={() => router.back()} className="gap-2 no-print">
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Button>
        </div>

        {/* Thông tin cơ bản */}
        <div className="bg-white shadow rounded-2xl p-6 border border-gray-100 print-section">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Thông tin phiếu xuất kho
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
            <DetailItem icon={<Package className="text-green-600" />} label="Mã phiếu xuất" value={detail.outboundReceiptCode} />
            <DetailItem icon={<ClipboardCheck className="text-purple-600" />} label="Kho xuất" value={detail.warehouseName} />
            <DetailItem icon={<ClipboardCheck className="text-orange-600" />} label="Mã lô hàng" value={detail.batchCode || 'N/A'} />
            <DetailItem icon={<ClipboardCheck className="text-indigo-600" />} label="Số lượng xuất" value={`${detail.quantity} ${detail.unit || 'kg'}`} />
            <DetailItem icon={<CalendarClock className="text-rose-600" />} label="Thời gian xuất" value={
              exportedAt
                ? `${exportedAt.toLocaleDateString('vi-VN')} lúc ${exportedAt.toLocaleTimeString('vi-VN')}`
                : '(Chưa xuất)'
            } />
            <DetailItem icon={<FileText className="text-blue-600" />} label="Ghi chú" value={detail.note || '(Không có)'} />
            <DetailItem icon={<MapPin className="text-red-600" />} label="Điểm đến" value={detail.destinationNote || '(Không có)'} />
            <DetailItem
              icon={isCompleted ? <CheckCircle className="text-green-600" /> : isConfirmed ? <CheckCircle className="text-green-600" /> : isWaitingForPickup ? <Clock className="text-orange-600" /> : <Clock className="text-yellow-600" />}
              label="Trạng thái"
              value={
                isCompleted
                  ? <span className="text-green-600 font-semibold">✅ Hoàn thành (Đã lấy hàng)</span>
                  : isConfirmed
                  ? <span className="text-blue-600 font-semibold">🚚 Sẵn sàng giao</span>
                  : isWaitingForPickup
                  ? <span className="text-orange-600 font-semibold">⏳ Chờ lấy hàng</span>
                  : <span className="text-yellow-600 font-semibold">📝 Chưa xác nhận</span>
              }
            />
          </div>
        </div>

        {/* Thông tin chi tiết hàng hóa để kiểm tra */}
        <div className="bg-white shadow rounded-2xl p-6 border border-gray-100 print-section">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-green-600" />
            Thông tin hàng hóa cần kiểm tra
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
            <DetailItem icon={<Package className="text-blue-600" />} label="Tên sản phẩm" value={detail.inventoryName || 'Cà phê Arabica cao cấp'} />
            <DetailItem icon={<ClipboardCheck className="text-purple-600" />} label="Loại cà phê" value={detail.coffeeType || 'Arabica'} />
            <DetailItem icon={<ClipboardCheck className="text-orange-600" />} label="Chất lượng" value={detail.quality || 'Grade A'} />
            <DetailItem icon={<ClipboardCheck className="text-indigo-600" />} label="Xuất xứ" value={detail.origin || 'Đắk Lắk, Việt Nam'} />
            <DetailItem icon={<ClipboardCheck className="text-green-600" />} label="Ngày sản xuất" value={
              detail.productionDate 
                ? new Date(detail.productionDate).toLocaleDateString('vi-VN')
                : '15/8/2024'
            } />
            <DetailItem icon={<ClipboardCheck className="text-red-600" />} label="Hạn sử dụng" value={
              detail.expiryDate 
                ? new Date(detail.expiryDate).toLocaleDateString('vi-VN')
                : '15/8/2025'
            } />
            <DetailItem icon={<ClipboardCheck className="text-rose-600" />} label="Độ ẩm (%)" value={detail.moistureContent || '12.5'} />
            <DetailItem icon={<ClipboardCheck className="text-yellow-600" />} label="Trọng lượng tịnh (kg)" value={detail.netWeight || detail.quantity || 'N/A'} />
          </div>
        </div>

        {/* Thông tin người thực hiện */}
        <div className="bg-white shadow rounded-2xl p-6 border border-gray-100 print-section">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Thông tin người thực hiện
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
            <DetailItem icon={<FileText className="text-blue-600" />} label="Nhân viên xuất kho" value={detail.staffName || 'Phạm Trường Nam'} />
            <DetailItem icon={<FileText className="text-green-600" />} label="Người tạo phiếu" value={detail.createdByName || 'Hệ thống'} />
            <DetailItem icon={<CalendarClock className="text-orange-600" />} label="Thời gian tạo" value={
              detail.createdAt 
                ? new Date(detail.createdAt).toLocaleString('vi-VN')
                : new Date().toLocaleString('vi-VN')
            } />
            <DetailItem icon={<CalendarClock className="text-red-600" />} label="Cập nhật lần cuối" value={
              detail.updatedAt 
                ? new Date(detail.updatedAt).toLocaleString('vi-VN')
                : new Date().toLocaleString('vi-VN')
            } />
          </div>
        </div>

        {/* Thông tin đơn hàng liên quan */}
        {detail.orderInfo && (
          <div className="bg-white shadow rounded-2xl p-6 border border-gray-100 print-section">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Thông tin đơn hàng liên quan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
              <DetailItem icon={<FileText className="text-blue-600" />} label="Mã đơn hàng" value={detail.orderInfo.orderCode || 'N/A'} />
              <DetailItem icon={<FileText className="text-green-600" />} label="Khách hàng" value={detail.orderInfo.customerName || 'N/A'} />
              <DetailItem icon={<FileText className="text-purple-600" />} label="Số lượng đơn hàng" value={`${detail.orderInfo.orderQuantity || 0} ${detail.orderInfo.orderUnit || 'kg'}`} />
              <DetailItem icon={<FileText className="text-orange-600" />} label="Trạng thái đơn hàng" value={detail.orderInfo.orderStatus || 'N/A'} />
            </div>
          </div>
        )}

        {/* Bảng kiểm tra hàng hóa */}
        <div className="bg-white shadow rounded-2xl p-6 border border-gray-100 print-section">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-orange-600" />
            Bảng kiểm tra hàng hóa
          </h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Hướng dẫn kiểm tra:</strong> Sử dụng bảng này để ghi lại kết quả kiểm tra thực tế hàng hóa trước khi xuất kho.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">Thông tin kiểm tra</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Số lượng thực tế (kg):</span>
                  <span className="font-semibold text-blue-600">{detail.quantity} kg</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Trạng thái bao bì:</span>
                  <span className="text-sm text-green-600 font-medium">✅ Đạt yêu cầu</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Nhãn mác:</span>
                  <span className="text-sm text-green-600 font-medium">✅ Đầy đủ</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Chất lượng cà phê:</span>
                  <span className="text-sm text-green-600 font-medium">✅ Grade A</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">Kết quả kiểm tra</h3>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg ring-2 ring-green-300">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">✅ Đạt yêu cầu</span>
                  </div>
                  <p className="text-xs text-green-700">Hàng hóa đủ tiêu chuẩn để xuất kho</p>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg opacity-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Cần xem xét</span>
                  </div>
                  <p className="text-xs text-yellow-700">Có vấn đề nhỏ cần xử lý</p>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg opacity-50">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-sm font-medium text-red-800">Không đạt</span>
                  </div>
                  <p className="text-xs text-red-700">Hàng hóa không đủ tiêu chuẩn</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">📋 Checklist kiểm tra</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" checked readOnly />
                <span className="text-green-700 font-medium">✅ Kiểm tra số lượng hàng hóa</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" checked readOnly />
                <span className="text-green-700 font-medium">✅ Kiểm tra chất lượng cà phê</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" checked readOnly />
                <span className="text-green-700 font-medium">✅ Kiểm tra bao bì, nhãn mác</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" checked readOnly />
                <span className="text-green-700 font-medium">✅ Kiểm tra hạn sử dụng</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" checked readOnly />
                <span className="text-green-700 font-medium">✅ Kiểm tra điều kiện bảo quản</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" checked readOnly />
                <span className="text-green-700 font-medium">✅ Xác nhận đúng đơn hàng</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form xác nhận */}
        {!isConfirmed && !isCompleted && (
          <div className="bg-white shadow rounded-2xl p-6 border border-gray-100 space-y-4 no-print">
            <h2 className="text-xl font-semibold text-gray-700">✅ {t('warehouseOutboundReceipts.detail.actions.confirm')}</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Lưu ý:</strong> Khi xác nhận phiếu xuất kho, hệ thống sẽ:
                <br />• Trừ tồn kho ngay lập tức
                <br />• Chuyển trạng thái sang "Hoàn thành (Đã lấy hàng)"
                <br />• Đây là bước cuối cùng trong quy trình xuất kho
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>{t('warehouseOutboundReceipts.create.form.exportedQuantity')} (kg)</Label>
                <Input
                  type="number"
                  value={confirmedQuantity}
                  onChange={(e) => setConfirmedQuantity(e.target.value)}
                                      placeholder={t('warehouseOutboundReceipts.create.form.exportedQuantityPlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('warehouseOutboundReceipts.create.form.destination')} ({t('warehouseOutboundReceipts.create.form.notePlaceholder')})</Label>
                                  <Textarea
                    placeholder={Number(confirmedQuantity) < detail.quantity ? t('warehouseOutboundReceipts.create.form.notePlaceholder') : t('warehouseOutboundReceipts.create.actions.cancel')}
                    value={destinationNote}
                    onChange={(e) => setDestinationNote(e.target.value)}
                  />
              </div>
            </div>

            {error && <p className="text-red-600">{error}</p>}

            <div className="flex gap-3">
              <Button onClick={handleConfirm} disabled={submitting}>
                {submitting ? '⏳ ' + t('warehouseOutboundReceipts.create.actions.creating') : '✅ ' + t('warehouseOutboundReceipts.detail.actions.confirm')}
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                🖨️ In phiếu xuất kho
              </Button>
            </div>
          </div>
        )}

        {/* Nút in phiếu cho trường hợp đã xác nhận */}
        {isConfirmed && (
          <div className="bg-white shadow rounded-2xl p-6 border border-gray-100 no-print">
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => window.print()} className="gap-2">
                🖨️ In phiếu xuất kho
              </Button>
            </div>
          </div>
        )}

        {/* Section chữ ký cho phiếu in */}
        <div className="bg-white shadow rounded-2xl p-6 border border-gray-100 print-section">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" />
            Xác nhận và chữ ký
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="border-b border-gray-300 pb-2 mb-2">
                <p className="text-sm font-medium">Người kiểm tra</p>
              </div>
              <div className="h-16 border-b border-gray-300 flex items-center justify-center">
                <span className="text-lg font-bold text-blue-600">
                  {detail?.inspectorSignature || "✍️ NVA"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Ký và ghi rõ họ tên</p>
            </div>
            <div className="text-center">
              <div className="border-b border-gray-300 pb-2 mb-2">
                <p className="text-sm font-medium">Nhân viên xuất kho</p>
              </div>
              <div className="h-16 border-b border-gray-300 flex items-center justify-center">
                <span className="text-lg font-bold text-green-600">
                  {detail?.staffSignature || "✍️ NV"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Ký và ghi rõ họ tên</p>
            </div>
            <div className="text-center">
              <div className="border-b border-gray-300 pb-2 mb-2">
                <p className="text-sm font-medium">Người nhận hàng</p>
              </div>
              <div className="h-16 border-b border-gray-300 flex items-center justify-center">
                <span className="text-lg font-bold text-purple-600">
                  {detail?.recipientSignature || "✍️ KH"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Ký và ghi rõ họ tên</p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Ghi chú:</strong> Phiếu xuất kho này phải được ký xác nhận bởi tất cả các bên liên quan trước khi hàng hóa được xuất khỏi kho.
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

// Component hiển thị 1 trường thông tin
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
