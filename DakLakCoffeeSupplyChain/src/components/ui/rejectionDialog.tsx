import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { Button } from "./button";
import { useTranslation } from "react-i18next";

type RejectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (reason: string) => void;
  loading?: boolean;
};

export function RejectionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Từ chối",
  cancelText = "Hủy",
  onConfirm,
  loading = false,
}: RejectionDialogProps) {
  // State để lưu lý do từ chối
  const [reason, setReason] = useState("");
  const { t } = useTranslation();

  // Clear reason khi mở hoặc đóng dialog
  const handleOpenChange = (openState: boolean) => {
    if (!openState) {
      setReason("");
    }
    onOpenChange(openState);
  };

  // Xử lý khi nhấn nút xác nhận
  const handleConfirm = () => {
    onConfirm(reason);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
      <Dialog.Content className="fixed p-6 bg-white rounded shadow-md top-1/2 left-1/2 
        -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md z-60">
        <Dialog.Title className="text-lg font-medium mb-4">{title}</Dialog.Title>
        <Dialog.Description className="mb-4">{description}</Dialog.Description>

        <textarea
          className="w-full border border-gray-300 rounded p-2 mb-6 resize-none"
          rows={4}
          placeholder={t('common.components.rejectDialog.placeholder')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={loading}
        />

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={handleConfirm}
            disabled={loading || reason.trim() === ""}
          >
            {loading ? t('common.components.rejectDialog.loadingButton') : confirmText}
          </Button>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}
