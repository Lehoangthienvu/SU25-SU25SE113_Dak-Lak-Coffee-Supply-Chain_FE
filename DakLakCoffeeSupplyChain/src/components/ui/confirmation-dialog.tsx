'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  type = 'warning'
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
          title: 'text-red-600'
        };
      case 'info':
        return {
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-100',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
          title: 'text-blue-600'
        };
      default: // warning
        return {
          iconColor: 'text-amber-600',
          iconBg: 'bg-amber-100',
          confirmButton: 'bg-amber-600 hover:bg-amber-700 text-white',
          title: 'text-amber-600'
        };
    }
  };

  const config = getTypeConfig();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-sm bg-white/30 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 transform transition-all">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className={`w-12 h-12 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <AlertTriangle className={`w-6 h-6 ${config.iconColor}`} />
        </div>

        {/* Content */}
        <div className="text-center">
          <h3 className={`text-lg font-semibold ${config.title} mb-2`}>
            {title}
          </h3>
          <p className="text-gray-600 mb-6">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-4 py-2 min-w-[80px]"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            className={`px-4 py-2 min-w-[80px] ${config.confirmButton}`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Hook để sử dụng confirmation dialog dễ dàng hơn
export function useConfirmationDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'danger' | 'info';
  }>({
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const openDialog = (newConfig: typeof config) => {
    setConfig(newConfig);
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
  };

  const ConfirmationDialogComponent = () => (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={closeDialog}
      onConfirm={config.onConfirm}
      title={config.title}
      message={config.message}
      confirmText={config.confirmText}
      cancelText={config.cancelText}
      type={config.type}
    />
  );

  return {
    openDialog,
    closeDialog,
    ConfirmationDialog: ConfirmationDialogComponent
  };
}
