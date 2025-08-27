"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, Trash2, AlertCircle } from "lucide-react";

export interface WasteInputData {
  wasteType: string;
  quantity: number;
  unit: string;
  note: string;
  recordedAt: string;
}

interface WasteInputProps {
  wastes: WasteInputData[];
  onWastesChange: (wastes: WasteInputData[]) => void;
  className?: string;
}

export default function WasteInput({ wastes, onWastesChange, className = "" }: WasteInputProps) {
  const [errors, setErrors] = useState<{ [key: number]: string }>({});
  
  // Debug log để kiểm tra component có bị render 2 lần không
  console.log("🔍 WasteInput render, wastes count:", wastes.length);

  const addWaste = () => {
    const newWaste: WasteInputData = {
      wasteType: "",
      quantity: 0,
      unit: "kg",
      note: "",
      recordedAt: new Date().toISOString().split("T")[0]
    };
    onWastesChange([...wastes, newWaste]);
  };

  const removeWaste = (index: number) => {
    if (wastes.length > 1) {
      const newWastes = wastes.filter((_, i) => i !== index);
      onWastesChange(newWastes);
      
      // Xóa error của waste đã xóa
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
  };

  const updateWaste = (index: number, field: keyof WasteInputData, value: string | number) => {
    const newWastes = [...wastes];
    newWastes[index] = { ...newWastes[index], [field]: value };
    onWastesChange(newWastes);

    // Validate và xóa error nếu hợp lệ
    validateWaste(index, field, value);
  };

  const validateWaste = (index: number, field: keyof WasteInputData, value: string | number) => {
    const newErrors = { ...errors };
    
    if (field === 'wasteType' && !value.toString().trim()) {
      newErrors[index] = "Vui lòng nhập loại waste";
    } else if (field === 'quantity' && (typeof value === 'number' && (value <= 0 || value > 100000))) {
      newErrors[index] = "Khối lượng phải từ 0.01 đến 100,000";
    } else if (field === 'unit' && !value.toString().trim()) {
      newErrors[index] = "Vui lòng chọn đơn vị";
    } else {
      // Xóa error nếu hợp lệ
      delete newErrors[index];
    }
    
    setErrors(newErrors);
    
    // Debug log
    console.log(`🔍 Validating waste ${index}, field: ${field}, value: ${value}, errors:`, newErrors);
  };

  const validateAllWastes = (): boolean => {
    const newErrors: { [key: number]: string } = {};
    
    wastes.forEach((waste, index) => {
      if (!waste.wasteType.trim()) {
        newErrors[index] = "Vui lòng nhập loại waste";
      } else if (waste.quantity <= 0 || waste.quantity > 100000) {
        newErrors[index] = "Khối lượng phải từ 0.01 đến 100,000";
      } else if (!waste.unit.trim()) {
        newErrors[index] = "Vui lòng chọn đơn vị";
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate khi component mount hoặc wastes thay đổi
  React.useEffect(() => {
    console.log("🔍 WasteInput useEffect triggered, wastes:", wastes);
    if (wastes.length > 0) {
      validateAllWastes();
    }
  }, [wastes]);

  return (
    <div className={`bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Thông tin Waste</h3>
            <p className="text-sm text-gray-600">Ghi nhận các loại waste phát sinh trong quá trình chế biến</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addWaste}
          className="flex items-center gap-1 text-xs bg-white hover:bg-red-50 border-red-300 text-red-700"
        >
          <Plus className="w-3 h-3" />
          Thêm Waste
        </Button>
      </div>

      <div className="space-y-4">
        {wastes.map((waste, index) => (
          <div key={`waste-${index}-${waste.recordedAt}`} className="bg-white rounded-lg p-4 border border-red-200 shadow-sm relative">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Waste #{index + 1}</h4>
              {wastes.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeWaste(index)}
                  className="px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 relative z-10 bg-white"
                  style={{ position: 'relative', zIndex: 10 }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Loại Waste */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Loại Waste *
                </label>
                <Input
                  type="text"
                  value={waste.wasteType}
                  onChange={(e) => updateWaste(index, 'wasteType', e.target.value)}
                  placeholder="VD: Vỏ cà phê, Bã..."
                  className={`text-sm border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 hover:border-red-300 transition-all duration-200 ${
                    errors[index] && !waste.wasteType.trim() ? 'border-red-300' : ''
                  }`}
                />
              </div>

              {/* Khối lượng */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Khối lượng *
                </label>
                <Input
                  type="number"
                  value={waste.quantity}
                  onChange={(e) => updateWaste(index, 'quantity', parseFloat(e.target.value) || 0)}
                  min={0.01}
                  max={100000}
                  step={0.01}
                  placeholder="0"
                  className={`text-sm border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 hover:border-red-300 transition-all duration-200 ${
                    errors[index] && (waste.quantity <= 0 || waste.quantity > 100000) ? 'border-red-300' : ''
                  }`}
                />
              </div>

              {/* Đơn vị */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Đơn vị *
                </label>
                <select
                  value={waste.unit}
                  onChange={(e) => updateWaste(index, 'unit', e.target.value)}
                  className={`text-sm border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 hover:border-red-300 transition-all duration-200 rounded-md px-3 py-2 ${
                    errors[index] && !waste.unit.trim() ? 'border-red-300' : ''
                  }`}
                >
                  <option value="">Chọn đơn vị...</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="g">Gram (g)</option>
                  <option value="tấn">Tấn</option>
                  <option value="tạ">Tạ</option>
                  <option value="yến">Yến</option>
                  <option value="lạng">Lạng</option>
                  <option value="lb">Pound (lb)</option>
                  <option value="oz">Ounce (oz)</option>
                </select>
              </div>

              {/* Ngày ghi nhận */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Ngày ghi nhận
                </label>
                <Input
                  type="date"
                  value={waste.recordedAt}
                  onChange={(e) => updateWaste(index, 'recordedAt', e.target.value)}
                  className="text-sm border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 hover:border-red-300 transition-all duration-200"
                />
              </div>
            </div>

            {/* Ghi chú */}
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Ghi chú
              </label>
              <Input
                type="text"
                value={waste.note}
                onChange={(e) => updateWaste(index, 'note', e.target.value)}
                placeholder="Ghi chú về waste (tùy chọn)..."
                className="text-sm border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 hover:border-red-300 transition-all duration-200"
              />
            </div>

            {/* Error message */}
            {errors[index] && (
              <div className="mt-2 flex items-center gap-2 text-red-600 text-xs">
                <AlertCircle className="w-3 h-3" />
                <span>{errors[index]}</span>
              </div>
            )}
          </div>
        ))}

        {/* Empty state */}
        {wastes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Trash2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm">Chưa có waste nào được thêm</p>
            <p className="text-xs text-gray-400 mt-1">Nhấn "Thêm Waste" để bắt đầu</p>
          </div>
        )}
      </div>

      {/* Validation summary */}
      {Object.keys(errors).length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Vui lòng kiểm tra và sửa các lỗi bên trên</span>
          </div>
        </div>
      )}
    </div>
  );
}
