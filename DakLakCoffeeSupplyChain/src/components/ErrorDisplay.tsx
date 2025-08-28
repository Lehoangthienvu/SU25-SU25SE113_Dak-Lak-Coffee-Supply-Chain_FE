import React from 'react';
import { ProcessedError } from '@/types/processing';

interface ErrorDisplayProps {
  error: ProcessedError;
  onClose: () => void;
}

export function ErrorDisplay({ error, onClose }: ErrorDisplayProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return (
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-7.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`max-w-2xl w-full ${getSeverityColor(error.severity)} rounded-xl border-2 p-6 shadow-2xl`}>
        <div className="flex items-start gap-4">
          {getSeverityIcon(error.severity)}
          
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-4">{error.title}</h3>
            
            <div className="space-y-3 mb-6">
              {error.details.map((detail, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-sm">•</span>
                  <span className="text-sm leading-relaxed">{detail}</span>
                </div>
              ))}
            </div>

            <div className="bg-white/50 p-4 rounded-lg border border-current/20 mb-6">
              <h4 className="font-semibold mb-2">Hành động cần thiết:</h4>
              <p className="text-sm">{error.actionRequired}</p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sửa lỗi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
