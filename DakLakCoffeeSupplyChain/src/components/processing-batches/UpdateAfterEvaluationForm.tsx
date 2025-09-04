"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, CheckCircle, Info, X, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { updateProgressAfterEvaluation, getBatchInfoBeforeRetry, RetryValidationInfo } from '@/lib/api/processingBatchProgress';
import QuantityValidationInfo from './QuantityValidationInfo';
import { AppToast } from '@/components/ui/AppToast';

interface UpdateAfterEvaluationFormProps {
  batchId: string;
  failedStageInfo: {
    stageId: number;
    stageName: string;
    failureDetails: string;
    recommendations?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isRetry?: boolean; // 🔧 MỚI: Xác định khi nào là retry (cập nhật sau evaluation fail)
}



export default function UpdateAfterEvaluationForm({
  batchId,
  failedStageInfo,
  isOpen,
  onClose,
  onSuccess,
  isRetry = false // 🔧 MỚI: Default là false
}: UpdateAfterEvaluationFormProps) {
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
  const [previousProgress, setPreviousProgress] = useState<{
    quantity: number;
    unit: string;
  } | null>(null);

  // 🔧 MỚI: State cho validation retry
  const [retryValidation, setRetryValidation] = useState<RetryValidationInfo | null>(null);
  const [validationLoading, setValidationLoading] = useState(false);

  // 🔧 MỚI: Helper function để convert đơn vị về kg
  const convertToKg = (quantity: number, unit: string): number => {
    switch (unit.toLowerCase()) {
      case 'kg':
        return quantity;
      case 'g':
        return quantity / 1000;
      case 'ton':
        return quantity * 1000;
      case 'quintal':
        return quantity * 100;
      case 'yen':
        return quantity * 0.6; // 1 yến = 0.6 kg
      case 'lang':
        return quantity * 0.0375; // 1 lạng = 0.0375 kg
      default:
        return quantity; // Default là kg
    }
  };

  // 🔧 MỚI: Validate retry quantity
  const validateRetryQuantity = useCallback(() => {
    if (!retryValidation) return;

    const retryQuantityInKg = convertToKg(form.outputQuantity, form.outputUnit);
    const finalOutputInKg = convertToKg(retryValidation.finalOutputBeforeRetry, retryValidation.finalOutputUnit);

    // Kiểm tra không vượt quá output cuối cùng trước retry
    if (retryQuantityInKg > finalOutputInKg) {
      setRetryValidation(prev => prev ? {
        ...prev,
        calculatedWaste: 0,
        wastePercentage: 0,
        isValid: false,
        errorMessage: `Khối lượng retry (${form.outputQuantity} ${form.outputUnit}) không được vượt quá output cuối cùng trước retry (${retryValidation.finalOutputBeforeRetry} ${retryValidation.finalOutputUnit})`
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
        errorMessage: `Tỷ lệ waste quá cao (${wastePercentage.toFixed(1)}% > ${retryValidation.maxWastePercentage}%). Vui lòng giảm khối lượng retry`
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

  // 🔧 MỚI: Effect để lấy thông tin batch trước retry khi component mở
  useEffect(() => {
    if (isOpen && isRetry) {
      fetchBatchInfoBeforeRetry();
    }
  }, [isOpen, isRetry, batchId]);

  // 🔧 MỚI: Effect để validate retry quantity khi user nhập
  useEffect(() => {
    if (isRetry && form.outputQuantity > 0 && retryValidation) {
      // Sử dụng setTimeout để tránh infinite loop
      const timeoutId = setTimeout(() => {
        validateRetryQuantity();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [form.outputQuantity, form.outputUnit, isRetry, validateRetryQuantity]); // Thêm validateRetryQuantity vào dependency

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'outputQuantity' ? Number(value) : value,
    }));
  };

  const handlePhotoFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setPhotoFiles(prev => [...prev, ...files]);
    }
  };

  const handleVideoFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setVideoFiles(prev => [...prev, ...files]);
    }
  };

  const removePhotoFile = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideoFile = (index: number) => {
    setVideoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 🔧 MỚI: Enhanced validation với thông báo chi tiết
    if (!form.progressDate) {
      AppToast.error('Vui lòng chọn ngày cập nhật');
      return;
    }
    if (form.outputQuantity <= 0) {
      AppToast.error('Sản lượng đầu ra phải lớn hơn 0');
      return;
    }
    if (!form.outputUnit) {
      AppToast.error('Vui lòng chọn đơn vị');
      return;
    }

    // 🔧 MỚI: Kiểm tra validation retry nếu là retry
    if (isRetry && retryValidation && !retryValidation.isValid) {
      AppToast.error(retryValidation.errorMessage || 'Khối lượng retry không hợp lệ');
      return;
    }

    // Kiểm tra xem có ít nhất một thông tin cần thiết không
    const hasParameter = form.parameterName && form.parameterValue;
    const hasPhotos = photoFiles.length > 0;
    const hasVideos = videoFiles.length > 0;
    
    if (!hasParameter && !hasPhotos && !hasVideos) {
      AppToast.error('Vui lòng nhập ít nhất một thông số kỹ thuật hoặc upload hình ảnh/video');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        stageId: failedStageInfo.stageId, // 🔧 MỚI: Thêm StageId từ failedStageInfo
        progressDate: form.progressDate,
        outputQuantity: form.outputQuantity,
        outputUnit: form.outputUnit,
        parameterName: form.parameterName || undefined,
        parameterValue: form.parameterValue || undefined,
        unit: form.unit || undefined,
        recordedAt: form.recordedAt || undefined,
        photoFiles: photoFiles.length > 0 ? photoFiles : undefined,
        videoFiles: videoFiles.length > 0 ? videoFiles : undefined,
      };

      console.log('🚀 Gửi payload:', payload);
      const response = await updateProgressAfterEvaluation(batchId, payload);
      
      // 🔧 MỚI: Hiển thị message từ backend thay vì message cố định
      const successMessage = response?.message || 'Cập nhật tiến trình thành công!';
      AppToast.success(successMessage);
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
      setRetryValidation(null);
    } catch (error: any) {
      console.error('Error updating progress after evaluation:', error);
      
      // 🔧 MỚI: Enhanced error handling với thông báo chi tiết
      let errorMessage = 'Có lỗi xảy ra khi cập nhật tiến trình';
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.errorCode) {
        // Xử lý các error code cụ thể
        const errorCode = error.response.data.errorCode;
        const errorParams = error.response.data.errorParameters || {};
        
        switch (errorCode) {
          case 'RetryQuantityExceedsFinalOutput':
            errorMessage = `Khối lượng retry (${errorParams.RetryQuantity} ${errorParams.RetryUnit}) vượt quá output cuối cùng trước retry (${errorParams.FinalOutput} ${errorParams.FinalOutputUnit})`;
            break;
          case 'WastePercentageTooHigh':
            errorMessage = `Tỷ lệ waste quá cao (${errorParams.WastePercentage?.toFixed(1)}% > ${errorParams.MaxWastePercentage}%). Vui lòng giảm khối lượng retry`;
            break;
          case 'InvalidWasteCalculation':
            errorMessage = `Tính toán waste không hợp lệ. Vui lòng kiểm tra lại khối lượng`;
            break;
          case 'OutputQuantityIncreaseTooHigh':
            errorMessage = `Khối lượng tăng quá cao (${errorParams.IncreasePercentage?.toFixed(1)}% > ${errorParams.MaxAllowed}%). ${errorParams.Suggestion || 'Vui lòng kiểm tra lại quy trình'}`;
            break;
          case 'OutputQuantityDecreaseTooHigh':
            errorMessage = `Khối lượng giảm quá nhiều (${errorParams.DecreasePercentage?.toFixed(1)}% > ${errorParams.MaxAllowed}%). ${errorParams.Suggestion || 'Vui lòng kiểm tra lại quy trình'}`;
            break;
          case 'OutputQuantityTooLow':
            errorMessage = `Khối lượng quá thấp (${errorParams.CurrentQuantity} < ${errorParams.MinRequired}). Vui lòng nhập khối lượng hợp lệ`;
            break;
          case 'OutputQuantityTooHigh':
            errorMessage = `Khối lượng quá cao (${errorParams.CurrentQuantity} > ${errorParams.MaxAllowed}). Vui lòng kiểm tra lại`;
            break;
          case 'StageNotInFailedList':
            errorMessage = `Giai đoạn này không nằm trong danh sách cần cập nhật. Vui lòng chọn giai đoạn khác`;
            break;
          case 'LastEvaluationNotFail':
            errorMessage = `Chỉ có thể cập nhật sau khi đánh giá không đạt. Trạng thái hiện tại: ${errorParams.CurrentResult}`;
            break;
          case 'CannotUpdateProgressBatchNotInProgress':
            errorMessage = `Chỉ có thể cập nhật khi batch đang trong quá trình xử lý. Trạng thái hiện tại: ${errorParams.CurrentStatus}`;
            break;
          case 'OutputQuantityExceedsCropProgress':
            errorMessage = `Khối lượng xử lý (${errorParams.OutputQuantity} ${errorParams.OutputUnit}) vượt quá khối lượng thu hoạch (${errorParams.CropQuantity} ${errorParams.CropUnit} - ngày ${errorParams.CropProgressDate}). Vui lòng kiểm tra lại.`;
            break;
          default:
            errorMessage = error.response.data.message || errorMessage;
            break;
        }
      }
      
      AppToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{t('componentsprocessing.updateAfterEvaluationForm.title')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-5 w-5" />
                {t('componentsprocessing.updateAfterEvaluationForm.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
          {/* Selected Stage Information */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <h4 className="font-medium text-yellow-800">Giai đoạn cần cập nhật</h4>
            </div>
            <p className="text-sm text-yellow-700 mb-3">
              Chọn các giai đoạn cần farmer cập nhật lại khi đánh giá không đạt
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-3 p-2 border border-yellow-300 rounded-lg bg-white">
                <div className="flex items-center justify-center w-5 h-5 bg-yellow-500 text-white rounded-full text-xs font-bold">
                  1
                </div>
                <span className="font-medium text-gray-900">{failedStageInfo.stageName}</span>
              </div>
            </div>
          </div>

          {/* 🔧 MỚI: Hiển thị thông tin batch trước retry */}
          {isRetry && retryValidation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium text-blue-800">Thông tin trước retry</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Output cuối cùng trước retry:</span>
                  <span className="font-medium ml-2">{retryValidation.finalOutputBeforeRetry} {retryValidation.finalOutputUnit}</span>
                </div>
                <div>
                  <span className="text-blue-700">Tỷ lệ waste tối đa:</span>
                  <span className="font-medium ml-2">{retryValidation.maxWastePercentage}%</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="progressDate">{t('componentsprocessing.updateAfterEvaluationForm.progressDate')}</Label>
              <Input
                id="progressDate"
                name="progressDate"
                type="date"
                value={form.progressDate}
                onChange={handleChange}
                className="border-orange-200 focus:border-orange-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="outputQuantity">{t('componentsprocessing.updateAfterEvaluationForm.outputQuantity')}</Label>
              <Input
                id="outputQuantity"
                name="outputQuantity"
                type="number"
                step="0.01"
                min="0.01"
                value={form.outputQuantity}
                onChange={handleChange}
                onKeyDown={(e) => {
                  // Cho phép backspace, delete, arrow keys, etc.
                  if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                    return;
                  }
                  // Cho phép số và dấu chấm
                  if (!/[\d.]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                placeholder="Nhập khối lượng..."
                className={`border-orange-200 focus:border-orange-400 ${
                  isRetry && retryValidation && !retryValidation.isValid ? 'border-red-500' : ''
                }`}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="outputUnit">{t('componentsprocessing.updateAfterEvaluationForm.outputUnit')}</Label>
            <Select value={form.outputUnit} onValueChange={(value) => setForm(prev => ({ ...prev, outputUnit: value }))}>
              <SelectTrigger className="border-orange-200 focus:border-orange-400">
                <SelectValue placeholder={t('componentsprocessing.updateAfterEvaluationForm.selectUnit')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">{t('componentsprocessing.updateAfterEvaluationForm.units.kg')}</SelectItem>
                <SelectItem value="g">{t('componentsprocessing.updateAfterEvaluationForm.units.g')}</SelectItem>
                <SelectItem value="ton">{t('componentsprocessing.updateAfterEvaluationForm.units.ton')}</SelectItem>
                <SelectItem value="quintal">{t('componentsprocessing.updateAfterEvaluationForm.units.quintal')}</SelectItem>
                <SelectItem value="yen">{t('componentsprocessing.updateAfterEvaluationForm.units.yen')}</SelectItem>
                <SelectItem value="lang">{t('componentsprocessing.updateAfterEvaluationForm.units.lang')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 🔧 MỚI: Hiển thị validation retry và waste calculation */}
          {isRetry && retryValidation && form.outputQuantity > 0 && (
            <div className={`border rounded-lg p-4 ${
              retryValidation.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                {retryValidation.isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <h4 className={`font-medium ${
                  retryValidation.isValid ? 'text-green-800' : 'text-red-800'
                }`}>
                  {retryValidation.isValid ? 'Validation hợp lệ' : 'Validation không hợp lệ'}
                </h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-700">Khối lượng retry:</span>
                  <span className="font-medium ml-2">{form.outputQuantity} {form.outputUnit}</span>
                </div>
                <div>
                  <span className="text-gray-700">Waste tính toán:</span>
                  <span className="font-medium ml-2">{retryValidation.calculatedWaste.toFixed(2)} kg</span>
                </div>
                <div>
                  <span className="text-gray-700">Tỷ lệ waste:</span>
                  <span className={`font-medium ml-2 ${
                    retryValidation.wastePercentage > retryValidation.maxWastePercentage ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {retryValidation.wastePercentage.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-700">Tỷ lệ tối đa:</span>
                  <span className="font-medium ml-2">{retryValidation.maxWastePercentage}%</span>
                </div>
              </div>
              
              {retryValidation.errorMessage && (
                <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                  {retryValidation.errorMessage}
                </div>
              )}
            </div>
          )}

          {/* 🔧 MỚI: Hiển thị thông tin validation khối lượng (chỉ khi là retry) */}
          {previousProgress && form.outputQuantity > 0 && isRetry && (
            <QuantityValidationInfo
              stageName={failedStageInfo.stageName}
              currentQuantity={form.outputQuantity}
              currentUnit={form.outputUnit}
              previousQuantity={previousProgress.quantity}
              previousUnit={previousProgress.unit}
              tolerance={0.25} // Default tolerance, có thể lấy từ API
            />
          )}

          {/* Thông số kỹ thuật */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">{t('componentsprocessing.updateAfterEvaluationForm.technicalParameters')}</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setParameters(prev => [...prev, {
                  parameterName: '',
                  parameterValue: '',
                  unit: '',
                  recordedAt: new Date().toISOString(),
                }])}
              >
                {t('componentsprocessing.updateAfterEvaluationForm.addParameter')}
              </Button>
            </div>
            
            {/* Single parameter */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parameterName">{t('componentsprocessing.updateAfterEvaluationForm.parameterName')}</Label>
                <Input
                  id="parameterName"
                  name="parameterName"
                  value={form.parameterName}
                  onChange={handleChange}
                                      placeholder={t('componentsprocessing.updateAfterEvaluationForm.parameterNamePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parameterValue">{t('componentsprocessing.updateAfterEvaluationForm.parameterValue')}</Label>
                <Input
                  id="parameterValue"
                  name="parameterValue"
                  value={form.parameterValue}
                  onChange={handleChange}
                                      placeholder={t('componentsprocessing.updateAfterEvaluationForm.parameterValuePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">{t('componentsprocessing.updateAfterEvaluationForm.unit')}</Label>
                <Input
                  id="unit"
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                                      placeholder={t('componentsprocessing.updateAfterEvaluationForm.unitPlaceholder')}
                />
              </div>
            </div>
            
            {/* Multiple parameters */}
            {parameters.map((param, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-gray-700">{t('componentsprocessing.updateAfterEvaluationForm.parameter')}</h5>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setParameters(prev => prev.filter((_, i) => i !== index))}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('componentsprocessing.updateAfterEvaluationForm.parameterName')}</Label>
                    <Input
                      value={param.parameterName}
                      onChange={(e) => setParameters(prev => prev.map((p, i) => 
                        i === index ? { ...p, parameterName: e.target.value } : p
                      ))}
                      placeholder={t('componentsprocessing.updateAfterEvaluationForm.parameterNamePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2"> 
                    <Label className="text-sm font-medium">{t('componentsprocessing.updateAfterEvaluationForm.parameterValue')}</Label>
                    <Input
                      value={param.parameterValue}
                      onChange={(e) => setParameters(prev => prev.map((p, i) => 
                        i === index ? { ...p, parameterValue: e.target.value } : p
                      ))}
                      placeholder={t('componentsprocessing.updateAfterEvaluationForm.parameterValuePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('componentsprocessing.updateAfterEvaluationForm.unit')}</Label>
                    <Input
                      value={param.unit}
                      onChange={(e) => setParameters(prev => prev.map((p, i) => 
                        i === index ? { ...p, unit: e.target.value } : p
                      ))}
                      placeholder={t('componentsprocessing.updateAfterEvaluationForm.unitPlaceholder')}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Upload hình ảnh */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">{t('componentsprocessing.updateAfterEvaluationForm.images')}</h4>
            <div className="space-y-2">
              <Label htmlFor="photoFiles">{t('componentsprocessing.updateAfterEvaluationForm.selectImages')}</Label>
              <Input
                id="photoFiles"
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoFilesChange}
                className="cursor-pointer"
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
            <h4 className="font-medium text-gray-900">{t('componentsprocessing.updateAfterEvaluationForm.videos')}</h4>
            <div className="space-y-2">
              <Label htmlFor="videoFiles">{t('componentsprocessing.updateAfterEvaluationForm.selectVideos')}</Label>
              <Input
                id="videoFiles"
                type="file"
                accept="video/*"
                multiple
                onChange={handleVideoFilesChange}
                className="cursor-pointer"
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
            >
              {t('componentsprocessing.updateAfterEvaluationForm.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading || (isRetry && retryValidation ? !retryValidation.isValid : false)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật sau đánh giá'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  </div>
</div>
);
}
