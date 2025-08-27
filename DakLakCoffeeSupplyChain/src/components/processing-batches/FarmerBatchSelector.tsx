"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, User, Coffee, Calendar, Package } from "lucide-react";
import { ProcessingBatch } from "@/lib/api/processingBatches";
import { getProcessingBatchesByFarmerForBusinessManager, getFarmersWithBatchesForBusinessManager } from "@/lib/api/processingBatches";

interface FarmerBatchSelectorProps {
  onBatchSelect?: (batch: ProcessingBatch) => void;
}

export default function FarmerBatchSelector({ onBatchSelect }: FarmerBatchSelectorProps) {
  const [farmers, setFarmers] = useState<{ farmerId: string; farmerName: string; batchCount: number }[]>([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>("");
  const [batches, setBatches] = useState<ProcessingBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Lấy danh sách farmers có batches
  useEffect(() => {
    const fetchFarmers = async () => {
      try {

        const data = await getFarmersWithBatchesForBusinessManager();
        
        setFarmers(data);
      } catch (err) {
        console.error("❌ Lỗi khi lấy danh sách farmers:", err);
        setError("Không thể tải danh sách nông dân");
      }
    };

    fetchFarmers();
  }, []);

  // Lấy batch của farmer được chọn
  const fetchFarmerBatches = async (farmerId: string) => {
    if (!farmerId) {
      
      return;
    }

    
    setLoading(true);
    setError("");

    try {
      const data = await getProcessingBatchesByFarmerForBusinessManager(farmerId);
      
      setBatches(data);
    } catch (err) {
      console.error("❌ Lỗi khi lấy batch của farmer:", err);
      setError("Không thể tải danh sách lô sơ chế của nông dân này");
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFarmerChange = (farmerId: string) => {
    
    setSelectedFarmerId(farmerId);
    if (farmerId) {
      fetchFarmerBatches(farmerId);
    } else {
      setBatches([]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NotStarted":
        return "bg-gray-100 text-gray-800";
      case "InProgress":
        return "bg-blue-100 text-blue-800";
      case "AwaitingEvaluation":
        return "bg-yellow-100 text-yellow-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "NotStarted":
        return "Chưa bắt đầu";
      case "InProgress":
        return "Đang xử lý";
      case "AwaitingEvaluation":
        return "Chờ đánh giá";
      case "Completed":
        return "Hoàn thành";
      case "Failed":
        return "Thất bại";
      default:
        return status;
    }
  };

  // Debug: Log farmers
  

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-0 bg-gradient-to-r from-orange-50 to-amber-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-800">
            <div className="p-2 bg-orange-100 rounded-lg">
              <User className="h-6 w-6 text-orange-600" />
            </div>
            Chọn Nông Dân để Xem Lô Sơ Chế
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="farmer-select" className="text-sm font-medium text-gray-700">
              Chọn Nông Dân
            </Label>
            <Select value={selectedFarmerId} onValueChange={handleFarmerChange}>
              <SelectTrigger className="h-12 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-400">
                <SelectValue placeholder="Chọn nông dân..." />
              </SelectTrigger>
              <SelectContent>
                {farmers.map((farmer) => (
                  <SelectItem key={farmer.farmerId} value={farmer.farmerId} className="py-3">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{farmer.farmerName}</span>
                      <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-700">
                        {farmer.batchCount} lô
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center p-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <span className="ml-3 text-sm text-gray-600 font-medium">Đang tải...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {batches.length > 0 && (
        <Card className="shadow-sm border-0">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-800">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Coffee className="h-6 w-6 text-blue-600" />
              </div>
              Danh Sách Lô Sơ Chế
              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                {batches.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {batches.map((batch) => (
                <div
                  key={batch.batchId}
                  className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-200 cursor-pointer bg-white hover:border-orange-300"
                  onClick={() => onBatchSelect?.(batch)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Package className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{batch.batchCode}</h3>
                        <p className="text-sm text-gray-500">Mã hệ thống: {batch.systemBatchCode}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(batch.status)}>
                      {getStatusText(batch.status)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Coffee className="h-4 w-4" />
                        <span className="font-medium">Loại cà phê:</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{batch.typeName || "N/A"}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Mùa vụ:</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{batch.cropSeasonName}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="text-sm text-gray-600 font-medium">Đầu vào:</div>
                      <p className="text-lg font-bold text-blue-600">{batch.totalInputQuantity} kg</p>
                    </div>

                    <div className="space-y-1">
                      <div className="text-sm text-gray-600 font-medium">Đầu ra:</div>
                      <p className="text-lg font-bold text-green-600">{batch.totalOutputQuantity} kg</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Tạo lúc: {new Date(batch.createdAt).toLocaleDateString('vi-VN')}</span>
                      <span className="font-medium">Phương pháp: {batch.methodName}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedFarmerId && !loading && batches.length === 0 && !error && (
        <Card className="shadow-sm border-0">
          <CardContent className="p-12 text-center">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Coffee className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Không có lô sơ chế nào
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Nông dân này chưa có lô sơ chế nào trong các mùa vụ đã cam kết.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
