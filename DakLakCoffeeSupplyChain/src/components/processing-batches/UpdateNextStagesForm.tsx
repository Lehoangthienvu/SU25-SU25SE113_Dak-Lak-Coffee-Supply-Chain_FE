"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, X, Info, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { advanceToNextProcessingProgress, getBatchInfoBeforeRetry } from '@/lib/api/processingBatchProgress';
import { getProcessingBatchById } from '@/lib/api/processingBatches';
import { AppToast } from '@/components/ui/AppToast';
import { getProcessingStagesByMethodId, ProcessingStage } from '@/lib/api/processingStages';

interface UpdateNextStagesFormProps {
  batchId: string;
  methodId?: number;
  currentStageOrder?: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UpdateNextStagesForm({
  batchId,
  methodId,
  currentStageOrder,
  isOpen,
  onClose,
  onSuccess
}: UpdateNextStagesFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    progressDate: new Date().toISOString().split('T')[0],
    outputQuantity: 0,
    outputUnit: 'kg',
    parameterName: '',
    parameterValue: '',
    unit: '',
    recordedAt: new Date().toISOString(),
  });

  const [parameters, setParameters] = useState<Array<{
    parameterName: string;
    parameterValue: string;
    unit: string;
    recordedAt: string;
  }>>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextStages, setNextStages] = useState<ProcessingStage[]>([]);
  const [retryValidation, setRetryValidation] = useState<{
    finalOutputBeforeRetry: number;
    finalOutputUnit: string;
    maxWastePercentage: number;
    calculatedWaste?: number;
    wastePercentage?: number;
    isValid?: boolean;
    errorMessage?: string;
  } | null>(null);
  const [validationLoading, setValidationLoading] = useState(false);

  // Lấy thông tin các stage còn lại
  useEffect(() => {
    const fetchNextStages = async () => {
      if (methodId && currentStageOrder !== undefined) {
        try {
          const stages = await getProcessingStagesByMethodId(methodId);
          console.log('🔍 DEBUG UpdateNextStagesForm: All stages:', stages);
          console.log('🔍 DEBUG UpdateNextStagesForm: Current stage order:', currentStageOrder);
          console.log('🔍 DEBUG UpdateNextStagesForm: Method ID:', methodId);
          console.log('🔍 DEBUG UpdateNextStagesForm: Batch ID:', batchId);
          
          // 🔧 MỚI: Debug chi tiết từng stage
          stages.forEach(stage => {
            console.log(`🔍 DEBUG UpdateNextStagesForm: Stage ${stage.stageName} - OrderIndex: ${stage.orderIndex}, StageId: ${stage.stageId}`);
          });
          
          // 🔧 MỚI: Tìm stage đã retry thay vì dựa vào currentStageOrder
          // Lấy thông tin batch để tìm stage đã retry gần nhất
          const batchInfo = await getProcessingBatchById(batchId);
          console.log('🔍 DEBUG UpdateNextStagesForm: Batch info:', batchInfo);
          
          if (batchInfo?.progresses) {
            // Tìm progress retry gần nhất
            const retryProgresses = batchInfo.progresses
              .filter((p: any) => !p.isDeleted && p.stageDescription && p.stageDescription.includes('Làm lại'))
              .sort((a: any, b: any) => new Date(b.progressDate).getTime() - new Date(a.progressDate).getTime());
            
            console.log('🔍 DEBUG UpdateNextStagesForm: Retry progresses:', retryProgresses);
            
            if (retryProgresses.length > 0) {
              const latestRetryProgress = retryProgresses[0];
              const retryStage = stages.find(s => s.stageId === latestRetryProgress.stageId);
              
              if (retryStage) {
                console.log('🔍 DEBUG UpdateNextStagesForm: Latest retry stage:', retryStage.stageName, 'OrderIndex:', retryStage.orderIndex);
                
                // Tìm stage tiếp theo sau stage đã retry
                const remainingStages = stages.filter(stage => {
                  const isNextStage = stage.orderIndex === retryStage.orderIndex + 1;
                  console.log(`🔍 DEBUG UpdateNextStagesForm: Stage ${stage.stageName} (order: ${stage.orderIndex}) - Is next stage: ${isNextStage} (looking for order: ${retryStage.orderIndex + 1})`);
                  return isNextStage;
                });
                
                console.log('🔍 DEBUG UpdateNextStagesForm: Remaining stages:', remainingStages);
                setNextStages(remainingStages);
                return;
              }
            }
          }
          
          // Fallback: Sử dụng logic cũ nếu không tìm thấy retry progress
          console.log('🔍 DEBUG UpdateNextStagesForm: No retry progress found, using fallback logic');
          const remainingStages = stages.filter(stage => {
            const isNextStage = stage.orderIndex === currentStageOrder + 1;
            console.log(`🔍 DEBUG UpdateNextStagesForm: Stage ${stage.stageName} (order: ${stage.orderIndex}) - Is next stage: ${isNextStage} (looking for order: ${currentStageOrder + 1})`);
            return isNextStage;
          });
          
          console.log('🔍 DEBUG UpdateNextStagesForm: Fallback remaining stages:', remainingStages);
          setNextStages(remainingStages);
        } catch (error) {
          console.error('Error fetching next stages:', error);
          setNextStages([]);
        }
      }
    };

    if (isOpen) {
      fetchNextStages();
    }
  }, [methodId, currentStageOrder, isOpen, batchId]);

  // 🔧 MỚI: Effect để lấy thông tin batch trước retry khi component mở
  useEffect(() => {
    if (isOpen) {
      fetchBatchInfoBeforeRetry();
    }
  }, [isOpen, batchId]);

  // 🔧 MỚI: Effect để validate retry quantity khi user nhập
  useEffect(() => {
    if (form.outputQuantity > 0 && retryValidation) {
      // Sử dụng setTimeout để tránh infinite loop
      const timeoutId = setTimeout(() => {
        validateRetryQuantity();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [form.outputQuantity, form.outputUnit, retryValidation]);

  // 🔧 MỚI: Lấy thông tin batch trước retry
  const fetchBatchInfoBeforeRetry = async () => {
    try {
      setValidationLoading(true);
      const response = await getBatchInfoBeforeRetry(batchId);
      setRetryValidation(response);
    } catch (error) {
      console.error('Error fetching batch info before retry:', error);
      AppToast.error('Không thể lấy thông tin batch trước retry');
    } finally {
      setValidationLoading(false);
    }
  };

  // 🔧 MỚI: Validate retry quantity
  const validateRetryQuantity = useCallback(() => {
    if (!retryValidation || form.outputQuantity <= 0) return;

    // Chuyển đổi về kg để so sánh
    const retryQuantityInKg = form.outputUnit === 'kg' ? form.outputQuantity :
      form.outputUnit === 'g' ? form.outputQuantity / 1000 :
      form.outputUnit === 'ton' ? form.outputQuantity * 1000 :
      form.outputUnit === 'quintal' ? form.outputQuantity * 100 :
      form.outputUnit === 'yen' ? form.outputQuantity * 10 :
      form.outputUnit === 'lang' ? form.outputQuantity * 0.0375 : form.outputQuantity;

    const finalOutputInKg = retryValidation.finalOutputBeforeRetry;

    // Kiểm tra khối lượng không được vượt quá output cuối cùng
    if (retryQuantityInKg > finalOutputInKg) {
      setRetryValidation(prev => prev ? {
        ...prev,
        calculatedWaste: 0,
        wastePercentage: 0,
        isValid: false,
        errorMessage: `Khối lượng cập nhật (${form.outputQuantity} ${form.outputUnit}) không được vượt quá output cuối cùng (${retryValidation.finalOutputBeforeRetry} ${retryValidation.finalOutputUnit})`
      } : null);
      return;
    }

    // Tính waste
    const waste = finalOutputInKg - retryQuantityInKg;
    const wastePercentage = (waste / finalOutputInKg) * 100;

    // Kiểm tra waste percentage
    if (wastePercentage > retryValidation.maxWastePercentage) {
      setRetryValidation(prev => prev ? {
        ...prev,
        calculatedWaste: waste,
        wastePercentage,
        isValid: false,
        errorMessage: `Tỷ lệ waste quá cao (${wastePercentage.toFixed(1)}% > ${retryValidation.maxWastePercentage}%). Vui lòng giảm khối lượng`
      } : null);
      return;
    }

    // Valid
    setRetryValidation(prev => prev ? {
      ...prev,
      calculatedWaste: waste,
      wastePercentage,
      isValid: true,
      errorMessage: undefined
    } : null);
  }, [form.outputQuantity, form.outputUnit, retryValidation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const addParameter = () => {
    if (form.parameterName && form.parameterValue) {
      setParameters(prev => [...prev, {
        parameterName: form.parameterName,
        parameterValue: form.parameterValue,
        unit: form.unit,
        recordedAt: form.recordedAt,
      }]);
      setForm(prev => ({
        ...prev,
        parameterName: '',
        parameterValue: '',
        unit: '',
        recordedAt: new Date().toISOString(),
      }));
    }
  };

  const removeParameter = (index: number) => {
    setParameters(prev => prev.filter((_, i) => i !== index));
  };

  const handlePhotoFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotoFiles(Array.from(e.target.files));
    }
  };

  const removePhotoFile = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleVideoFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setVideoFiles(Array.from(e.target.files));
    }
  };

  const removeVideoFile = (index: number) => {
    setVideoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!form.progressDate) {
      AppToast.error('Vui lòng chọn ngày cập nhật');
      return;
    }
    if (form.outputQuantity <= 0) {
      AppToast.error('Vui lòng nhập khối lượng đầu ra');
      return;
    }
    if (!form.outputUnit) {
      AppToast.error('Vui lòng chọn đơn vị');
      return;
    }

    // 🔧 MỚI: Kiểm tra validation cho output quantity
    if (retryValidation && !retryValidation.isValid) {
      AppToast.error(retryValidation.errorMessage || 'Khối lượng không hợp lệ');
      return;
    }

    // Nếu có nhiều parameters, chỉ sử dụng parameter đầu tiên cho API

    setLoading(true);
    try {
      const payload = {
        progressDate: form.progressDate,
        outputQuantity: form.outputQuantity,
        outputUnit: form.outputUnit,
        ...(parameters.length > 0 ? {
          parameterName: parameters[0].parameterName,
          parameterValue: parameters[0].parameterValue,
          unit: parameters[0].unit,
          recordedAt: parameters[0].recordedAt,
        } : form.parameterName && form.parameterValue ? {
          parameterName: form.parameterName,
          parameterValue: form.parameterValue,
          unit: form.unit,
          recordedAt: form.recordedAt,
        } : {}),
        ...(photoFiles.length > 0 && { photoFiles }),
        ...(videoFiles.length > 0 && { videoFiles }),
      };

      console.log('🚀 Gửi payload cập nhật tiếp stages:', payload);
      await advanceToNextProcessingProgress(batchId, payload);
      
      AppToast.success('Cập nhật tiếp các stages thành công!');
      onSuccess();
      onClose();
      
      // Reset form
      setForm({
        progressDate: new Date().toISOString().split('T')[0],
        outputQuantity: 0,
        outputUnit: 'kg',
        parameterName: '',
        parameterValue: '',
        unit: '',
        recordedAt: new Date().toISOString(),
      });
      setParameters([]);
      setPhotoFiles([]);
      setVideoFiles([]);
    } catch (error: any) {
      console.error('Error updating next stages:', error);
      
      let errorMessage = 'Có lỗi xảy ra khi cập nhật tiếp các stages';
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      AppToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              {t('componentsprocessing.updateNextStagesForm.title')}
            </CardTitle>
            <p className="text-gray-600 text-sm">
              {t('componentsprocessing.updateNextStagesForm.description')}
            </p>
          </CardHeader>

                     <CardContent className="space-y-6">
                           {/* Thông tin các stage còn lại */}
              {nextStages.length > 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="text-sm font-medium text-green-900">Các giai đoạn còn lại</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Bạn sẽ cập nhật thông tin cho {nextStages.length} giai đoạn tiếp theo:
                      </p>
                      <div className="mt-2 space-y-1">
                        {nextStages.map((stage, index) => (
                          <div key={stage.stageId} className="flex items-center gap-2 text-sm">
                            <span className="w-4 h-4 bg-green-200 rounded-full flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </span>
                            <span className="font-medium">{stage.stageName}</span>
                            <span className="text-gray-500">(Thứ tự: {stage.orderIndex})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-900">Thông báo</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Không tìm thấy giai đoạn tiếp theo. Có thể bạn đã ở giai đoạn cuối cùng của quy trình.
                      </p>
                    </div>
                  </div>
                </div>
              )}

             {/* Thông báo */}
             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Thông tin quan trọng</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Bạn đang cập nhật thông tin cho các giai đoạn tiếp theo sau khi đã hoàn thành retry. 
                    Hãy đảm bảo thông tin chính xác để tiếp tục quy trình sơ chế.
                  </p>
                </div>
              </div>
            </div>

            {/* Ngày cập nhật */}
            <div className="space-y-2">
              <Label htmlFor="progressDate">Ngày cập nhật</Label>
              <Input
                id="progressDate"
                name="progressDate"
                type="date"
                value={form.progressDate}
                onChange={handleChange}
                className="border-blue-200 focus:border-blue-400"
              />
            </div>

                         {/* Sản lượng đầu ra */}
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="outputQuantity">{t('componentsprocessing.updateNextStagesForm.outputQuantity')}</Label>
                 <Input
                   id="outputQuantity"
                   name="outputQuantity"
                   type="number"
                   step="0.01"
                   min="0.01"
                   value={form.outputQuantity}
                   onChange={handleChange}
                   onKeyDown={(e) => {
                     if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                       return;
                     }
                     if (!/[\d.]/.test(e.key)) {
                       e.preventDefault();
                     }
                   }}
                   placeholder={t('componentsprocessing.updateNextStagesForm.outputQuantityPlaceholder')}
                   className={`border-blue-200 focus:border-blue-400 ${
                     retryValidation && !retryValidation.isValid ? 'border-red-300 focus:border-red-400' : ''
                   }`}
                 />
                 {/* 🔧 MỚI: Hiển thị validation message */}
                 {retryValidation && !retryValidation.isValid && (
                   <div className="text-sm text-red-600 mt-1">
                     {retryValidation.errorMessage}
                   </div>
                 )}
                 {/* 🔧 MỚI: Hiển thị thông tin validation */}
                 {retryValidation && retryValidation.isValid && (
                   <div className="text-sm text-green-600 mt-1">
                     ✓ Khối lượng hợp lệ
                     {retryValidation.wastePercentage !== undefined && (
                       <span className="ml-2 text-gray-600">
                         (Waste: {retryValidation.wastePercentage.toFixed(1)}%)
                       </span>
                     )}
                   </div>
                 )}
                 {/* 🔧 MỚI: Loading indicator */}
                 {validationLoading && (
                   <div className="text-sm text-blue-600 mt-1">
                     Đang kiểm tra khối lượng...
                   </div>
                 )}
                 {/* 🔧 MỚI: Hiển thị thông tin output cuối cùng */}
                 {retryValidation && !validationLoading && (
                   <div className="text-sm text-gray-600 mt-1">
                     Output cuối cùng: {retryValidation.finalOutputBeforeRetry} {retryValidation.finalOutputUnit}
                   </div>
                 )}
               </div>

              <div className="space-y-2">
                <Label htmlFor="outputUnit">Đơn vị</Label>
                <Select value={form.outputUnit} onValueChange={(value) => setForm(prev => ({ ...prev, outputUnit: value }))}>
                  <SelectTrigger className="border-blue-200 focus:border-blue-400">
                    <SelectValue placeholder="Chọn đơn vị" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilogram (kg)</SelectItem>
                    <SelectItem value="g">Gram (g)</SelectItem>
                    <SelectItem value="ton">Tấn (ton)</SelectItem>
                    <SelectItem value="quintal">Tạ (quintal)</SelectItem>
                    <SelectItem value="yen">Yến (yên)</SelectItem>
                    <SelectItem value="lang">Lạng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Thông số kỹ thuật */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">{t('componentsprocessing.updateNextStagesForm.parameters')}</h4>
              
              {/* Thêm thông số mới */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parameterName">Tên thông số</Label>
                  <Input
                    id="parameterName"
                    name="parameterName"
                    value={form.parameterName}
                    onChange={handleChange}
                    placeholder={t('componentsprocessing.updateNextStagesForm.parametersPlaceholder')}
                    className="border-blue-200 focus:border-blue-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parameterValue">Giá trị</Label>
                  <Input
                    id="parameterValue"
                    name="parameterValue"
                    value={form.parameterValue}
                    onChange={handleChange}
                    placeholder="Nhập giá trị..."
                    className="border-blue-200 focus:border-blue-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Đơn vị</Label>
                  <Input
                    id="unit"
                    name="unit"
                    value={form.unit}
                    onChange={handleChange}
                    placeholder="VD: °C, %..."
                    className="border-blue-200 focus:border-blue-400"
                  />
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                onClick={addParameter}
                disabled={!form.parameterName || !form.parameterValue}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                Thêm thông số
              </Button>

              {/* Danh sách thông số đã thêm */}
              {parameters.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">Thông số đã thêm:</h5>
                  {parameters.map((param, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <span className="font-medium">{param.parameterName}</span>
                        <span className="text-gray-600">{param.parameterValue}</span>
                        <span className="text-gray-500">{param.unit}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeParameter(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload hình ảnh */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Hình ảnh</h4>
              <div className="space-y-2">
                <Label htmlFor="photoFiles">Chọn hình ảnh</Label>
                <Input
                  id="photoFiles"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoFilesChange}
                  className="cursor-pointer border-blue-200 focus:border-blue-400"
                />
              </div>
              {photoFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {photoFiles.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Photo ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removePhotoFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload video */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Video</h4>
              <div className="space-y-2">
                <Label htmlFor="videoFiles">Chọn video</Label>
                <Input
                  id="videoFiles"
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleVideoFilesChange}
                  className="cursor-pointer border-blue-200 focus:border-blue-400"
                />
              </div>
              {videoFiles.length > 0 && (
                <div className="space-y-2">
                  {videoFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeVideoFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={onClose}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                                 {t('componentsprocessing.updateNextStagesForm.cancel')}
              </Button>
                             <Button
                 type="submit"
                 disabled={loading || (retryValidation !== null && retryValidation.isValid === false)}
                 className="bg-blue-600 hover:bg-blue-700 text-white"
               >
                                   {loading ? t('componentsprocessing.updateNextStagesForm.submitting') : t('componentsprocessing.updateNextStagesForm.submit')}
               </Button>
            </div>
          </CardContent>
        </form>
      </div>
    </div>
  );
}
