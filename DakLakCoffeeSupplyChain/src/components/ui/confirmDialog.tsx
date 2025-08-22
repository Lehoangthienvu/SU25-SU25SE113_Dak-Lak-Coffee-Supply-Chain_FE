import * as Dialog from "@radix-ui/react-dialog";
import { ReactNode } from "react";
import { Button } from "./button";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string | ReactNode;
  description: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  loading?: boolean;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Overlay className="fixed inset-0 bg-black/20 z-50" />
      <Dialog.Content className="fixed p-6 bg-white rounded-lg border border-orange-100 shadow-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md z-60">
        {typeof title === "string" ? (
          <Dialog.Title className="text-lg font-semibold text-gray-800 mb-3 text-center">
            {title}
          </Dialog.Title>
        ) : (
          <Dialog.Title asChild>
            <div className="text-lg font-semibold text-gray-800 mb-3 text-center">
              {title}
            </div>
          </Dialog.Title>
        )}
        {typeof description === "string" ? (
          <Dialog.Description className="mb-6 text-gray-600 text-sm text-center">
            {description}
          </Dialog.Description>
        ) : (
          <Dialog.Description asChild>
            <div className="mb-6 text-gray-600 text-sm text-center">
              {description}
            </div>
          </Dialog.Description>
        )}

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : confirmText}
          </Button>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}
