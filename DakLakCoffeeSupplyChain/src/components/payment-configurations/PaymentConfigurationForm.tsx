"use client";

import React from "react";

// Function to convert number to Vietnamese words
function numberToVietnameseWords(num: number): string {
  if (num === 0) return "không";

  const ones = [
    "",
    "một",
    "hai",
    "ba",
    "bốn",
    "năm",
    "sáu",
    "bảy",
    "tám",
    "chín",
  ];
  const tens = [
    "",
    "",
    "hai mươi",
    "ba mươi",
    "bốn mươi",
    "năm mươi",
    "sáu mươi",
    "bảy mươi",
    "tám mươi",
    "chín mươi",
  ];
  const hundreds = [
    "",
    "một trăm",
    "hai trăm",
    "ba trăm",
    "bốn trăm",
    "năm trăm",
    "sáu trăm",
    "bảy trăm",
    "tám trăm",
    "chín trăm",
  ];

  function convertGroup(group: number): string {
    let result = "";
    const hundred = Math.floor(group / 100);
    const ten = Math.floor((group % 100) / 10);
    const one = group % 10;

    if (hundred > 0) {
      result += hundreds[hundred] + " ";
    }

    if (ten > 1) {
      result += tens[ten] + " ";
      if (one > 0) {
        result += ones[one] + " ";
      }
    } else if (ten === 1) {
      if (one === 0) {
        result += "mười ";
      } else if (one === 5) {
        result += "mười lăm ";
      } else {
        result += "mười " + ones[one] + " ";
      }
    } else if (one > 0) {
      result += ones[one] + " ";
    }

    return result.trim();
  }

  if (num < 1000) {
    return convertGroup(num);
  } else if (num < 1000000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    let result = convertGroup(thousands) + " nghìn";
    if (remainder > 0) {
      result += " " + convertGroup(remainder);
    }
    return result;
  } else if (num < 1000000000) {
    const millions = Math.floor(num / 1000000);
    const remainder = num % 1000000;
    let result = convertGroup(millions) + " triệu";
    if (remainder >= 1000) {
      const thousands = Math.floor(remainder / 1000);
      result += " " + convertGroup(thousands) + " nghìn";
      const finalRemainder = remainder % 1000;
      if (finalRemainder > 0) {
        result += " " + convertGroup(finalRemainder);
      }
    } else if (remainder > 0) {
      result += " " + convertGroup(remainder);
    }
    return result;
  } else {
    const billions = Math.floor(num / 1000000000);
    const remainder = num % 1000000000;
    let result = convertGroup(billions) + " tỷ";
    if (remainder >= 1000000) {
      const millions = Math.floor(remainder / 1000000);
      result += " " + convertGroup(millions) + " triệu";
      const thousandsRemainder = remainder % 1000000;
      if (thousandsRemainder >= 1000) {
        const thousands = Math.floor(thousandsRemainder / 1000);
        result += " " + convertGroup(thousands) + " nghìn";
        const finalRemainder = thousandsRemainder % 1000;
        if (finalRemainder > 0) {
          result += " " + convertGroup(finalRemainder);
        }
      } else if (thousandsRemainder > 0) {
        result += " " + convertGroup(thousandsRemainder);
      }
    } else if (remainder >= 1000) {
      const thousands = Math.floor(remainder / 1000);
      result += " " + convertGroup(thousands) + " nghìn";
      const finalRemainder = remainder % 1000;
      if (finalRemainder > 0) {
        result += " " + convertGroup(finalRemainder);
      }
    } else if (remainder > 0) {
      result += " " + convertGroup(remainder);
    }
    return result;
  }
}
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PaymentConfigurationCreateDto,
  PaymentConfigurationUpdateDto,
  PaymentConfigurationViewDetailsDto,
} from "@/lib/api/systemConfiguration";

interface PaymentConfigurationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: PaymentConfigurationCreateDto | PaymentConfigurationUpdateDto
  ) => void;
  initialData?: PaymentConfigurationViewDetailsDto | null;
  isEditing?: boolean;
  loading?: boolean;
}

// Role options - có thể lấy từ API hoặc hardcode
const roleOptions = [
  { id: 1, name: "Nông dân" },
  { id: 2, name: "Quản lý doanh nghiệp" },
  { id: 3, name: "Chuyên gia" },
  { id: 4, name: "Nhân viên" },
  { id: 5, name: "Quản trị viên" },
];

// Fee type options
const feeTypeOptions = [
  { value: "Registration", label: "Phí đăng ký" },
  { value: "MonthlyFee", label: "Phí hàng tháng" },
  { value: "TransactionFee", label: "Phí giao dịch" },
  { value: "ProcessingFee", label: "Phí xử lý" },
  { value: "ServiceFee", label: "Phí dịch vụ" },
  { value: "MaintenanceFee", label: "Phí bảo trì" },
];

