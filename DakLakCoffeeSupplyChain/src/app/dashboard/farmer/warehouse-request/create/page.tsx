'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PackagePlus, Calendar, ArrowLeft, Coffee, Scale, FileText, Package, Truck, Leaf } from 'lucide-react';
import { createWarehouseInboundRequest, getAllInboundRequestsForFarmer } from '@/lib/api/warehouseInboundRequest';
import { getAvailableBatchesForWarehouseRequest } from '@/lib/api/processingBatches';
import { getAllProcessingBatchProgresses } from '@/lib/api/processingBatchProgress';
import { ProcessingStatus } from '@/lib/constants/batchStatus';
import { toast } from 'sonner';

interface AvailableBatch {
  batchId: string;
  batchCode: string;
  typeName: string;
  cropSeasonName: string;
  status: string;
  availableForNewRequest: number;
  // ✅ THÊM: Thông tin công ty
  companyId: string;
  companyName: string;
  commitmentId: string;
  debug: {
    finalProcessed: number;
    approvedCompletedRequests: number;
  };
}

export default function CreateDeliveryRequestPage() {
  const router = useRouter();

  // ✅ TÁCH RIÊNG 2 FORM STATE
  const [processedForm, setProcessedForm] = useState({
    requestedQuantity: '',
    preferredDeliveryDate: '',
    note: '',
    batchId: '',
  });

  const [freshForm, setFreshForm] = useState({
    requestedQuantity: '',
    preferredDeliveryDate: '',
    note: '',
    detailId: '',
  });

  const [batches, setBatches] = useState<AvailableBatch[]>([]);
  const [cropSeasonDetails, setCropSeasonDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);
  const [isLoadingCropDetails, setIsLoadingCropDetails] = useState(true);

  const [inboundRequests, setInboundRequests] = useState<{
    batchId: string;
    detailId: string;
    requestedQuantity: number;
    status: string | number;
  }[]>([]);
  const [availableBatchesData, setAvailableBatchesData] = useState<any[]>([]);
  const [availableCropDetailsData, setAvailableCropDetailsData] = useState<any[]>([]);

  // 👇 Thêm stepIndex để xác định bước cuối
  const [batchProgresses, setBatchProgresses] = useState<{
    batchId: string;
    outputQuantity?: number;
    outputUnit?: string;
    stageName: string;
    stepIndex: number; // NEW
  }[]>([]);

  // ✅ TÁCH RIÊNG 2 HANDLE CHANGE
  const handleProcessedFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setProcessedForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'preferredDeliveryDate') {
      const dateInput = document.getElementById('processedPreferredDeliveryDate') as HTMLInputElement;
      if (dateInput) {
        dateInput.setCustomValidity('');
      }
    }
  };

  const handleFreshFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFreshForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'preferredDeliveryDate') {
      const dateInput = document.getElementById('freshPreferredDeliveryDate') as HTMLInputElement;
      if (dateInput) {
        dateInput.setCustomValidity('');
      }
    }
  };

  // Sử dụng dữ liệu từ API available batches
  const batchesWithRemaining = useMemo(() => {
    if (!availableBatchesData || availableBatchesData.length === 0) return [];

    // Debug log removed for performance
    console.log('  - availableBatchesData:', availableBatchesData);
    console.log('  - inboundRequests:', inboundRequests);

    return availableBatchesData.map((batch: any) => {
      // 🔧 FIX: Sử dụng availableQuantity từ backend thay vì tính lại
      // Backend đã tính đúng rồi, không cần trừ thêm
      const availableForNewRequest = batch.availableQuantity || 0;

      console.log(`  - Batch ${batch.batchCode}:`);
      console.log(`    * batch.availableQuantity: ${batch.availableQuantity}`);
      console.log(`    * Using backend calculation: ${availableForNewRequest}`);
      console.log(`    * Backend already subtracted: ${batch.totalRequested}`);

      return {
        batchId: batch.batchId,
        batchCode: batch.batchCode,
        typeName: batch.coffeeTypeName || 'Không rõ',
        cropSeasonName: batch.cropSeasonName || 'Không rõ',
        status: batch.status,
        availableForNewRequest,
        // ✅ THÊM: Thông tin công ty
        companyId: batch.companyId || '',
        companyName: batch.companyName || 'Không rõ công ty',
        commitmentId: batch.commitmentId || '',
        debug: {
          finalProcessed: batch.maxOutputQuantity || 0,
          totalRequested: batch.totalRequested || 0,
        },
      };
    });
  }, [availableBatchesData, inboundRequests]);

  // Sử dụng dữ liệu từ API available crop season details
  const cropDetailsWithRemaining = useMemo(() => {
    if (!availableCropDetailsData || availableCropDetailsData.length === 0) return [];

    return availableCropDetailsData.map((detail: any) => {
      // 🔧 FIX: Sử dụng availableQuantity từ backend thay vì tính lại
      // Backend đã tính đúng rồi, không cần trừ thêm
      const availableForNewRequest = detail.availableQuantity || 0;

      return {
        detailId: detail.detailId,
        cropSeasonName: detail.cropSeasonName || 'Không rõ',
        coffeeTypeName: detail.coffeeTypeName || 'Không rõ',
        availableForNewRequest,
        debug: {
          actualYield: detail.actualYield || 0,
          totalRequested: detail.totalRequested || 0,
        },
      };
    });
  }, [availableCropDetailsData, inboundRequests]);

  // ✅ TÁCH RIÊNG 2 HANDLE SUBMIT
  const handleProcessedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { requestedQuantity, preferredDeliveryDate, note, batchId } = processedForm;

      if (!batchId) {
        toast.error('Bạn chưa chọn lô sơ chế');
        return;
      }

      const quantity = Number(requestedQuantity);
      if (isNaN(quantity) || quantity <= 0) {
        toast.error('Số lượng phải là số dương lớn hơn 0');
        return;
      }

      // Check không vượt quá còn lại cho cà phê đã sơ chế
      const selectedBatch = batchesWithRemaining.find((b) => b.batchId === batchId);
      if (selectedBatch && quantity > selectedBatch.availableForNewRequest) {
        toast.error(
          `Số lượng yêu cầu (${quantity}kg) vượt quá số lượng có thể gửi yêu cầu mới (${selectedBatch.availableForNewRequest}kg). Tổng số lượng (đã duyệt + đang chờ + yêu cầu mới) không được vượt quá sản lượng cuối (${selectedBatch.debug.finalProcessed}kg)`
        );
        setLoading(false);
        return;
      }

      const dateInput = document.getElementById('processedPreferredDeliveryDate') as HTMLInputElement;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(preferredDeliveryDate);

      if (selectedDate < today) {
        dateInput.setCustomValidity('Ngày giao dự kiến không được nhỏ hơn hôm nay.');
        dateInput.reportValidity();
        setLoading(false);
        return;
      } else {
        dateInput.setCustomValidity('');
      }

      const message = await createWarehouseInboundRequest({
        requestedQuantity: Number(requestedQuantity),
        preferredDeliveryDate,
        note,
        batchId: batchId,
        detailId: undefined, // Chỉ gửi batchId cho cà phê sơ chế
      });

      toast.success(message);
      router.push('/dashboard/farmer/warehouse-request');
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFreshSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { requestedQuantity, preferredDeliveryDate, note, detailId } = freshForm;

      if (!detailId) {
        toast.error('Bạn chưa chọn vùng trồng');
        return;
      }

      const quantity = Number(requestedQuantity);
      if (isNaN(quantity) || quantity <= 0) {
        toast.error('Số lượng phải là số dương lớn hơn 0');
        return;
      }

      // Check không vượt quá còn lại cho cà phê tươi
      const selectedDetail = cropDetailsWithRemaining.find((d) => d.detailId === detailId);
      if (selectedDetail && quantity > selectedDetail.availableForNewRequest) {
        toast.error(
          `Số lượng yêu cầu (${quantity}kg) vượt quá số lượng có thể gửi yêu cầu mới (${selectedDetail.availableForNewRequest}kg). Tổng số lượng không được vượt quá sản lượng thực tế (${selectedDetail.debug.actualYield}kg)`
        );
        setLoading(false);
        return;
      }

      const dateInput = document.getElementById('freshPreferredDeliveryDate') as HTMLInputElement;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(preferredDeliveryDate);

      if (selectedDate < today) {
        dateInput.setCustomValidity('Ngày giao dự kiến không được nhỏ hơn hôm nay.');
        dateInput.reportValidity();
        setLoading(false);
        return;
      } else {
        dateInput.setCustomValidity('');
      }

      const message = await createWarehouseInboundRequest({
        requestedQuantity: Number(requestedQuantity),
        preferredDeliveryDate,
        note,
        batchId: undefined, // Chỉ gửi detailId cho cà phê tươi
        detailId: detailId,
      });

      toast.success(message);
      router.push('/dashboard/farmer/warehouse-request');
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Lấy danh sách batches có available quantity từ API mới
        const availableBatchesData = await getAvailableBatchesForWarehouseRequest();
        console.log('🔍 Available Batches for Warehouse Request:', availableBatchesData);
        // Debug log removed for performance
        if (availableBatchesData && availableBatchesData.length > 0) {
          console.log('  - First batch keys:', Object.keys(availableBatchesData[0]));
          console.log('  - First batch values:', availableBatchesData[0]);
        }
        
        // Lưu dữ liệu available batches
        setAvailableBatchesData(availableBatchesData || []);

        // TẠM THỜI ẨN - Không cần lấy crop season details vì chỉ gửi cà phê sơ chế
        // const cropDetailsData = await getCropSeasonDetailsForCurrentFarmer();
        // console.log('🔍 Available Crop Season Details:', cropDetailsData);
        setAvailableCropDetailsData([]);

        // Lấy batch progresses (cần thiết để tính toán số lượng còn lại)
        const progressesData = await getAllProcessingBatchProgresses();
        setBatchProgresses(progressesData || []);

        // Lấy inbound requests (cần thiết để tính toán số lượng đã yêu cầu)
        const requestsData = await getAllInboundRequestsForFarmer();
        if (requestsData.status === 1) {
          setInboundRequests(requestsData.data || []);
        }
      } catch (error: any) {
        console.error('Error fetching data:', error);
        // Hiển thị thông báo lỗi cụ thể từ backend thay vì thông báo chung
        const errorMessage = error?.message || 'Không thể tải dữ liệu';
        toast.error(errorMessage);
      } finally {
        setIsLoadingBatches(false);
        setIsLoadingCropDetails(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tạo yêu cầu nhập kho</h1>
          <p className="text-gray-600">Gửi yêu cầu nhập kho cà phê</p>
        </div>
      </div>

      <Tabs defaultValue="processed" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="processed" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Cà phê đã sơ chế
          </TabsTrigger>
          {/* TẠM THỜI ẨN - Tab cà phê tươi */}
          {/* <TabsTrigger value="fresh" className="flex items-center gap-2">
            <Leaf className="h-4 w-4" />
            Cà phê tươi
          </TabsTrigger> */}
        </TabsList>
        
        {/* ✅ THÔNG BÁO RÕ RÀNG CHO TỪNG TAB */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>💡 Hướng dẫn:</strong> Mỗi tab có form riêng biệt. Vui lòng chọn đúng tab tương ứng với loại cà phê bạn muốn gửi.
          </div>
          <div className="mt-2 text-xs text-blue-700">
            <strong>🔒 Bảo mật:</strong> Mỗi form chỉ xử lý loại cà phê tương ứng, không thể nhầm lẫn giữa cà phê tươi và cà phê sơ chế.
          </div>
        </div>



        <TabsContent value="processed" className="space-y-6">
          <Card className="border-orange-200 bg-orange-50/30">
            <CardHeader className="bg-orange-100/50 border-b border-orange-200">
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Package className="h-5 w-5" />
                Yêu cầu nhập kho cà phê đã sơ chế
              </CardTitle>
              <p className="text-sm text-orange-700">Chọn lô sơ chế đã hoàn thành để gửi yêu cầu nhập kho</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProcessedSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="processedBatchId" className="text-orange-700 font-medium">
                      Chọn lô sơ chế * 
                      <span className="text-xs text-orange-600 ml-2">(Cà phê đã qua xử lý)</span>
                    </Label>
                    <select
                      id="processedBatchId"
                      name="batchId"
                      value={processedForm.batchId}
                      onChange={handleProcessedFormChange}
                      className="w-full p-2 border border-orange-300 rounded-md focus:border-orange-500 focus:ring-orange-200"
                      required
                    >
                      <option value="">-- Chọn lô sơ chế --</option>
                      {batchesWithRemaining
                        .map((batch) => (
                          <option key={batch.batchId} value={batch.batchId}>
                            {batch.batchCode} - {batch.typeName || 'Không rõ'} ({batch.availableForNewRequest}kg còn lại) - {batch.companyName || 'Không rõ công ty'}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="processedRequestedQuantity">Số lượng yêu cầu (kg) *</Label>
                    <Input
                      id="processedRequestedQuantity"
                      name="requestedQuantity"
                      type="number"
                      value={processedForm.requestedQuantity}
                      onChange={handleProcessedFormChange}
                      placeholder="Nhập số lượng"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="processedPreferredDeliveryDate">Ngày giao dự kiến *</Label>
                    <Input
                      id="processedPreferredDeliveryDate"
                      name="preferredDeliveryDate"
                      type="date"
                      value={processedForm.preferredDeliveryDate}
                      onChange={handleProcessedFormChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="processedNote">Ghi chú</Label>
                    <Textarea
                      id="processedNote"
                      name="note"
                      value={processedForm.note}
                      onChange={handleProcessedFormChange}
                      placeholder="Ghi chú thêm (nếu có)"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-white">
                    {loading ? 'Đang gửi...' : 'Gửi yêu cầu cà phê sơ chế'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TẠM THỜI ẨN - Tab content cà phê tươi */}
        {/* <TabsContent value="fresh" className="space-y-6">
          <Card className="border-green-200 bg-green-50/30">
            <CardHeader className="bg-green-100/50 border-b border-green-200">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Leaf className="h-5 w-5" />
                Yêu cầu nhập kho cà phê tươi
              </CardTitle>
              <p className="text-sm text-green-700">Chọn vùng trồng đã hoàn thành để gửi yêu cầu nhập kho</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFreshSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="freshDetailId" className="text-green-700 font-medium">
                      Chọn vùng trồng * 
                      <span className="text-xs text-green-600 ml-2">(Cà phê tươi nguyên bản)</span>
                    </Label>
                    <select
                      id="freshDetailId"
                      name="detailId"
                      value={freshForm.detailId}
                      onChange={handleFreshFormChange}
                      className="w-full p-2 border border-green-300 rounded-md focus:border-green-500 focus:ring-green-200"
                      required
                    >
                      <option value="">-- Chọn vùng trồng --</option>
                      {cropDetailsWithRemaining
                        .map((detail) => (
                          <option key={detail.detailId} value={detail.detailId}>
                            {detail.cropSeasonName} - {detail.coffeeTypeName} ({detail.availableForNewRequest}kg còn lại)
                      </option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="freshRequestedQuantity">Số lượng yêu cầu (kg) *</Label>
                    <Input
                      id="freshRequestedQuantity"
                      name="requestedQuantity"
                      type="number"
                      value={freshForm.requestedQuantity}
                      onChange={handleFreshFormChange}
                      placeholder="Nhập số lượng"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="freshPreferredDeliveryDate">Ngày giao dự kiến *</Label>
                    <Input
                      id="freshPreferredDeliveryDate"
                      name="preferredDeliveryDate"
                      type="date"
                      value={freshForm.preferredDeliveryDate}
                      onChange={handleFreshFormChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="freshNote">Ghi chú</Label>
                    <Textarea
                      id="freshNote"
                      name="note"
                      value={freshForm.note}
                      onChange={handleFreshFormChange}
                      placeholder="Ghi chú thêm (nếu có)"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
                    {loading ? 'Đang gửi...' : 'Gửi yêu cầu cà phê tươi'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent> */}
      </Tabs>
    </div>
  );
}
