'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from 'react-i18next';
import {
  getInboundRequestById,
  approveInboundRequest,
  rejectInboundRequest,
} from "@/lib/api/warehouseInboundRequest";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Package,
  CalendarClock,
  ClipboardCheck,
  User,
  Phone,
  FileText,
  CheckCircle,
  XCircle,
  Coffee,
  Layers,
  Leaf
} from "lucide-react";

export default function InboundRequestDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchDetail() {
      const res = await getInboundRequestById(id as string);
      if (res.status === 1) {
        setRequest(res.data);
      } else {
        toast.error(t('inboundRequestDetail.error.description') + ": " + res.message);
        router.push("/dashboard/staff/inbounds");
      }
    }
    fetchDetail();
  }, [id, router]);

  const handleApprove = async () => {
    setLoading(true);
    try {
      const res = await approveInboundRequest(id as string);
      
      // ✅ CẢI THIỆN: Kiểm tra response status và hiển thị lỗi chi tiết
      if (res.status === 1 || res.status === 'Success' || res.status === 'success') {
        toast.success(res.message || t('inboundRequestDetail.actions.approveSuccess'));
        router.push("/dashboard/staff/inbounds");
      } else {
        // Hiển thị lỗi chi tiết từ backend
        const errorMessage = res.message || t('inboundRequestDetail.actions.approveError');
        toast.error(`❌ Lỗi: ${errorMessage}`);
        
        // Log chi tiết để debug
        console.error('❌ Approve request error details:', {
          status: res.status,
          message: res.message,
          data: res.data,
          fullResponse: res
        });
      }
    } catch (error: any) {
      // ✅ CẢI THIỆN: Xử lý lỗi chi tiết từ backend
      let errorMessage = t('inboundRequestDetail.actions.approveError');
      
      if (error.response?.data) {
        // Lỗi từ backend có response data
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.errors) {
          // Validation errors
          const validationErrors = Object.values(error.response.data.errors).flat();
          errorMessage = validationErrors.join(', ');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(`❌ Lỗi: ${errorMessage}`);
      
      // Log chi tiết để debug
      console.error('❌ Approve request error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        fullError: error
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      const res = await rejectInboundRequest(id as string);
      
      // ✅ CẢI THIỆN: Kiểm tra response status và hiển thị lỗi chi tiết
      if (res.status === 1 || res.status === 'Success' || res.status === 'success') {
        toast.success(res.message || t('inboundRequestDetail.actions.rejectSuccess'));
        router.push("/dashboard/staff/inbounds");
      } else {
        // Hiển thị lỗi chi tiết từ backend
        const errorMessage = res.message || t('inboundRequestDetail.actions.rejectError');
        toast.error(`❌ Lỗi: ${errorMessage}`);
        
        // Log chi tiết để debug
        console.error('❌ Reject request error details:', {
          status: res.status,
          message: res.message,
          data: res.data,
          fullResponse: res
        });
      }
    } catch (error: any) {
      // ✅ CẢI THIỆN: Xử lý lỗi chi tiết từ backend
      let errorMessage = t('inboundRequestDetail.actions.rejectError');
      
      if (error.response?.data) {
        // Lỗi từ backend có response data
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.errors) {
          // Validation errors
          const validationErrors = Object.values(error.response.data.errors).flat();
          errorMessage = validationErrors.join(', ');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(`❌ Lỗi: ${errorMessage}`);
      
      // Log chi tiết để debug
      console.error('❌ Reject request error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        fullError: error
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value: string | Date) => {
    const d = new Date(value);
    return isNaN(d.getTime()) ? t('inboundRequestDetail.common.unknown') : d.toLocaleString("vi-VN");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge className="bg-gray-200 text-gray-800">⏳ {t('inboundRequestDetail.status.pending')}</Badge>;
      case "Approved":
        return <Badge className="bg-blue-100 text-blue-800">📝 {t('inboundRequestDetail.status.approved')}</Badge>;
      case "Completed":
        return <Badge className="bg-green-100 text-green-800">✅ {t('inboundRequestDetail.status.completed')}</Badge>;
      case "Rejected":
        return <Badge className="bg-red-100 text-red-800">❌ {t('inboundRequestDetail.status.rejected')}</Badge>;
      case "Cancelled":
        return <Badge className="bg-yellow-100 text-yellow-800">🚫 {t('inboundRequestDetail.status.cancelled')}</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">{status}</Badge>;
    }
  };

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-green-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-lime-50">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-lime-500 bg-clip-text text-transparent">
              📥 {t('inboundRequestDetail.title')}
            </h1>
            <p className="text-gray-600">{t('inboundRequestDetail.requestCode')}: {request.requestCode}</p>
          </div>
          <Button variant="outline" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t('inboundRequestDetail.actions.back')}
          </Button>
        </div>

        {/* Detail section */}
        <div className="bg-white shadow rounded-2xl p-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
            <DetailItem icon={<ClipboardCheck className="text-green-600" />} label={t('inboundRequestDetail.fields.status')} value={getStatusBadge(request.status)} />
            <DetailItem icon={<CalendarClock className="text-rose-600" />} label={t('inboundRequestDetail.fields.createdAt')} value={formatDate(request.createdAt)} />
            <DetailItem icon={<CalendarClock className="text-blue-600" />} label={t('inboundRequestDetail.fields.preferredDeliveryDate')} value={formatDate(request.preferredDeliveryDate)} />
            {request.actualDeliveryDate && (
              <DetailItem icon={<CalendarClock className="text-purple-600" />} label={t('inboundRequestDetail.fields.actualDeliveryDate')} value={formatDate(request.actualDeliveryDate)} />
            )}
            <DetailItem icon={<Package className="text-orange-600" />} label={t('inboundRequestDetail.fields.quantity')} value={`${request.requestedQuantity} kg`} />
            <DetailItem icon={<FileText className="text-gray-600" />} label={t('inboundRequestDetail.fields.note')} value={request.note || t('inboundRequestDetail.common.noNote')} />
            <DetailItem icon={<User className="text-indigo-600" />} label={t('inboundRequestDetail.fields.farmer')} value={request.farmerName} />
            <DetailItem icon={<Phone className="text-gray-500" />} label={t('inboundRequestDetail.fields.phone')} value={request.farmerPhone} />
            {request.businessStaffName && (
              <DetailItem icon={<User className="text-green-500" />} label={t('inboundRequestDetail.fields.businessStaff')} value={request.businessStaffName} />
            )}
            {(request.batchCode || request.detailCode) && (
              <DetailItem 
                icon={<Layers className="text-orange-500" />} 
                label={request.batchCode ? t('inboundRequestDetail.fields.batchCode') : t('inboundRequestDetail.fields.detailCode')} 
                value={request.batchCode || request.detailCode || "N/A"} 
              />
            )}
            {(request.coffeeType || request.coffeeTypeDetail) && (
              <DetailItem 
                icon={<Coffee className="text-brown-600" />} 
                label={t('inboundRequestDetail.fields.coffeeType')} 
                value={request.coffeeType || request.coffeeTypeDetail || "N/A"} 
              />
            )}
            {(request.seasonCode || request.cropSeasonName) && (
              <DetailItem 
                icon={<Leaf className="text-lime-500" />} 
                label={t('inboundRequestDetail.fields.cropSeason')} 
                value={request.cropSeasonName || request.seasonCode || "N/A"} 
              />
            )}
          </div>

          {/* Action buttons */}
          {request.status === "Pending" && (
            <div className="pt-6 flex flex-wrap gap-4">
              <Button
                onClick={handleApprove}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                ✅ {t('inboundRequestDetail.actions.approve')}
              </Button>
              <Button
                onClick={handleReject}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                ❌ {t('inboundRequestDetail.actions.reject')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Reusable detail component
function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
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
