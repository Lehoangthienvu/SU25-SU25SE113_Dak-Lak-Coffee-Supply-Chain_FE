"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save, X, Coffee, Package } from "lucide-react";
import { createProcessingMethod, updateProcessingMethod, ProcessingMethod } from "@/lib/api/processingMethods";
import { AppToast } from "@/components/ui/AppToast";

interface ProcessingMethodFormProps {
  method?: ProcessingMethod | null;
  onSuccess?: (method: ProcessingMethod) => void;
  onCancel?: () => void;
  isOpen?: boolean;
}

export default function ProcessingMethodForm({
  method,
  onSuccess,
  onCancel,
  isOpen = true
}: ProcessingMethodFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    methodCode: method?.methodCode || "",
    name: method?.name || "",
    description: method?.description || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!form.methodCode.trim()) {
      setError('Mã phương pháp là bắt buộc');
      return false;
    }

    if (!form.name.trim()) {
      setError('Tên phương pháp là bắt buộc');
      return false;
    }

    if (!form.description.trim()) {
      setError('Mô tả là bắt buộc');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const methodData = {
        methodCode: form.methodCode.trim(),
        name: form.name.trim(),
        description: form.description.trim(),
      };

      let result: ProcessingMethod;
      
      if (method) {
        // Update existing method - thêm methodId vào data
        const updateData = {
          ...methodData,
          methodId: method.methodId
        };
        console.log(`🔍 DEBUG: Updating method with data:`, updateData);
        console.log(`🔍 DEBUG: Method ID from URL:`, method.methodId);
        result = await updateProcessingMethod(method.methodId, updateData);
        AppToast.success('Cập nhật phương pháp sơ chế thành công');
      } else {
        // Create new method
        result = await createProcessingMethod(methodData);
        AppToast.success('Tạo phương pháp sơ chế thành công');
      }

      onSuccess?.(result);
    } catch (err: any) {
      console.error("❌ Error saving processing method:", err);
      setError(err?.response?.data?.message || t('common.error.save'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg">
              <Coffee className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {method ? 'Chỉnh sửa Phương pháp Sơ chế' : 'Tạo Phương pháp Sơ chế'}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {method ? 'Chỉnh sửa phương pháp sơ chế cà phê hiện có' : 'Tạo phương pháp sơ chế cà phê mới'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Method Code */}
            <div className="space-y-2">
              <Label htmlFor="methodCode" className="text-sm font-medium text-gray-700">
                Mã Phương pháp <span className="text-red-500">*</span>
              </Label>
              <Input
                id="methodCode"
                name="methodCode"
                value={form.methodCode}
                onChange={handleChange}
                placeholder="Ví dụ: WASHED, NATURAL, HONEY"
                className="border-orange-200 focus:border-orange-400"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Mã duy nhất để nhận diện phương pháp sơ chế
              </p>
            </div>

            {/* Method Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Tên Phương pháp <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ví dụ: Phương pháp Rửa, Phương pháp Tự nhiên"
                className="border-orange-200 focus:border-orange-400"
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Mô tả <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Mô tả phương pháp sơ chế..."
                className="border-orange-200 focus:border-orange-400 min-h-[120px]"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Mô tả chi tiết về phương pháp sơ chế
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="border-gray-300 hover:bg-gray-50"
              >
                <X className="w-4 h-4 mr-2" />
                {t('common.cancel')}
              </Button>
              
              <Button
                type="submit"
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {loading 
                  ? t('common.saving') 
                  : method 
                    ? t('common.update') 
                    : t('common.create')
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
