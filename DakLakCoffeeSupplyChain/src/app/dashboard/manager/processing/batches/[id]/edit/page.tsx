"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getProcessingBatchById, ProcessingBatch } from "@/lib/api/processingBatches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Save, 
  Loader, 
  AlertTriangle,
  Package,
  Coffee,
  Calendar,
  Settings
} from "lucide-react";
import { AppToast } from "@/components/ui/AppToast";

export default function EditProcessingBatchPage() {
  const router = useRouter();
  const params = useParams();
  const batchId = params.id as string;

  const [batch, setBatch] = useState<ProcessingBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    batchCode: "",
    cropSeasonId: "",
    methodId: "",
    notes: "",
    status: ""
  });

  // Fetch batch data
  useEffect(() => {
    const fetchBatch = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await getProcessingBatchById(batchId);
        if (data) {
          setBatch(data);
          setFormData({
            batchCode: data.batchCode || "",
            cropSeasonId: String(data.cropSeasonId || ""),
            methodId: String(data.methodId || ""),
            notes: (data as any).notes || "",
            status: String(data.status || "")
          });
        } else {
          setError("Không tìm thấy lô sơ chế");
        }
      } catch (err) {
        console.error("Error fetching batch:", err);
        setError("Không thể tải thông tin lô sơ chế");
      } finally {
        setLoading(false);
      }
    };

    if (batchId) {
      fetchBatch();
    }
  }, [batchId]);

  // Handle form changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // TODO: Implement update API call
      
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      AppToast.success("Cập nhật lô sơ chế thành công!");
      router.push(`/dashboard/manager/processing/batches/${batchId}`);
    } catch (err) {
      console.error("Error updating batch:", err);
      AppToast.error("Không thể cập nhật lô sơ chế");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600 font-medium">Đang tải dữ liệu...</p>
            <p className="text-sm text-gray-500">Đang tải thông tin lô sơ chế</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center space-y-4 py-8">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-gray-900">Không thể tải dữ liệu</h2>
                <p className="text-sm text-gray-600">{error || "Lô sơ chế không tồn tại"}</p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Button
                  onClick={() => router.push("/dashboard/manager/processing/batches")}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lại danh sách
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => router.push(`/dashboard/manager/processing/batches/${batchId}`)}
                className="bg-white/80 hover:bg-white border-orange-200 hover:border-orange-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Chỉnh sửa lô sơ chế</h1>
                <p className="text-gray-600 mt-1">Cập nhật thông tin lô sơ chế cà phê</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-6 h-6 text-orange-600" />
              <span className="text-sm font-medium text-gray-600">ID: {batchId.slice(-8)}</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Coffee className="w-5 h-5 text-orange-600" />
                Thông tin cơ bản
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batchCode">Mã lô sơ chế</Label>
                  <Input
                    id="batchCode"
                    value={formData.batchCode}
                    onChange={(e) => handleInputChange("batchCode", e.target.value)}
                    placeholder="Nhập mã lô sơ chế"
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>
                
              
              </div>

                                                                                                                       <div className="grid grid-cols-1 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="cropSeasonId">Mùa vụ</Label>
                     <Input
                       id="cropSeasonId"
                       value={batch.cropSeasonName || `ID: ${formData.cropSeasonId}`}
                       readOnly
                       className="border-orange-200 bg-gray-50 cursor-not-allowed"
                     />
                   </div>
                 </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-orange-600" />
                Ghi chú
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Ghi chú</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Nhập ghi chú về lô sơ chế..."
                  rows={4}
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>
            </div>

            {/* Current Information Display */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                Thông tin hiện tại
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ngày tạo</p>
                  <p className="text-sm text-gray-800">
                    {batch.createdAt ? new Date(batch.createdAt).toLocaleDateString("vi-VN") : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Ngày cập nhật</p>
                  <p className="text-sm text-gray-800">
                    {(batch as any).updatedAt ? new Date((batch as any).updatedAt).toLocaleDateString("vi-VN") : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Tổng sản lượng</p>
                  <p className="text-sm text-gray-800">
                    {batch.totalOutputQuantity ? `${batch.totalOutputQuantity} kg` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Trạng thái hiện tại</p>
                  <p className="text-sm text-gray-800">
                    {batch.status ? String(batch.status) : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/dashboard/manager/processing/batches/${batchId}`)}
                className="border-orange-200 hover:bg-orange-50"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Lưu thay đổi
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
