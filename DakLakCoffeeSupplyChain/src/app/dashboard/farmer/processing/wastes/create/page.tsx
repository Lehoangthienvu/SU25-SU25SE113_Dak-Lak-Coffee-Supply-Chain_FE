"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppToast } from "@/components/ui/AppToast";
import { Textarea } from "@/components/ui/textarea";
import {
  createProcessingWaste,
} from "@/lib/api/processingWastes";
import {
  getProcessingBatchesByFarmer,
  ProcessingBatch,
} from "@/lib/api/processingBatches";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Trash2, Package, Calendar, Info, Loader2, CheckCircle, FileText } from "lucide-react";

// Import các component chung
import ProcessingHeader from "@/components/processing/ProcessingHeader";

export default function CreateProcessingWastePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    batchId: "",
    wasteType: "",
    quantity: 0,
    unit: "kg",
    disposalMethod: "",
    disposalDate: "",
    description: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [batches, setBatches] = useState<ProcessingBatch[]>([]);

      // Load danh sách lô sơ chế
  useEffect(() => {
    async function fetchBatches() {
      try {
        setLoading(true);
        // Lấy farmer ID từ token
        const token = localStorage.getItem("access_token");
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const farmerId = payload?.userId || payload?.UserId || payload?.sub;
          if (farmerId) {
            const batchesData = await getProcessingBatchesByFarmer(farmerId);
    
            setBatches(batchesData);
          }
        }
      } catch (err) {
        console.error("Lỗi tải danh sách lô:", err);
        AppToast.error("Không thể tải danh sách lô sơ chế");
      } finally {
        setLoading(false);
      }
    }

    fetchBatches();
  }, []);

  const handleChange = (name: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const { batchId, wasteType, quantity, unit, disposalMethod, disposalDate, description } = form;

    const missingFields: string[] = [];
    if (!batchId) missingFields.push("Lô sơ chế");
    if (!wasteType.trim()) missingFields.push("Loại chất thải");
    if (quantity <= 0) missingFields.push("Số lượng");
    if (!disposalMethod.trim()) missingFields.push("Phương pháp xử lý");
    if (!disposalDate) missingFields.push("Ngày xử lý");
    if (!description.trim()) missingFields.push("Mô tả");

    if (missingFields.length > 0) {
      AppToast.error("Vui lòng nhập: " + missingFields.join(", "));
      setIsSubmitting(false);
      return;
    }

    try {
      await createProcessingWaste({
        batchId,
        wasteType: wasteType.trim(),
        quantity,
        unit,
        disposalMethod: disposalMethod.trim(),
        disposalDate,
        description: description.trim(),
      });

      AppToast.success("Thêm xử lý chất thải thành công!");
      router.push("/dashboard/farmer/processing/wastes");
    } catch (err: any) {
              console.error("Lỗi tạo waste:", err);
      
      let errorMessage = "Thêm xử lý chất thải thất bại!";
      
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err?.response?.status === 400) {
        errorMessage = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.";
      } else if (err?.response?.status === 404) {
        errorMessage = "Không tìm thấy lô sơ chế. Vui lòng thử lại.";
      } else if (err?.response?.status === 409) {
        errorMessage = "Xử lý chất thải đã tồn tại hoặc thông tin bị trùng lặp.";
      } else if (err?.response?.status >= 500) {
        errorMessage = "Lỗi hệ thống. Vui lòng thử lại sau.";
      }
      
      AppToast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
        <div className="p-6 max-w-4xl mx-auto">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4 mb-8">
            <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded-lg w-64 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
          </div>

          {/* Form Skeleton */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6">
              <div className="h-6 bg-white/20 rounded w-48 animate-pulse"></div>
            </div>
            <div className="p-6 space-y-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Loading Indicator */}
          <div className="text-center space-y-4 mt-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="text-lg text-gray-600 font-medium">Đang tải dữ liệu...</p>
            <p className="text-sm text-gray-500">Đang tải danh sách lô sơ chế</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <ProcessingHeader
          title="Thêm xử lý chất thải"
          description="Ghi nhận chất thải từ quá trình sơ chế cà phê"
          showCreateButton={false}
        />
        
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="flex items-center gap-2 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Button>
        </div>

        {/* Info Card */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Info className="w-5 h-5 text-orange-600" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-orange-900">Hướng dẫn thêm xử lý chất thải</h3>
              <p className="text-sm text-orange-700">
                Chọn lô sơ chế và nhập thông tin chất thải. 
                Ghi rõ loại chất thải, số lượng và phương pháp xử lý.
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-orange-200 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Thông tin chất thải
            </h2>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Lô sơ chế */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <Package className="w-4 h-4 text-green-600" />
                Lô sơ chế *
              </label>
              <Select
                value={form.batchId}
                onValueChange={(v) => handleChange("batchId", v)}
              >
                <SelectTrigger className="w-full h-12 border-gray-200 hover:border-orange-300 focus:border-orange-500 transition-colors">
                  <SelectValue placeholder="Chọn lô sơ chế" />
                </SelectTrigger>
                <SelectContent>
                                     {batches.map((batch) => (
                     <SelectItem key={batch.batchId} value={batch.batchId}>
                       {batch.batchCode} - {batch.typeName || 'Unknown Type'}
                     </SelectItem>
                   ))}
                </SelectContent>
              </Select>
              {batches.length === 0 && (
                <p className="text-sm text-orange-600">Không có lô sơ chế nào khả dụng</p>
              )}
            </div>

            {/* Loại chất thải */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-orange-600" />
                Loại chất thải *
              </label>
              <Input
                value={form.wasteType}
                onChange={(e) => handleChange("wasteType", e.target.value)}
                placeholder="Nhập loại chất thải (VD: Vỏ cà phê, Bã cà phê, Nước thải...)"
                className="h-12 border-gray-200 hover:border-red-300 focus:border-red-500 transition-colors"
              />
            </div>

            {/* Số lượng và đơn vị */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Số lượng *
                </label>
                <Input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => handleChange("quantity", parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="h-12 border-gray-200 hover:border-red-300 focus:border-red-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Đơn vị
                </label>
                <Select
                  value={form.unit}
                  onValueChange={(v) => handleChange("unit", v)}
                >
                  <SelectTrigger className="w-full h-12 border-gray-200 hover:border-red-300 focus:border-red-500 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilogram (kg)</SelectItem>
                    <SelectItem value="g">Gram (g)</SelectItem>
                    <SelectItem value="ton">Tấn (ton)</SelectItem>
                    <SelectItem value="l">Lít (l)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Phương pháp xử lý */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Phương pháp xử lý *
              </label>
              <Input
                value={form.disposalMethod}
                onChange={(e) => handleChange("disposalMethod", e.target.value)}
                placeholder="Nhập phương pháp xử lý (VD: Ủ phân, Tái chế, Tiêu hủy...)"
                className="h-12 border-gray-200 hover:border-red-300 focus:border-red-500 transition-colors"
              />
            </div>

            {/* Ngày xử lý */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Ngày xử lý *
              </label>
              <Input
                type="date"
                value={form.disposalDate}
                onChange={(e) => handleChange("disposalDate", e.target.value)}
                className="h-12 border-gray-200 hover:border-red-300 focus:border-red-500 transition-colors"
              />
            </div>

            {/* Mô tả */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                Mô tả *
              </label>
              <Textarea
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Mô tả chi tiết về chất thải, quá trình xử lý, điều kiện..."
                className="min-h-[100px] border-gray-200 hover:border-red-300 focus:border-red-500 transition-colors"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-8 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang thêm...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Thêm xử lý chất thải
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
