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
    
    try {
      const title = t(`errors.${errorKey}.title`, error.parameters);
      const details = t(`errors.${errorKey}.details`, { returnObjects: true }) as string[];
      const action = t(`errors.${errorKey}.action`, error.parameters);

      return {
        title,
        details,
        severity: 'error',
        actionRequired: action
      };
    } catch (e) {
      // Fallback nếu không tìm thấy translation
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
}
