"use client";

import { useEffect, useState } from "react";
import {
  ContractItemCreateDto,
  ContractItemUpdateDto,
  createContractItem,
  updateContractItem,
} from "@/lib/api/contractItems";
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
import { getCoffeeTypes, CoffeeType } from "@/lib/api/coffeeType";
import { toast } from "sonner";

// Helper: input có suffix đơn vị bên phải
function InputWithSuffix({
  unit,
  className,
  ...props
}: React.ComponentProps<typeof Input> & { unit?: string }) {
  return (
    <div className="relative">
      <Input {...props} className={`pr-14 ${className ?? ""}`} />
      {unit ? (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
          {unit}
        </span>
      ) : null}
    </div>
  );
}

type Mode = "create" | "edit";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: Mode;
  loading?: boolean;
  contractId: string;
  coffeeTypes: CoffeeType[];
  formData: {
    contractId: string;
    coffeeTypeId: string;
    quantity: number | string;
    unitPrice: number | string;
    discountAmount: number | string;
    note?: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<Props["formData"]>>;
  handleChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  >;
  handleSubmit: () => void;
}

interface ContractItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  contractId: string;
  initialData?: ContractItemUpdateDto;
  onSuccess?: () => void;
}

export default function ContractItemFormDialog({
  open,
  onOpenChange,
  mode,
  contractId,
  initialData,
  onSuccess,
}: ContractItemFormDialogProps) {
  const [formData, setFormData] = useState<
    ContractItemCreateDto | ContractItemUpdateDto
  >({
    contractId,
    coffeeTypeId: "",
    quantity: 0,
    unitPrice: 0,
    discountAmount: 0,
    note: "",
  });

  const [coffeeTypes, setCoffeeTypes] = useState<CoffeeType[]>([]);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [businessErrors, setBusinessErrors] = useState<string[]>([]);

  useEffect(() => {
    const fetchCoffeeTypes = async () => {
      try {
        const data = await getCoffeeTypes();
        setCoffeeTypes(data);
      } catch (error) {
        console.error("Lỗi khi tải danh sách loại cà phê:", error);
      }
    };

    fetchCoffeeTypes();
  }, []);

  useEffect(() => {
    if (open) {
      // Clear errors khi mở dialog
      setFieldErrors({});
      setBusinessErrors([]);

      if (mode === "edit" && initialData) {
        setFormData({ ...initialData });
      } else {
        setFormData({
          contractId,
          coffeeTypeId: "",
          quantity: 0,
          unitPrice: 0,
          discountAmount: 0,
          note: "",
        });
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
        name === "quantity" || name === "unitPrice" || name === "discountAmount"
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
  };

  // Client-side validation cho từng field
  const validateField = (fieldName: string, value: any) => {
    const newErrors = { ...fieldErrors };

    switch (fieldName) {
      case "coffeeTypeId":
        if (!value || value === "") {
          newErrors[fieldName] = "Vui lòng chọn loại cà phê";
        } else {
          delete newErrors[fieldName];
        }
        break;

      case "quantity":
        const quantity = Number(value);
        if (!value || value === "" || isNaN(quantity)) {
          newErrors[fieldName] = "Số lượng là bắt buộc";
        } else if (quantity <= 0) {
          newErrors[fieldName] = "Số lượng phải lớn hơn 0";
        } else {
          delete newErrors[fieldName];
        }
        break;

      case "unitPrice":
        const unitPrice = Number(value);
        if (!value || value === "" || isNaN(unitPrice)) {
          newErrors[fieldName] = "Đơn giá là bắt buộc";
        } else if (unitPrice <= 0) {
          newErrors[fieldName] = "Đơn giá phải lớn hơn 0";
        } else {
          delete newErrors[fieldName];
        }
        break;

      case "discountAmount":
        const discountAmount = Number(value);
        if (value !== "" && !isNaN(discountAmount)) {
          if (discountAmount < 0) {
            newErrors[fieldName] = "Chiết khấu không được âm";
          } else {
            // Kiểm tra chiết khấu không vượt quá tổng thành tiền
            const quantity = Number(formData.quantity);
            const unitPrice = Number(formData.unitPrice);
            if (
              quantity > 0 &&
              unitPrice > 0 &&
              discountAmount > quantity * unitPrice
            ) {
              newErrors[fieldName] =
                "Chiết khấu không được vượt quá tổng thành tiền";
            } else {
              delete newErrors[fieldName];
            }
          }
        } else {
          delete newErrors[fieldName];
        }
        break;

      case "note":
        if (value && value.length > 1000) {
          newErrors[fieldName] = "Ghi chú không được vượt quá 1000 ký tự";
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

  const getFieldDisplayName = (fieldName: string): string => {
    const fieldMap: Record<string, string> = {
      coffeeTypeId: "Loại cà phê",
      quantity: "Số lượng",
      unitPrice: "Đơn giá",
      discountAmount: "Chiết khấu",
      note: "Ghi chú",
    };
    return fieldMap[fieldName] || fieldName;
  };

  const handleSubmit = async () => {
    setLoading(true);
    // Clear previous errors
    setFieldErrors({});
    setBusinessErrors([]);

    // Client-side validation trước khi submit
    const clientErrors: Record<string, string> = {};

    // Validate tất cả fields
    if (!formData.coffeeTypeId || formData.coffeeTypeId === "") {
      clientErrors.coffeeTypeId = "Vui lòng chọn loại cà phê";
    }

    if (!formData.quantity || formData.quantity <= 0) {
      clientErrors.quantity = "Số lượng phải lớn hơn 0";
    }

    if (!formData.unitPrice || formData.unitPrice <= 0) {
      clientErrors.unitPrice = "Đơn giá phải lớn hơn 0";
    }

    if (formData.discountAmount && formData.discountAmount < 0) {
      clientErrors.discountAmount = "Chiết khấu không được âm";
    }

    // Kiểm tra chiết khấu không vượt quá tổng thành tiền
    if (
      formData.quantity > 0 &&
      formData.unitPrice > 0 &&
      (formData.discountAmount ?? 0) > 0
    ) {
      if (
        (formData.discountAmount ?? 0) >
        formData.quantity * formData.unitPrice
      ) {
        clientErrors.discountAmount =
          "Chiết khấu không được vượt quá tổng thành tiền";
      }
    }

    if (formData.note && formData.note.length > 1000) {
      clientErrors.note = "Ghi chú không được vượt quá 1000 ký tự";
    }

    // Nếu có lỗi client-side, hiển thị và dừng
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setLoading(false);
      toast.error("Vui lòng kiểm tra và sửa các lỗi trong biểu mẫu");
      return;
    }

    try {
      if (mode === "create") {
        await createContractItem(formData as ContractItemCreateDto);
        toast.success("Thêm mặt hàng thành công!");
      } else {
        await updateContractItem(formData as ContractItemUpdateDto);
        toast.success("Cập nhật mặt hàng thành công!");
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
            // 4. Lỗi JSON parsing từ backend
            const isBusinessError =
              message.length > 50 ||
              message.includes("đã có trong hợp đồng") ||
              message.includes("không tìm thấy") ||
              message.includes("không được vượt quá") ||
              message.includes("vượt quá") ||
              message.includes("tổng thành tiền") ||
              message.includes("tổng số lượng") ||
              message.includes("tổng giá trị") ||
              message.includes("giới hạn hợp đồng") ||
              message.includes("VND >") ||
              message.includes("hiện có") ||
              message.includes("thêm") ||
              message.includes("BusinessManager") ||
              message.includes("tương ứng với tài khoản") ||
              message.includes("hợp đồng tương ứng") ||
              message.includes("mục hợp đồng cần cập nhật") ||
              message.includes("JSON value could not be converted") ||
              message.includes("Path: $.") ||
              message.includes("LineNumber:") ||
              message.includes("BytePositionInLine:") ||
              message.includes("contractItemCreateDto") ||
              message.includes("field is required") ||
              message.includes("Không tìm thấy BusinessManager") ||
              message.includes("Không tìm thấy hợp đồng") ||
              message.includes("Loại cà phê này đã có");

            if (isBusinessError) {
              newBusinessErrors.push(message);
            } else {
              // Xử lý lỗi cho các field chính
              const fieldMap: Record<string, string> = {
                CoffeeTypeId: "coffeeTypeId",
                Quantity: "quantity",
                UnitPrice: "unitPrice",
                DiscountAmount: "discountAmount",
                Note: "note",
              };

              // Xử lý đặc biệt cho các lỗi field cụ thể
              if (field === "CoffeeTypeId" && message.includes("bắt buộc")) {
                newFieldErrors["coffeeTypeId"] = "Vui lòng chọn loại cà phê";
              } else if (field === "Quantity" && message.includes("bắt buộc")) {
                newFieldErrors["quantity"] = "Số lượng là bắt buộc";
              } else if (
                field === "UnitPrice" &&
                message.includes("bắt buộc")
              ) {
                newFieldErrors["unitPrice"] = "Đơn giá là bắt buộc";
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
            errorMessage.includes("đã có trong hợp đồng") ||
            errorMessage.includes("không tìm thấy") ||
            errorMessage.includes("không được vượt quá") ||
            errorMessage.includes("vượt quá") ||
            errorMessage.includes("tổng thành tiền") ||
            errorMessage.includes("tổng số lượng") ||
            errorMessage.includes("tổng giá trị") ||
            errorMessage.includes("giới hạn hợp đồng") ||
            errorMessage.includes("VND >") ||
            errorMessage.includes("hiện có") ||
            errorMessage.includes("thêm") ||
            errorMessage.includes("BusinessManager") ||
            errorMessage.includes("tương ứng với tài khoản") ||
            errorMessage.includes("hợp đồng tương ứng") ||
            errorMessage.includes("mục hợp đồng cần cập nhật") ||
            errorMessage.includes("JSON value could not be converted") ||
            errorMessage.includes("Path: $.") ||
            errorMessage.includes("LinePositionInLine:") ||
            errorMessage.includes("Không tìm thấy BusinessManager") ||
            errorMessage.includes("Không tìm thấy hợp đồng") ||
            errorMessage.includes("Loại cà phê này đã có");

          if (isBusinessError) {
            setBusinessErrors([errorMessage]);
            // Không hiển thị toast cho lỗi nghiệp vụ, chỉ hiển thị trong form
          } else {
            toast.error(errorMessage);
          }
        } else {
          toast.error("Đã xảy ra lỗi khi lưu mặt hàng.");
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
            {mode === "create" ? "Thêm mặt hàng" : "Cập nhật mặt hàng"}
          </BaseDialog.DialogTitle>
        </BaseDialog.DialogHeader>

        <div className="grid gap-2 px-5 py-4">
          {/* Hiển thị lỗi nghiệp vụ từ backend */}
          {businessErrors.length > 0 && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-orange-800 font-medium">
                  Cần tuân thủ quy tắc nghiệp vụ:
                </h3>
                <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                  {businessErrors.length} quy tắc
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

          {/* Loại cà phê */}
          <div className="grid gap-1">
            <Label htmlFor="coffeeTypeId">
              Loại cà phê <span className="text-red-500">*</span>{" "}
            </Label>
            <Select
              // Nếu state rỗng => truyền undefined để hiện placeholder
              value={formData.coffeeTypeId || undefined}
              onValueChange={(value) => {
                setFormData((prev) => ({ ...prev, coffeeTypeId: value }));
                // Clear business errors when user changes selection
                if (businessErrors.length > 0) {
                  setBusinessErrors([]);
                }
                // Validate ngay khi chọn
                validateField("coffeeTypeId", value);
              }}
            >
              <SelectTrigger
                id="coffeeTypeId"
                className={`w-full ${
                  hasFieldError("coffeeTypeId") ? "border-red-500" : ""
                }`}
              >
                <SelectValue placeholder="-- Chọn loại cà phê --" />
              </SelectTrigger>
              <SelectContent className="w-full">
                {coffeeTypes.map((type) => (
                  <SelectItem key={type.coffeeTypeId} value={type.coffeeTypeId}>
                    {type.typeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFieldError("coffeeTypeId") && (
              <p className="text-red-500 text-sm mt-1 font-medium">
                ⚠ {getFieldError("coffeeTypeId")}
              </p>
            )}
          </div>

          {/* Số lượng (kg) */}
          <div className="grid gap-1">
            <Label htmlFor="quantity">
              Số lượng (Kg) <span className="text-red-500">*</span>
            </Label>
            <InputWithSuffix
              id="quantity"
              name="quantity"
              type="number"
              inputMode="decimal"
              step={0.1}
              min={0}
              value={formData.quantity}
              onChange={handleChange}
              className={hasFieldError("quantity") ? "border-red-500" : ""}
            />
            {hasFieldError("quantity") && (
              <p className="text-red-500 text-sm mt-1 font-medium">
                ⚠ {getFieldError("quantity")}
              </p>
            )}
          </div>

          {/* Đơn giá (VND/Kg) */}
          <div className="grid gap-1">
            <Label htmlFor="unitPrice">
              Đơn giá (VNĐ/Kg) <span className="text-red-500">*</span>
            </Label>
            <InputWithSuffix
              id="unitPrice"
              name="unitPrice"
              type="number"
              inputMode="numeric"
              min={0}
              value={formData.unitPrice}
              onChange={handleChange}
              className={hasFieldError("unitPrice") ? "border-red-500" : ""}
            />
            {hasFieldError("unitPrice") && (
              <p className="text-red-500 text-sm mt-1 font-medium">
                ⚠ {getFieldError("unitPrice")}
              </p>
            )}
          </div>

          {/* Chiết khấu (%) */}
          <div className="grid gap-1">
            <Label htmlFor="discountAmount">Chiết khấu (%)</Label>
            <InputWithSuffix
              id="discountAmount"
              name="discountAmount"
              type="number"
              inputMode="decimal"
              step={0.1}
              min={0}
              value={formData.discountAmount}
              onChange={handleChange}
              className={
                hasFieldError("discountAmount") ? "border-red-500" : ""
              }
            />
            {hasFieldError("discountAmount") && (
              <p className="text-red-500 text-sm mt-1 font-medium">
                ⚠ {getFieldError("discountAmount")}
              </p>
            )}
          </div>

          {/* Ghi chú */}
          <div className="grid gap-1">
            <Label htmlFor="note">Ghi chú</Label>
            <Textarea
              id="note"
              name="note"
              value={formData.note}
              onChange={handleChange}
              placeholder="Nhập ghi chú (tuỳ chọn)"
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
            Huỷ
          </Button>
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Đang lưu..." : mode === "create" ? "Thêm" : "Cập nhật"}
          </Button>
        </div>
      </FormDialog.Content>
    </BaseDialog.Dialog>
  );
}
