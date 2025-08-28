"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
}

export default function UpdateAfterEvaluationForm({
  batchId,
  failedStageInfo,
  isOpen,
  onClose,
  onSuccess
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
    
    if (form.outputQuantity <= 0) {
      // AppToast.error('Vui lòng nhập khối lượng đầu ra hợp lệ');
      return;
    }

    setLoading(true);
    try {
      // Tạo parameters array từ form và parameters state
      const allParameters = [];
      
      // Thêm single parameter nếu có
      if (form.parameterName && form.parameterValue) {
        allParameters.push({
          parameterName: form.parameterName,
          parameterValue: form.parameterValue,
          unit: form.unit,
          recordedAt: form.recordedAt,
        });
      }
      
      // Thêm multiple parameters
      allParameters.push(...parameters);
      
      const payload = {
        ...form,
        parametersJson: allParameters.length > 0 ? JSON.stringify(allParameters) : undefined,
        photoFiles,
        videoFiles,
      };

      // await updateProgressAfterEvaluation(batchId, payload);
      
      // AppToast.success('Cập nhật tiến trình thành công!');
      // Reset form
      
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
      console.error('Error updating progress after evaluation:', error);
      // AppToast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật tiến trình');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            {t('updateAfterEvaluation.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white/70 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-blue-800">{t('updateAfterEvaluation.instruction')}</h4>
            </div>
            <p className="text-sm text-blue-700">
              {t('updateAfterEvaluation.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="progressDate">{t('updateAfterEvaluation.progressDate')}</Label>
              <Input
                id="progressDate"
                type="date"
                value={form.progressDate}
                onChange={handleChange}
                className="border-orange-200 focus:border-orange-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="outputQuantity">{t('updateAfterEvaluation.outputQuantity')}</Label>
              <Input
                id="outputQuantity"
                type="number"
                step="0.01"
                min="0.01"
                max="100000"
                value={form.outputQuantity}
                onChange={handleChange}
                placeholder={t('updateAfterEvaluation.quantityPlaceholder')}
                className="border-orange-200 focus:border-orange-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="outputUnit">{t('updateAfterEvaluation.outputUnit')}</Label>
            <Select value={form.outputUnit} onValueChange={(value) => setForm(prev => ({ ...prev, outputUnit: value }))}>
              <SelectTrigger className="border-orange-200 focus:border-orange-400">
                <SelectValue placeholder={t('updateAfterEvaluation.selectUnit')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">{t('updateAfterEvaluation.units.kg')}</SelectItem>
                <SelectItem value="g">{t('updateAfterEvaluation.units.g')}</SelectItem>
                <SelectItem value="ton">{t('updateAfterEvaluation.units.ton')}</SelectItem>
                <SelectItem value="quintal">{t('updateAfterEvaluation.units.quintal')}</SelectItem>
                <SelectItem value="yen">{t('updateAfterEvaluation.units.yen')}</SelectItem>
                <SelectItem value="lang">{t('updateAfterEvaluation.units.lang')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Thông số kỹ thuật */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">{t('updateAfterEvaluation.technicalParameters')}</h4>
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
                {t('updateAfterEvaluation.addParameter')}
              </Button>
            </div>
            
            {/* Single parameter */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parameterName">{t('updateAfterEvaluation.parameterName')}</Label>
                <Input
                  id="parameterName"
                  name="parameterName"
                  value={form.parameterName}
                  onChange={handleChange}
                  placeholder={t('updateAfterEvaluation.parameterNamePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parameterValue">{t('updateAfterEvaluation.parameterValue')}</Label>
                <Input
                  id="parameterValue"
                  name="parameterValue"
                  value={form.parameterValue}
                  onChange={handleChange}
                  placeholder={t('updateAfterEvaluation.parameterValuePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">{t('updateAfterEvaluation.unit')}</Label>
                <Input
                  id="unit"
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  placeholder={t('updateAfterEvaluation.unitPlaceholder')}
                />
              </div>
            </div>
            
            {/* Multiple parameters */}
            {parameters.map((param, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-gray-700">{t('updateAfterEvaluation.parameter')}</h5>
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
                    <Label className="text-sm font-medium">{t('updateAfterEvaluation.parameterName')}</Label>
                    <Input
                      value={param.parameterName}
                      onChange={(e) => setParameters(prev => prev.map((p, i) => 
                        i === index ? { ...p, parameterName: e.target.value } : p
                      ))}
                      placeholder={t('updateAfterEvaluation.parameterNamePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('updateAfterEvaluation.parameterValue')}</Label>
                    <Input
                      value={param.parameterValue}
                      onChange={(e) => setParameters(prev => prev.map((p, i) => 
                        i === index ? { ...p, parameterValue: e.target.value } : p
                      ))}
                      placeholder={t('updateAfterEvaluation.parameterValuePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('updateAfterEvaluation.unit')}</Label>
                    <Input
                      value={param.unit}
                      onChange={(e) => setParameters(prev => prev.map((p, i) => 
                        i === index ? { ...p, unit: e.target.value } : p
                      ))}
                      placeholder={t('updateAfterEvaluation.unitPlaceholder')}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Upload hình ảnh */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">{t('updateAfterEvaluation.images')}</h4>
            <div className="space-y-2">
              <Label htmlFor="photoFiles">{t('updateAfterEvaluation.selectImages')}</Label>
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
            <h4 className="font-medium text-gray-900">{t('updateAfterEvaluation.videos')}</h4>
            <div className="space-y-2">
              <Label htmlFor="videoFiles">{t('updateAfterEvaluation.selectVideos')}</Label>
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
             >
               {t('updateAfterEvaluation.cancel')}
             </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? t('updateAfterEvaluation.updating') : t('updateAfterEvaluation.updateProgress')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
