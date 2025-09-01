import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProcessingErrorDisplay, ValidationErrorDisplay, useProcessingError } from './ProcessingErrorDisplay';

// 🔧 VÍ DỤ: Component form processing với error handling
export const ProcessingFormExample: React.FC = () => {
  const { t } = useTranslation();
  const { handleError, createError } = useProcessingError();
  
  const [formData, setFormData] = useState({
    outputQuantity: '',
    outputUnit: 'kg',
    wasteType: '',
    wasteQuantity: '',
    wasteUnit: 'kg'
  });

  const [errors, setErrors] = useState<{
    outputQuantity?: string;
    wasteQuantity?: string;
    apiError?: any;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔧 VÍ DỤ: Validation client-side
  const validateForm = () => {
    const newErrors: typeof errors = {};

    // Kiểm tra khối lượng đầu ra
    if (!formData.outputQuantity || parseFloat(formData.outputQuantity) <= 0) {
      newErrors.outputQuantity = createError('outputQuantityMustBePositive');
    }

    // Kiểm tra waste quantity
    if (formData.wasteType && (!formData.wasteQuantity || parseFloat(formData.wasteQuantity) <= 0)) {
      newErrors.wasteQuantity = createError('wasteTypeRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🔧 VÍ DỤ: Xử lý submit với error handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Giả lập API call
      const response = await simulateApiCall();
      
      if (response.status !== 'SUCCESS') {
        // Xử lý error từ backend
        const processedError = handleError(response);
        setErrors({ apiError: processedError });
      } else {
        // Success
        console.log('Success:', response);
      }
    } catch (error) {
      setErrors({ apiError: error });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔧 VÍ DỤ: Giả lập API call với error
  const simulateApiCall = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Giả lập error từ backend
    if (parseFloat(formData.outputQuantity) > 1000) {
      return {
        status: 'ERROR',
        message: 'outputQuantityExceedsInputQuantity',
        data: {
          ErrorKey: 'outputQuantityExceedsInputQuantity',
          Parameters: {
            currentQuantity: parseFloat(formData.outputQuantity),
            currentUnit: formData.outputUnit,
            inputQuantity: 1000,
            inputUnit: 'kg'
          }
        }
      };
    }

    if (formData.wasteType && parseFloat(formData.wasteQuantity) > 500) {
      return {
        status: 'ERROR',
        message: 'wasteQuantityExceedsBatchLimit',
        data: {
          ErrorKey: 'wasteQuantityExceedsBatchLimit',
          Parameters: {
            totalWaste: parseFloat(formData.wasteQuantity),
            maxAllowed: 500,
            batchInputQuantity: 1000,
            batchInputUnit: 'kg',
            currentOutputQuantity: parseFloat(formData.outputQuantity),
            currentOutputUnit: formData.outputUnit
          }
        }
      };
    }

    return { status: 'SUCCESS', message: 'Processing completed successfully' };
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t('processing.progress.create')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 🔧 VÍ DỤ: Hiển thị API error */}
          {errors.apiError && (
            <ProcessingErrorDisplay 
              error={errors.apiError} 
              className="mb-4"
            />
          )}

          {/* Output Quantity */}
          <div className="space-y-2">
            <Label htmlFor="outputQuantity">
              {t('processing.progress.outputQuantity')}
            </Label>
            <Input
              id="outputQuantity"
              type="number"
              step="0.01"
              value={formData.outputQuantity}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                outputQuantity: e.target.value 
              }))}
              placeholder={t('processing.progress.placeholder.outputQuantity')}
            />
            {/* 🔧 VÍ DỤ: Hiển thị field error */}
            {errors.outputQuantity && (
              <ValidationErrorDisplay 
                errorKey="outputQuantityMustBePositive"
                className="mt-2"
              />
            )}
          </div>

          {/* Output Unit */}
          <div className="space-y-2">
            <Label htmlFor="outputUnit">{t('processing.progress.outputUnit')}</Label>
            <select
              id="outputUnit"
              value={formData.outputUnit}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                outputUnit: e.target.value 
              }))}
              className="w-full p-2 border rounded-md"
            >
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="tấn">tấn</option>
            </select>
          </div>

          {/* Waste Type */}
          <div className="space-y-2">
            <Label htmlFor="wasteType">{t('processing.waste.wasteType')}</Label>
            <Input
              id="wasteType"
              value={formData.wasteType}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                wasteType: e.target.value 
              }))}
              placeholder={t('processing.waste.placeholder.wasteType')}
            />
          </div>

          {/* Waste Quantity */}
          <div className="space-y-2">
            <Label htmlFor="wasteQuantity">{t('processing.waste.quantity')}</Label>
            <Input
              id="wasteQuantity"
              type="number"
              step="0.01"
              value={formData.wasteQuantity}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                wasteQuantity: e.target.value 
              }))}
              placeholder={t('processing.waste.placeholder.quantity')}
            />
            {/* 🔧 VÍ DỤ: Hiển thị field error với parameters */}
            {errors.wasteQuantity && (
              <ValidationErrorDisplay 
                errorKey="wasteTypeRequired"
                className="mt-2"
              />
            )}
          </div>

          {/* 🔧 VÍ DỤ: Hiển thị error với parameters */}
          <ValidationErrorDisplay 
            errorKey="outputQuantityExceedsInputQuantity"
            parameters={{
              currentQuantity: 1500,
              currentUnit: 'kg',
              inputQuantity: 1000,
              inputUnit: 'kg'
            }}
            className="mt-4"
          />

          <div className="flex gap-4">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? t('processing.progress.loading') : t('processing.progress.submit')}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setFormData({
                outputQuantity: '',
                outputUnit: 'kg',
                wasteType: '',
                wasteQuantity: '',
                wasteUnit: 'kg'
              })}
            >
              {t('processing.progress.cancel')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
