import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from '@/components/shared/Alert';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { ValidationErrorHandler } from '@/utils/errorHandler';
import { ProcessedError } from '@/types/processing';

interface ProcessingErrorDisplayProps {
  error?: any;
  errorKey?: string;
  parameters?: Record<string, any>;
  className?: string;
}

export const ProcessingErrorDisplay: React.FC<ProcessingErrorDisplayProps> = ({
  error,
  errorKey,
  parameters = {},
  className = ''
}) => {
  const { t } = useTranslation();

  // Xử lý error từ backend response
  const processedError: ProcessedError = error 
    ? ValidationErrorHandler.handleBackendError(error, t)
    : errorKey 
      ? ValidationErrorHandler.processError({
          errorKey,
          parameters,
          timestamp: new Date().toISOString(),
          errorType: 'ValidationError'
        }, t)
      : {
          title: 'No Error',
          details: [],
          severity: 'info',
          actionRequired: ''
        };

  // NEW: Kiểm tra nếu là FieldValidationError, không hiển thị ở đây
  if (error?.data?.ErrorType === "FieldValidationError" || error?.data?.FieldName) {
    console.log('🔍 FieldValidationError detected, not displaying in ProcessingErrorDisplay');
    return null; // Không hiển thị ở đây, sẽ hiển thị dưới field cụ thể
  }

  // Đảm bảo details luôn là array
  const safeDetails = Array.isArray(processedError.details) ? processedError.details : [];

  if (!processedError || processedError.severity === 'info') {
    return null;
  }

  const getIcon = () => {
    switch (processedError.severity) {
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getVariant = () => {
    switch (processedError.severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Alert variant={getVariant()} className={className}>
      {getIcon()}
      <AlertTitle>{processedError.title}</AlertTitle>
      {safeDetails.length > 0 && (
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1">
            {safeDetails.map((detail, index) => (
              <li key={index}>{detail}</li>
            ))}
          </ul>
          {processedError.actionRequired && (
            <p className="mt-2 font-medium">{processedError.actionRequired}</p>
          )}
        </AlertDescription>
      )}
      {safeDetails.length === 0 && (
        <AlertDescription>
          {error?.message && (
            <p className="mb-2">{error.message}</p>
          )}
          {processedError.actionRequired && (
            <p className="font-medium">{processedError.actionRequired}</p>
          )}
        </AlertDescription>
      )}
    </Alert>
  );
};

// 🔧 HELPER: Component để hiển thị validation error cụ thể
export const ValidationErrorDisplay: React.FC<{
  errorKey: string;
  parameters?: Record<string, any>;
  className?: string;
}> = ({ errorKey, parameters = {}, className = '' }) => {
  const { t } = useTranslation();

  const errorMessage = ValidationErrorHandler.createErrorMessage(errorKey, parameters, t);

  if (!errorMessage || errorMessage === `Error: ${errorKey}`) {
    return null;
  }

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{errorMessage}</AlertDescription>
    </Alert>
  );
};

// 🔧 HELPER: Component để hiển thị field-specific validation error
export const FieldValidationError: React.FC<{
  error: any;
  fieldName: string;
  className?: string;
}> = ({ error, fieldName, className = '' }) => {
  const { t } = useTranslation();

  if (!error) return null;

  // NEW: Kiểm tra nếu error có FieldName và khớp với fieldName được truyền vào
  if (error?.data?.FieldName === fieldName || error?.data?.FieldName?.toLowerCase() === fieldName.toLowerCase()) {
    console.log('🔍 FieldValidationError matched for field:', fieldName);
    const errorMessage = error?.message || error?.data?.ErrorKey || 'Validation error';
    
    return (
      <div className={`text-red-500 text-sm mt-1 ${className}`}>
        {errorMessage}
      </div>
    );
  }

  // NEW: Kiểm tra nếu error có ErrorType = "FieldValidationError" và FieldName khớp
  if (error?.data?.ErrorType === "FieldValidationError" && 
      (error?.data?.FieldName === fieldName || error?.data?.FieldName?.toLowerCase() === fieldName.toLowerCase())) {
    console.log('🔍 FieldValidationError with ErrorType matched for field:', fieldName);
    const errorMessage = error?.message || error?.data?.ErrorKey || 'Validation error';
    
    return (
      <div className={`text-red-500 text-sm mt-1 ${className}`}>
        {errorMessage}
      </div>
    );
  }

  // Mapping error keys với field names (fallback)
  const fieldErrorMapping: Record<string, string[]> = {
    'outputQuantity': [
      'OutputQuantityMustBePositive',
      'OutputQuantityExceedsInputQuantity', 
      'OutputQuantityTooLarge',
      'OutputQuantityIncreaseTooHigh',
      'OutputQuantityDecreaseTooHigh',
      'InvalidOutputQuantityEqual',
      'InvalidOutputQuantityIncrease',
      'OutputQuantityMustBePositiveForFailedStage',
      'OutputQuantityIncreaseTooHighForFailedStage',
      'OutputQuantityDecreaseTooHighForFailedStage',
             'OutputQuantityExceedsPrevious',
       'OutputQuantityExceedsInput',
       'OutputQuantity',
       'OutputQuantityEqualNotAllowed'
    ],
    'progressDate': [
      'ProgressDateInFuture',
      'ProgressDateTooPast',
      'FirstProgressDateAfterHarvest',
      'ProgressDateAfterPrevious',
      'ProgressDate'
    ],
         'wasteQuantity': [
       'WasteQuantityExceedsAllowed',
       'WasteQuantityMustBePositive',
       'WasteQuantityTooLarge',
       'WasteQuantityExceedsBatchLimit',
       'WasteRequiredForEqualOutput'
     ],
    'batchId': [
      'BatchNotFound',
      'BatchNotInProgressableState',
      'NoPermissionToAccessBatch'
    ],
    'stageId': [
      'StageNotFound',
      'InvalidStageForNextStep',
      'NextStageNotFound'
    ],
    'methodId': [
      'MethodNotFound',
      'NoStagesForMethod'
    ]
  };

  // Kiểm tra nếu error có ErrorKey và fieldName có trong mapping
  const errorKey = error?.data?.ErrorKey || error?.ErrorKey || error;
  const fieldErrors = fieldErrorMapping[fieldName] || [];
  
  if (errorKey && fieldErrors.includes(errorKey)) {
    const errorMessage = ValidationErrorHandler.createErrorMessage(errorKey, error?.data?.Parameters || {}, t);
    
    if (errorMessage && errorMessage !== `Error: ${errorKey}`) {
      return (
        <div className={`text-red-500 text-sm mt-1 ${className}`}>
          {errorMessage}
        </div>
      );
    }
  }

  // Fallback: kiểm tra nội dung error message
  const processedError: ProcessedError = ValidationErrorHandler.handleBackendError(error, t);
  
  // Kiểm tra xem error có liên quan đến field này không
  const fieldKeywords: Record<string, string[]> = {
    'outputQuantity': ['output quantity', 'khối lượng đầu ra', 'output', 'đầu ra'],
    'progressDate': ['progress date', 'ngày tiến trình', 'ngày ghi nhận', 'date', 'ngày'],
    'wasteQuantity': ['waste', 'phế phẩm', 'waste quantity', 'khối lượng phế phẩm'],
    'batchId': ['batch', 'lô', 'batch id'],
    'stageId': ['stage', 'công đoạn', 'stage id'],
    'methodId': ['method', 'phương pháp', 'method id']
  };

  const keywords = fieldKeywords[fieldName] || [];
  const isFieldError = processedError.details.some(detail => 
    keywords.some(keyword => detail.toLowerCase().includes(keyword.toLowerCase()))
  );

  if (!isFieldError) return null;

  return (
    <div className={`text-red-500 text-sm mt-1 ${className}`}>
      {processedError.details[0]}
    </div>
  );
};

// 🔧 HELPER: Hook để xử lý error từ API response
export const useProcessingError = () => {
  const { t } = useTranslation();

  const handleError = (response: any): ProcessedError => {
    return ValidationErrorHandler.handleBackendError(response, t);
  };

  const createError = (errorKey: string, parameters: Record<string, any> = {}): string => {
    return ValidationErrorHandler.createErrorMessage(errorKey, parameters, t);
  };

  return {
    handleError,
    createError
  };
};
