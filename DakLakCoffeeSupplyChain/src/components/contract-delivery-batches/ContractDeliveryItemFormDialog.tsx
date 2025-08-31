"use client";

import { useEffect, useState } from "react";
import {
  createContractDeliveryItem,
  updateContractDeliveryItem,
  ContractDeliveryItemCreateDto,
  ContractDeliveryItemUpdateDto,
} from "@/lib/api/contractDeliveryItems";
import * as BaseDialog from "@/components/ui/dialog";
import { FormDialog } from "@/components/ui/formDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ContractItemViewDto } from "@/lib/api/contractItems";
import { toast } from "sonner";
import axios from "axios";
import { useTranslation } from "react-i18next";

interface ContractDeliveryItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  deliveryBatchId: string;
  contractItems: ContractItemViewDto[];
  initialData?: ContractDeliveryItemUpdateDto;
  onSuccess?: () => void;
  batchTotalQuantity?: number; // Thêm prop để nhận khối lượng tổng của batch
}

export default function ContractDeliveryItemFormDialog({
  open,
  onOpenChange,
  mode,
  deliveryBatchId,
  contractItems,
  initialData,
  onSuccess,
  batchTotalQuantity,
}: ContractDeliveryItemFormDialogProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<
    ContractDeliveryItemCreateDto | ContractDeliveryItemUpdateDto
  >({
    deliveryBatchId,
    contractItemId: "",
    plannedQuantity: 0,
    note: "",
    ...(mode === "edit" && { fulfilledQuantity: 0 }),
  } as any);

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [businessErrors, setBusinessErrors] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      // Clear errors khi mở dialog
      setFieldErrors({});
      setBusinessErrors([]);

      if (mode === "edit" && initialData) {
        setFormData({ ...initialData });
      } else {
        setFormData({
          deliveryBatchId,
          contractItemId: "",
          plannedQuantity: 0,
          note: "",
          ...(mode === "edit" && { fulfilledQuantity: 0 }),
        } as any);
      }
    }
  }, [open, JSON.stringify(initialData)]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "plannedQuantity" || name === "fulfilledQuantity"
          ? Number(value)
          : value,
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Clear business errors when user makes changes
    if (businessErrors.length > 0) {
      setBusinessErrors([]);
    }

    // Client-side validation ngay khi user nhập
    validateField(name, value);

    // Nếu thay đổi plannedQuantity, cần validate lại fulfilledQuantity
    if (
      name === "plannedQuantity" &&
      mode === "edit" &&
      (formData as any).fulfilledQuantity !== undefined
    ) {
      const currentFulfilledQuantity = (formData as any).fulfilledQuantity;
      if (currentFulfilledQuantity > Number(value)) {
        // Nếu fulfilledQuantity > plannedQuantity mới, hiển thị lỗi
        setFieldErrors((prev) => ({
          ...prev,
          fulfilledQuantity: t("contractDeliveryBatches.itemFormDialog.validation.fulfilledQuantityNotExceedPlanned"),
        }));
      } else {
        // Nếu hợp lệ, xóa lỗi
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.fulfilledQuantity;
          return newErrors;
        });
      }
    }
  };

  // Client-side validation cho từng field
  const validateField = (fieldName: string, value: any) => {
    const newErrors = { ...fieldErrors };

    switch (fieldName) {
      case "contractItemId":
        if (!value || value === "") {
          newErrors[fieldName] = t("contractDeliveryBatches.itemFormDialog.validation.selectCoffeeType");
        } else {
          delete newErrors[fieldName];
        }
        break;

      case "plannedQuantity":
        const plannedQuantity = Number(value);
        if (!value || value === "" || isNaN(plannedQuantity)) {
          newErrors[fieldName] = t("contractDeliveryBatches.itemFormDialog.validation.plannedQuantityRequired");
        } else if (plannedQuantity <= 0) {
          newErrors[fieldName] = t("contractDeliveryBatches.itemFormDialog.validation.plannedQuantityGreaterThanZero");
        } else if (batchTotalQuantity && plannedQuantity > batchTotalQuantity) {
          newErrors[
            fieldName
          ] = `${t("contractDeliveryBatches.itemFormDialog.validation.plannedQuantityExceedLimit")} (${batchTotalQuantity} ${t("contractDeliveryBatches.itemFormDialog.labels.kg")})`;
        } else {
          delete newErrors[fieldName];
        }
        break;

      case "fulfilledQuantity":
        // Chỉ validate fulfilledQuantity khi ở mode edit
        if (mode === "edit" && value !== "" && !isNaN(Number(value))) {
          const fulfilledQuantity = Number(value);
          if (fulfilledQuantity < 0) {
            newErrors[fieldName] = t("contractDeliveryBatches.itemFormDialog.validation.fulfilledQuantityNotNegative");
          } else if (fulfilledQuantity > (formData.plannedQuantity || 0)) {
            newErrors[fieldName] = t("contractDeliveryBatches.itemFormDialog.validation.fulfilledQuantityNotExceedPlanned");
          } else {
            delete newErrors[fieldName];
          }
        } else {
          delete newErrors[fieldName];
        }
        break;

      case "note":
        if (value && value.length > 1000) {
          newErrors[fieldName] = t("contractDeliveryBatches.itemFormDialog.validation.noteMaxLength");
        } else {
          delete newErrors[fieldName];
        }
        break;
    }

    setFieldErrors(newErrors);
  };

  // Helper functions để hiển thị lỗi
  const getFieldError = (fieldName: string): string | undefined => {
    return fieldErrors[fieldName];
  };

  const hasFieldError = (fieldName: string): boolean => {
    return !!fieldErrors[fieldName];
  };

  const handleSubmit = async () => {
    setLoading(true);
    // Clear previous errors
    setFieldErrors({});
    setBusinessErrors([]);

    // Client-side validation trước khi submit
    const clientErrors: Record<string, string> = {};

    // Validate tất cả fields
    if (!formData.contractItemId || formData.contractItemId === "") {
      clientErrors.contractItemId = t("contractDeliveryBatches.itemFormDialog.validation.selectCoffeeType");
    }

    if (!formData.plannedQuantity || formData.plannedQuantity <= 0) {
      clientErrors.plannedQuantity = t("contractDeliveryBatches.itemFormDialog.validation.plannedQuantityGreaterThanZero");
    }

    // Kiểm tra fulfilledQuantity không vượt quá plannedQuantity (chỉ khi ở mode edit)
    if (
      mode === "edit" &&
      (formData as any).fulfilledQuantity !== undefined &&
      (formData as any).fulfilledQuantity !== null
    ) {
      if ((formData as any).fulfilledQuantity < 0) {
        clientErrors.fulfilledQuantity = t("contractDeliveryBatches.itemFormDialog.validation.fulfilledQuantityNotNegative");
      } else if (
        (formData as any).fulfilledQuantity > (formData.plannedQuantity || 0)
      ) {
        clientErrors.fulfilledQuantity = t("contractDeliveryBatches.itemFormDialog.validation.fulfilledQuantityNotExceedPlanned");
      }
    }

    // Kiểm tra tổng khối lượng không vượt quá giới hạn của batch (nếu có thông tin batch)
    if (batchTotalQuantity && batchTotalQuantity > 0) {
      // Tính tổng khối lượng hiện tại của các items khác (trừ item đang edit)
      let currentTotalPlanned = 0;

      if (mode === "edit" && initialData) {
        // Mode edit: tính tổng của các items khác + plannedQuantity mới
        // Giả sử có thể lấy tổng từ parent component hoặc tính toán
        currentTotalPlanned = formData.plannedQuantity || 0;
      } else {
        // Mode create: chỉ cần kiểm tra plannedQuantity mới
        currentTotalPlanned = formData.plannedQuantity || 0;
      }

      if (currentTotalPlanned > batchTotalQuantity) {
        clientErrors.plannedQuantity = `${t("contractDeliveryBatches.itemFormDialog.validation.totalQuantityExceedLimit")} (${currentTotalPlanned} ${t("contractDeliveryBatches.itemFormDialog.labels.kg")}) vượt quá giới hạn của đợt giao (${batchTotalQuantity} ${t("contractDeliveryBatches.itemFormDialog.labels.kg")})`;
      }
    }

    if (formData.note && formData.note.length > 1000) {
      clientErrors.note = t("contractDeliveryBatches.itemFormDialog.validation.noteMaxLength");
    }

    // Nếu có lỗi client-side, hiển thị và dừng
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setLoading(false);
      toast.error(t("contractDeliveryBatches.itemFormDialog.messages.checkFormErrors"));
      return;
    }

    try {
      if (mode === "create") {
        await createContractDeliveryItem(
          formData as ContractDeliveryItemCreateDto
        );
        toast.success(t("contractDeliveryBatches.itemFormDialog.messages.addSuccess"));
      } else {
        await updateContractDeliveryItem(
          formData as ContractDeliveryItemUpdateDto
        );
        toast.success(t("contractDeliveryBatches.itemFormDialog.messages.updateSuccess"));
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      // Xử lý lỗi validation từ backend
      if (
        error &&
        typeof error === "object" &&
        "errors" in error &&
        error.errors
      ) {
        const validationErrors = error.errors as Record<string, string[]>;
        const newFieldErrors: Record<string, string> = {};
        const newBusinessErrors: string[] = [];

        // Phân loại lỗi: field validation vs business logic
        Object.entries(validationErrors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            const message = messages[0];

            // Lỗi nghiệp vụ thường có đặc điểm:
            // 1. Message dài (>50 ký tự)
            // 2. Chứa từ khóa nghiệp vụ
            // 3. Lỗi về quy tắc nghiệp vụ tổng thể
            const isBusinessError =
              message.length > 50 ||
              message.includes("đã có trong đợt giao") ||
              message.includes("không tìm thấy") ||
              message.includes("không được vượt quá") ||
              message.includes("vượt quá") ||
              message.includes("giới hạn trong hợp đồng") ||
              message.includes("tổng số lượng") ||
              message.includes("không hợp lệ") ||
              message.includes("không thuộc") ||
              message.includes("tồn tại trong đợt giao") ||
              message.includes("Không xác định được") ||
              message.includes("Manager") ||
              message.includes("Supervisor") ||
              message.includes("userId") ||
              message.includes("ContractItem") ||
              message.includes("DeliveryBatch") ||
              message.includes("JSON value could not be converted") ||
              message.includes("Path: $.") ||
              message.includes("LineNumber:") ||
              message.includes("BytePositionInLine:") ||
              message.includes("field is required") ||
              message.includes("Không tìm thấy đợt giao hàng") ||
              message.includes("Loại sản phẩm này đã có") ||
              message.includes(
                "Khối lượng đã giao phải nhỏ hơn hoặc bằng khối lượng cần giao"
              );

            if (isBusinessError) {
              // Xử lý đặc biệt cho lỗi validation nghiệp vụ
              if (
                message.includes(
                  "Khối lượng đã giao phải nhỏ hơn hoặc bằng khối lượng cần giao"
                )
              ) {
                // Đây là lỗi validation nghiệp vụ, hiển thị ở field FulfilledQuantity
                newFieldErrors["fulfilledQuantity"] = message;
              } else {
                // Các lỗi nghiệp vụ khác hiển thị trong khung cam cam
                newBusinessErrors.push(message);
              }
            } else {
              // Xử lý lỗi cho các field chính
              const fieldMap: Record<string, string> = {
                ContractItemId: "contractItemId",
                PlannedQuantity: "plannedQuantity",
                FulfilledQuantity: "fulfilledQuantity",
                Note: "note",
                DeliveryBatchId: "deliveryBatchId",
              };

              // Xử lý đặc biệt cho các lỗi field cụ thể
              if (field === "ContractItemId" && message.includes("bắt buộc")) {
                newFieldErrors["contractItemId"] = "Vui lòng chọn loại cà phê";
              } else if (
                field === "PlannedQuantity" &&
                message.includes("bắt buộc")
              ) {
                newFieldErrors["plannedQuantity"] =
                  "Số lượng dự kiến là bắt buộc";
              } else if (
                field === "PlannedQuantity" &&
                message.includes("lớn hơn 0")
              ) {
                newFieldErrors["plannedQuantity"] =
                  "Số lượng dự kiến phải lớn hơn 0";
              } else if (
                field === "FulfilledQuantity" &&
                message.includes("không được âm")
              ) {
                newFieldErrors["fulfilledQuantity"] =
                  "Khối lượng đã giao không được âm";
              } else if (
                message.includes(
                  "Khối lượng đã giao phải nhỏ hơn hoặc bằng khối lượng cần giao"
                )
              ) {
                // Lỗi validation nghiệp vụ - chỉ hiển thị ở FulfilledQuantity để tránh lặp
                newFieldErrors["fulfilledQuantity"] =
                  "Khối lượng đã giao phải nhỏ hơn hoặc bằng khối lượng cần giao";
              } else {
                const mappedField = fieldMap[field] || field;
                newFieldErrors[mappedField] = message;
              }
            }
          }
        });

        // Set errors theo loại
        if (Object.keys(newFieldErrors).length > 0) {
          setFieldErrors(newFieldErrors);
        }

        if (newBusinessErrors.length > 0) {
          setBusinessErrors(newBusinessErrors);
        }

        // Nếu chỉ có lỗi field validation
        if (
          Object.keys(newFieldErrors).length > 0 &&
          newBusinessErrors.length === 0
        ) {
          toast.error("Vui lòng kiểm tra và sửa các lỗi trong biểu mẫu");
        }
      } else {
        // Xử lý lỗi khác (bao gồm lỗi nghiệp vụ chỉ trả về message)
        let errorMessage = "";
        let isBusinessError = false;

        // Kiểm tra nhiều cấu trúc error khác nhau
        if (error && typeof error === "object") {
          // Trường hợp 1: error có message trực tiếp
          if ("message" in error && error.message) {
            errorMessage = error.message as string;
          }
          // Trường hợp 2: error có data.message
          else if (
            "data" in error &&
            error.data &&
            typeof error.data === "object" &&
            "message" in error.data
          ) {
            errorMessage = error.data.message as string;
          }
          // Trường hợp 3: error là string
          else if (typeof error === "string") {
            errorMessage = error;
          }
        } else if (typeof error === "string") {
          errorMessage = error;
        }

        if (errorMessage) {
          // Kiểm tra xem có phải lỗi nghiệp vụ không
          isBusinessError =
            errorMessage.includes("đã có trong đợt giao") ||
            errorMessage.includes("không tìm thấy") ||
            errorMessage.includes("không được vượt quá") ||
            errorMessage.includes("vượt quá") ||
            errorMessage.includes("giới hạn trong hợp đồng") ||
            errorMessage.includes("tổng số lượng") ||
            errorMessage.includes("không hợp lệ") ||
            errorMessage.includes("không thuộc") ||
            errorMessage.includes("tồn tại trong đợt giao") ||
            errorMessage.includes("Không xác định được") ||
            errorMessage.includes("Manager") ||
            errorMessage.includes("Supervisor") ||
            errorMessage.includes("userId") ||
            errorMessage.includes("ContractItem") ||
            errorMessage.includes("DeliveryBatch") ||
            errorMessage.includes("JSON value could not be converted") ||
            errorMessage.includes("Path: $.") ||
            errorMessage.includes("LinePositionInLine:") ||
            errorMessage.includes("Không tìm thấy đợt giao hàng") ||
            errorMessage.includes("Loại sản phẩm này đã có") ||
            errorMessage.includes(
              "Khối lượng đã giao phải nhỏ hơn hoặc bằng khối lượng cần giao"
            );

          if (isBusinessError) {
            // Xử lý đặc biệt cho lỗi validation nghiệp vụ
            if (
              errorMessage.includes(
                "Khối lượng đã giao phải nhỏ hơn hoặc bằng khối lượng cần giao"
              )
            ) {
              // Đây là lỗi validation nghiệp vụ, hiển thị ở field FulfilledQuantity
              setFieldErrors({ fulfilledQuantity: errorMessage });
            } else {
              // Các lỗi nghiệp vụ khác hiển thị trong khung cam cam
              setBusinessErrors([errorMessage]);
            }
            // Không hiển thị toast cho lỗi nghiệp vụ, chỉ hiển thị trong form
          } else {
            toast.error(errorMessage);
          }
        } else {
          toast.error(t("contractDeliveryBatches.itemFormDialog.messages.saveError"));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseDialog.Dialog open={open} onOpenChange={onOpenChange}>
      <FormDialog.Content size="sm">
        <BaseDialog.DialogHeader className="px-5 pt-5 pb-0">
          <BaseDialog.DialogTitle>
            {mode === "create"
              ? t("contractDeliveryBatches.itemFormDialog.title.create")
              : t("contractDeliveryBatches.itemFormDialog.title.edit")}
          </BaseDialog.DialogTitle>
        </BaseDialog.DialogHeader>

        <div className="grid gap-2 px-5 py-4">
          {/* Hiển thị lỗi nghiệp vụ từ backend */}
          {businessErrors.length > 0 && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-orange-800 font-medium">
                  {t("contractDeliveryBatches.itemFormDialog.businessRules.title")}
                </h3>
                <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                  {businessErrors.length} {t("contractDeliveryBatches.itemFormDialog.businessRules.rules")}
                </span>
              </div>

              <div className="space-y-2">
                {businessErrors.map((error, index) => (
                  <div key={index} className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-0.5">⚠</span>
                    <span className="text-orange-700 text-sm">{error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-1">
            <Label htmlFor="contractItemId">{t("contractDeliveryBatches.itemFormDialog.fields.coffeeType")}</Label>
            <Select
              value={formData.contractItemId || undefined} // Khi rỗng -> undefined để hiện placeholder
              onValueChange={(value) => {
                setFormData((prev) => ({ ...prev, contractItemId: value }));
                // Clear business errors when user changes selection
                if (businessErrors.length > 0) {
                  setBusinessErrors([]);
                }
                // Validate ngay khi chọn
                validateField("contractItemId", value);
              }}
            >
              <SelectTrigger
                id="contractItemId"
                className={`w-full ${
                  hasFieldError("contractItemId") ? "border-red-500" : ""
                }`}
              >
                <SelectValue placeholder={t("contractDeliveryBatches.itemFormDialog.placeholders.selectCoffeeType")} />
              </SelectTrigger>
              <SelectContent className="w-full">
                {contractItems.map((item) => (
                  <SelectItem
                    key={item.contractItemId}
                    value={item.contractItemId}
                  >
                    {item.coffeeTypeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFieldError("contractItemId") && (
              <p className="text-red-500 text-sm mt-1 font-medium">
                ⚠ {getFieldError("contractItemId")}
              </p>
            )}
          </div>

          <div className="grid gap-1">
            <Label htmlFor="plannedQuantity">
              {t("contractDeliveryBatches.itemFormDialog.fields.plannedQuantity")}
              {batchTotalQuantity && (
                <span className="text-gray-500 text-sm ml-2">
                  ({t("contractDeliveryBatches.itemFormDialog.labels.limit")} {batchTotalQuantity} {t("contractDeliveryBatches.itemFormDialog.labels.kg")})
                </span>
              )}
            </Label>
            <Input
              id="plannedQuantity"
              name="plannedQuantity"
              type="number"
              value={formData.plannedQuantity}
              onChange={handleChange}
              min={0}
              max={batchTotalQuantity || undefined}
              className={
                hasFieldError("plannedQuantity") ? "border-red-500" : ""
              }
            />
            {hasFieldError("plannedQuantity") && (
              <p className="text-red-500 text-sm mt-1 font-medium">
                ⚠ {getFieldError("plannedQuantity")}
              </p>
            )}
          </div>

          {mode === "edit" && "fulfilledQuantity" in formData && (
            <div className="grid gap-1">
              <Label htmlFor="fulfilledQuantity">{t("contractDeliveryBatches.itemFormDialog.fields.fulfilledQuantity")}</Label>
              <Input
                id="fulfilledQuantity"
                name="fulfilledQuantity"
                type="number"
                value={
                  (formData as ContractDeliveryItemUpdateDto)
                    .fulfilledQuantity ?? 0
                }
                onChange={handleChange}
                min={0}
                className={
                  hasFieldError("fulfilledQuantity") ? "border-red-500" : ""
                }
              />
              {hasFieldError("fulfilledQuantity") && (
                <p className="text-red-500 text-sm mt-1 font-medium">
                  ⚠ {getFieldError("fulfilledQuantity")}
                </p>
              )}
            </div>
          )}

          <div className="grid gap-1">
            <Label htmlFor="note">{t("contractDeliveryBatches.itemFormDialog.fields.note")}</Label>
            <Textarea
              id="note"
              name="note"
              value={formData.note}
              onChange={handleChange}
              placeholder={t("contractDeliveryBatches.itemFormDialog.placeholders.note")}
              className={hasFieldError("note") ? "border-red-500" : ""}
            />
            {hasFieldError("note") && (
              <p className="text-red-500 text-sm mt-1 font-medium">
                ⚠ {getFieldError("note")}
              </p>
            )}
          </div>
        </div>

        <div className="px-5 pb-5 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t("contractDeliveryBatches.itemFormDialog.actions.cancel")}
          </Button>
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? t("contractDeliveryBatches.itemFormDialog.actions.saving") : mode === "create" ? t("contractDeliveryBatches.itemFormDialog.actions.add") : t("contractDeliveryBatches.itemFormDialog.actions.update")}
          </Button>
        </div>
      </FormDialog.Content>
    </BaseDialog.Dialog>
  );
}