export default function PaymentConfigurationForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
  loading = false,
}: PaymentConfigurationFormProps) {
  const [formData, setFormData] = React.useState<PaymentConfigurationCreateDto>(
    {
      roleId: 0,
      feeType: "",
      amount: 0,
      description: "",
      effectiveFrom: new Date().toISOString().split("T")[0],
      effectiveTo: null,
      isActive: true,
    }
  );

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Initialize form data when dialog opens or initialData changes
  React.useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        setFormData({
          roleId: initialData.roleId,
          feeType: initialData.feeType,
          amount: initialData.amount,
          description: initialData.description || "",
          effectiveFrom: initialData.effectiveFrom.split("T")[0],
          effectiveTo: initialData.effectiveTo
            ? initialData.effectiveTo.split("T")[0]
            : null,
          isActive: initialData.isActive ?? true,
        });
      } else {
        setFormData({
          roleId: 0,
          feeType: "",
          amount: 0,
          description: "",
          effectiveFrom: new Date().toISOString().split("T")[0],
          effectiveTo: null,
          isActive: true,
        });
      }
      setErrors({});
    }
  }, [isOpen, isEditing, initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.roleId || formData.roleId === 0) {
      newErrors.roleId = "Vui lòng chọn vai trò";
    }

    if (!formData.feeType) {
      newErrors.feeType = "Vui lòng chọn loại phí";
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = "Số tiền phải lớn hơn 0";
    }

    if (!formData.effectiveFrom) {
      newErrors.effectiveFrom = "Vui lòng chọn ngày hiệu lực";
    }

    if (formData.effectiveTo && formData.effectiveTo < formData.effectiveFrom) {
      newErrors.effectiveTo = "Ngày hết hiệu lực phải sau ngày hiệu lực";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Tự động tính toán isActive dựa trên ngày hiệu lực
    const today = new Date().toISOString().split("T")[0];
    const effectiveFrom = formData.effectiveFrom;
    const effectiveTo = formData.effectiveTo;

    let isActive = false;
    if (effectiveFrom <= today) {
      if (!effectiveTo || effectiveTo >= today) {
        isActive = true;
      }
    }

    const submitData = {
      ...formData,
      isActive: isActive,
    };

    onSubmit(submitData);
  };

  const handleClose = () => {
    setFormData({
      roleId: 0,
      feeType: "",
      amount: 0,
      description: "",
      effectiveFrom: new Date().toISOString().split("T")[0],
      effectiveTo: null,
      isActive: true,
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Chỉnh sửa cấu hình phí" : "Tạo cấu hình phí mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="roleID">
                Vai trò <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.roleId > 0 ? formData.roleId.toString() : ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, roleId: Number(value) })
                }
              >
                <SelectTrigger
                  className={errors.roleId ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.roleId && (
                <p className="text-red-500 text-sm mt-1">{errors.roleId}</p>
              )}
            </div>

            <div>
              <Label htmlFor="feeType">
                Loại phí <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.feeType}
                onValueChange={(value) =>
                  setFormData({ ...formData, feeType: value })
                }
              >
                <SelectTrigger
                  className={errors.feeType ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Chọn loại phí" />
                </SelectTrigger>
                <SelectContent>
                  {feeTypeOptions.map((fee) => (
                    <SelectItem key={fee.value} value={fee.value}>
                      {fee.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.feeType && (
                <p className="text-red-500 text-sm mt-1">{errors.feeType}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="amount">
              Số tiền (VND) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amount"
              type="text"
              value={
                formData.amount ? formData.amount.toLocaleString("vi-VN") : ""
              }
              onChange={(e) => {
                const value = e.target.value.replace(/[^\d]/g, "");
                setFormData({ ...formData, amount: value ? Number(value) : 0 });
              }}
              placeholder="0"
              className={errors.amount ? "border-red-500" : ""}
            />
            {formData.amount > 0 && (
              <p className="text-sm text-blue-600 font-medium mt-1">
                {numberToVietnameseWords(formData.amount)} đồng
              </p>
            )}
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Mô tả chi tiết về loại phí này..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="effectiveFrom">
                Hiệu lực từ ngày <span className="text-red-500">*</span>
              </Label>
              <Input
                id="effectiveFrom"
                type="date"
                value={formData.effectiveFrom}
                onChange={(e) =>
                  setFormData({ ...formData, effectiveFrom: e.target.value })
                }
                className={errors.effectiveFrom ? "border-red-500" : ""}
              />
              {errors.effectiveFrom && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.effectiveFrom}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="effectiveTo">Hết hiệu lực</Label>
              <Input
                id="effectiveTo"
                type="date"
                value={formData.effectiveTo || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    effectiveTo: e.target.value || null,
                  })
                }
                className={errors.effectiveTo ? "border-red-500" : ""}
              />
              {errors.effectiveTo && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.effectiveTo}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Đang xử lý..."
                : isEditing
                ? "Cập nhật"
                : "Tạo cấu hình"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
