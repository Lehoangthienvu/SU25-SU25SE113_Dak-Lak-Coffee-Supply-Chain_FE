import { ValidationError, ProcessedError } from '../types/processing';

export class ValidationErrorHandler {
  static parseBackendError(message: string): ValidationError | null {
    try {
      // Backend trả về errorKey trực tiếp
      if (message && !message.includes('ERROR_KEY:')) {
        return {
          errorKey: message,
          parameters: {},
          timestamp: new Date().toISOString(),
          errorType: 'ValidationError'
        };
      }
      return null;
    } catch (error) {
      console.error('Error parsing backend error:', error);
      return null;
    }
  }

  static processError(error: ValidationError, t: any): ProcessedError {
    const errorKey = error.errorKey;
    console.log('🔍 Processing error with key:', errorKey);
    
    try {
      // Thử lấy translation từ processing.validation trước
      const validationMessage = t(`processing.validation.${errorKey}`, error.parameters);
      console.log('🔍 Trying processing.validation.${errorKey}:', validationMessage);
      
      if (validationMessage && validationMessage !== `processing.validation.${errorKey}`) {
        console.log('✅ Found in processing.validation');
        return {
          title: 'Validation Error',
          details: [validationMessage],
          severity: 'error',
          actionRequired: 'Please check and fix the errors above'
        };
      }

      // Thử lấy từ processing.waste.validation
      const wasteValidationMessage = t(`processing.waste.validation.${errorKey}`, error.parameters);
      console.log('🔍 Trying processing.waste.validation.${errorKey}:', wasteValidationMessage);
      
      if (wasteValidationMessage && wasteValidationMessage !== `processing.waste.validation.${errorKey}`) {
        console.log('✅ Found in processing.waste.validation');
        return {
          title: 'Validation Error',
          details: [wasteValidationMessage],
          severity: 'error',
          actionRequired: 'Please check and fix the errors above'
        };
      }

      // Fallback: thử lấy từ errors namespace
      const title = t(`errors.${errorKey}.title`, error.parameters);
      const details = t(`errors.${errorKey}.details`, { returnObjects: true }) as string[];
      const action = t(`errors.${errorKey}.action`, error.parameters);
      console.log('🔍 Trying errors.${errorKey}:', { title, details, action });

      // Kiểm tra nếu tìm thấy translation trong errors namespace
      if (title && title !== `errors.${errorKey}.title`) {
        console.log('✅ Found in errors namespace');
        return {
          title,
          details: Array.isArray(details) ? details : [details || 'Unknown error'],
          severity: 'error',
          actionRequired: action
        };
      }

      // Fallback cuối cùng: hiển thị error key trực tiếp
      console.log('❌ No translation found, using fallback');
      return {
        title: `Validation Error: ${errorKey}`,
        details: ['Please check the information and try again'],
        severity: 'error',
        actionRequired: 'Contact technical support if the problem persists'
      };
    } catch (e) {
      // Fallback nếu không tìm thấy translation
      console.log('❌ Exception in processError:', e);
      return {
        title: `Error: ${errorKey}`,
        details: ['Please check information again'],
        severity: 'error',
        actionRequired: 'Contact technical support'
      };
    }
  }

  static handleSystemError(error: any): ProcessedError {
    return {
      title: 'System Error',
      details: [
        'An unexpected error occurred',
        'Please check network connection and try again',
        'If the problem persists, contact technical support'
      ],
      severity: 'error',
      actionRequired: 'Try again or contact support'
    };
  }

  // 🔧 HELPER: Xử lý error message từ backend response
  static handleBackendError(response: any, t: any): ProcessedError {
    console.log('🔍 Debug - Backend Error Response:', response);
    
    try {
      // NEW: Kiểm tra nếu response có ErrorType = "FieldValidationError"
      if (response?.data?.ErrorType === "FieldValidationError") {
        console.log('🔍 Found FieldValidationError:', response.data);
        const error: ValidationError = {
          errorKey: response.data.ErrorKey,
          parameters: response.data.Parameters || {},
          timestamp: new Date().toISOString(),
          errorType: 'FieldValidationError',
          fieldName: response.data.FieldName // Thêm field name
        };
        return this.processError(error, t);
      }

      // NEW: Kiểm tra nếu response có FieldName (field-specific error)
      if (response?.data?.FieldName) {
        console.log('🔍 Found field-specific error:', response.data);
        const error: ValidationError = {
          errorKey: response.data.ErrorKey || response.message,
          parameters: response.data.Parameters || {},
          timestamp: new Date().toISOString(),
          errorType: 'FieldValidationError',
          fieldName: response.data.FieldName
        };
        return this.processError(error, t);
      }

      // Kiểm tra nếu response là raw string error key
      if (typeof response === 'string' && response.length > 0) {
        console.log('🔍 Found raw string error key:', response);
        const error: ValidationError = {
          errorKey: response,
          parameters: {},
          timestamp: new Date().toISOString(),
          errorType: 'ValidationError'
        };
        return this.processError(error, t);
      }

      // Kiểm tra nếu response có errorKey
      if (response?.data?.ErrorKey) {
        console.log('🔍 Found ErrorKey in response.data:', response.data.ErrorKey);
        const error: ValidationError = {
          errorKey: response.data.ErrorKey,
          parameters: response.data.Parameters || {},
          timestamp: new Date().toISOString(),
          errorType: 'ValidationError'
        };
        return this.processError(error, t);
      }

      // Kiểm tra nếu response có message chứa errorKey
      if (response?.message && typeof response.message === 'string') {
        console.log('🔍 Found message in response:', response.message);
        const error: ValidationError = {
          errorKey: response.message,
          parameters: {},
          timestamp: new Date().toISOString(),
          errorType: 'ValidationError'
        };
        return this.processError(error, t);
      }

      // Kiểm tra nếu response có cấu trúc lỗi khác
      if (response?.errorKey) {
        console.log('🔍 Found errorKey in response:', response.errorKey);
        const error: ValidationError = {
          errorKey: response.errorKey,
          parameters: response.parameters || {},
          timestamp: new Date().toISOString(),
          errorType: 'ValidationError'
        };
        return this.processError(error, t);
      }

      // Fallback cho các lỗi không có cấu trúc ErrorKey
      const errorMessage = response?.message || response?.data?.message || 'An unknown error occurred.';
      return {
        title: 'Error',
        details: [errorMessage],
        severity: 'error',
        actionRequired: 'Please try again or contact support.'
      };
    } catch (e) {
      console.error('Error processing backend error response:', e);
      return {
        title: 'Error',
        details: ['An unexpected error occurred while processing the error message.'],
        severity: 'error',
        actionRequired: 'Please try again or contact support.'
      };
    }
  }

  // 🔧 HELPER: Tạo error message với parameters
  static createErrorMessage(errorKey: string, parameters: Record<string, any>, t: any): string {
    try {
      // Thử lấy từ processing.validation trước
      const message = t(`processing.validation.${errorKey}`, parameters);
      if (message && message !== `processing.validation.${errorKey}`) {
        return message;
      }

      // Thử lấy từ processing.waste.validation
      const wasteMessage = t(`processing.waste.validation.${errorKey}`, parameters);
      if (wasteMessage && wasteMessage !== `processing.waste.validation.${errorKey}`) {
        return wasteMessage;
      }

      return `Error: ${errorKey}`;
    } catch (e) {
      return `Error: ${errorKey}`;
    }
  }
}
