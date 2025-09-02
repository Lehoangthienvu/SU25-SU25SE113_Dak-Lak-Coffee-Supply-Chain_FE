"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/DatePicker";
import { DialogFooter } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getContractDetails } from "@/lib/api/contracts";
import {
  createContractDeliveryBatch,
  updateContractDeliveryBatch,
  ContractDeliveryBatchCreateDto,
  ContractDeliveryBatchUpdateDto,
  getContractDeliveryBatchById,
  getContractDeliveryBatchesByContractId,
} from "@/lib/api/contractDeliveryBatches";
import {
  ContractDeliveryBatchStatus,
  ContractDeliveryBatchStatusLabel,
  getContractDeliveryBatchStatusLabel,
} from "@/lib/constants/contractDeliveryBatchStatus";
import { toDateOnly, fromDateOnly, getErrorMessage } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export type ContractOption = {
  contractId: string;
  contractNumber: string;
  remainingQuantity?: number;
  totalQuantity?: number;
  existingBatches?: number;
};

// Form State
type DeliveryBatchFormState = {
  contractId: string;
  deliveryRound: number;
  expectedDeliveryDate?: Date;
  totalPlannedQuantity: number;
  status: ContractDeliveryBatchStatus;
  note?: string;
  contractDeliveryItems: {
    deliveryItemId?: string; // Có thể undefined cho items mới
    contractItemId: string;
    plannedQuantity: number;
    fulfilledQuantity?: number; // Khối lượng đã giao (cần thiết cho update)
    note?: string;
  }[];
};

type Props = {
  initialData?: ContractDeliveryBatchUpdateDto;
  onSuccess: () => void;
  contractId?: string;
  contractOptions?: ContractOption[];
};

export default function ContractDeliveryBatchForm({
  initialData,
  onSuccess,
  contractId,
  contractOptions = [],
}: Props) {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const router = useRouter();

  // formData
  const [formData, setFormData] = useState<DeliveryBatchFormState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [businessErrors, setBusinessErrors] = useState<string[]>([]);

  type ContractItemOption = { contractItemId: string; coffeeTypeName: string };
  const [itemOptions, setItemOptions] = useState<ContractItemOption[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Helpers
  const toDateOnlyString = (d?: Date | string) => {
    if (!d) return "";
    if (d instanceof Date) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }
    return d;
  };

  // Khởi tạo form từ initialData (edit) hoặc từ contractId (create)
  useEffect(() => {
    if (initialData) {
      // EDIT mode: Khởi tạo từ initialData và load items ngay lập tức
      (async () => {
        try {
          // Khởi tạo form trước
          setFormData({
            contractId: initialData.contractId,
            deliveryRound: initialData.deliveryRound,
            expectedDeliveryDate: fromDateOnly(
              initialData.expectedDeliveryDate
            ),
            totalPlannedQuantity: initialData.totalPlannedQuantity,
            status: initialData.status,
            note: (initialData as any).note || "",
            contractDeliveryItems: [], // Tạm thời để trống
          });

          // Load items ngay lập tức
          const detail = await getContractDeliveryBatchById(
            initialData.deliveryBatchId
          );
          const rows = (detail.contractDeliveryItems ?? []).map((x) => ({
            deliveryItemId: x.deliveryItemId,
            contractItemId: x.contractItemId,
            plannedQuantity: x.plannedQuantity ?? 0,
            fulfilledQuantity: x.fulfilledQuantity ?? 0, // Lấy khối lượng đã giao
            note: x.note ?? "",
          }));

          // Cập nhật form với items đã load
          setFormData((prev) =>
            prev ? { ...prev, contractDeliveryItems: rows } : null
          );

          // Tự động cập nhật trạng thái sau khi load items
          setTimeout(() => {
            if (rows.length > 0) {
              // Tính toán trạng thái dựa trên khối lượng đã giao
              const totalPlanned = rows.reduce(
                (acc, x) => acc + (Number(x.plannedQuantity) || 0),
                0
              );
              const totalFulfilled = rows.reduce(
                (acc, x) => acc + (Number(x.fulfilledQuantity) || 0),
                0
              );

              if (totalPlanned > 0 && totalFulfilled >= totalPlanned) {
                // Nếu tổng đã giao >= tổng dự kiến thì chuyển sang "Hoàn thành"
                setFormData((prev) =>
                  prev
                    ? { ...prev, status: ContractDeliveryBatchStatus.Fulfilled }
                    : null
                );
              } else if (totalFulfilled > 0 && totalFulfilled < totalPlanned) {
                // Nếu đã giao một phần thì chuyển sang "Đang thực hiện"
                setFormData((prev) =>
                  prev
                    ? {
                        ...prev,
                        status: ContractDeliveryBatchStatus.InProgress,
                      }
                    : null
                );
              }
            }
          }, 200);
        } catch (e) {
          console.error(e);
          toast.error(
            t("contractDeliveryBatches.form.messages.loadItemsError")
          );
        }
      })();
    } else {
      // CREATE mode: Khởi tạo từ contractId
      setFormData({
        contractId: contractId ?? "",
        deliveryRound: 1,
        expectedDeliveryDate: undefined,
        totalPlannedQuantity: 0,
        status: ContractDeliveryBatchStatus.InProgress,
        note: "",
        contractDeliveryItems: [],
      });
    }
  }, [initialData, contractId]);

  // useEffect load coffee types
  useEffect(() => {
    const cid = formData?.contractId;
    if (!cid) {
      setItemOptions([]);
      return;
    }
    (async () => {
      try {
        setLoadingItems(true);
        const detail = await getContractDetails(cid);
        const raw = (detail as any).contractItems || [];
        setItemOptions(
          (Array.isArray(raw) ? raw : []).map((x: any) => ({
            contractItemId: x.contractItemId,
            coffeeTypeName: x.coffeeTypeName,
          }))
        );
      } catch (e) {
        console.error(e);
        toast.error(
          t("contractDeliveryBatches.form.messages.loadContractItemsError")
        );
      } finally {
        setLoadingItems(false);
      }
    })();
  }, [formData?.contractId]);

  // useEffect để kiểm tra và cập nhật deliveryRound dựa trên số đợt giao hiện có
  useEffect(() => {
    const cid = formData?.contractId;
    if (!cid || isEdit) return; // Chỉ áp dụng cho create mode

    (async () => {
      try {
        // Lấy danh sách đợt giao hàng của hợp đồng này
        const existingBatches = await getContractDeliveryBatchesByContractId(
          cid
        );

        // Tìm deliveryRound lớn nhất hiện có
        const maxRound = existingBatches.reduce((max, batch) => {
          return Math.max(max, batch.deliveryRound || 0);
        }, 0);

        // Cập nhật deliveryRound thành round tiếp theo
        setFormData((prev) =>
          prev
            ? {
                ...prev,
                deliveryRound: maxRound + 1,
              }
            : null
        );
      } catch (e) {
        console.error("Không thể kiểm tra đợt giao hàng hiện có:", e);
        // Nếu lỗi, giữ nguyên deliveryRound = 1
        setFormData((prev) =>
          prev
            ? {
                ...prev,
                deliveryRound: 1,
              }
            : null
        );
      }
    })();
  }, [formData?.contractId, isEdit]);

  // useEffect tự động cập nhật trạng thái khi khối lượng đã giao thay đổi
  useEffect(() => {
    if (!formData || !isEdit) return;

    const totalPlanned = sumPlannedQuantity();
    const totalFulfilled = sumFulfilledQuantity();

    if (totalPlanned > 0 && totalFulfilled >= totalPlanned) {
      // Nếu tổng đã giao >= tổng dự kiến thì chuyển sang "Hoàn thành"
      if (formData.status !== ContractDeliveryBatchStatus.Fulfilled) {
        setFormData((prev) =>
          prev
            ? { ...prev, status: ContractDeliveryBatchStatus.Fulfilled }
            : null
        );
      }
    } else if (totalFulfilled > 0 && totalFulfilled < totalPlanned) {
      // Nếu đã giao một phần thì chuyển sang "Đang thực hiện"
      if (formData.status !== ContractDeliveryBatchStatus.InProgress) {
        setFormData((prev) =>
          prev
            ? { ...prev, status: ContractDeliveryBatchStatus.InProgress }
            : null
        );
      }
    }
  }, [formData?.contractDeliveryItems, isEdit]);

  if (!formData) {
    return (
      <div className="text-gray-500 text-center py-10">
        {t("contractDeliveryBatches.form.loading")}
      </div>
    );
  }

  // set field
  const handleChange = (field: keyof DeliveryBatchFormState, value: any) => {
    setFormData((prev) => ({
      ...(prev as DeliveryBatchFormState),
      [field]: value,
    }));

    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Clear business errors when user makes any change
    if (businessErrors.length > 0) {
      setBusinessErrors([]);
    }
  };

  // Helper function to get error for a specific field
  const getFieldError = (fieldName: string): string | undefined => {
    return fieldErrors[fieldName];
  };

  // Helper function to check if field has error
  const hasFieldError = (fieldName: string): boolean => {
    return !!fieldErrors[fieldName];
  };

  // Items helpers
  const addRow = () => {
    setFormData((prev) => ({
      ...(prev as DeliveryBatchFormState),
      contractDeliveryItems: [
        ...((prev as DeliveryBatchFormState).contractDeliveryItems || []),
        {
          contractItemId: "",
          plannedQuantity: 0,
          fulfilledQuantity: 0,
          note: "",
        },
      ],
    }));
  };

  const updateRow = (
    index: number,
    field: "contractItemId" | "plannedQuantity" | "fulfilledQuantity" | "note",
    value: any
  ) => {
    setFormData((prev) => {
      const base = { ...(prev as DeliveryBatchFormState) };
      const arr = [...(base.contractDeliveryItems || [])];
      arr[index] = {
        ...arr[index],
        [field]: field === "plannedQuantity" ? Number(value) : value,
      };
      base.contractDeliveryItems = arr;
      return base;
    });

    // Clear field error when user starts typing
    const fieldKey = `contractDeliveryItems.${index}.${field}`;
    if (fieldErrors[fieldKey]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }

    // Clear business errors when user makes any change
    if (businessErrors.length > 0) {
      setBusinessErrors([]);
    }

    // Client-side validation for contract delivery item fields
    if (field === "plannedQuantity" && value <= 0) {
      setFieldErrors((prev) => ({
        ...prev,
        [`contractDeliveryItems.${index}.plannedQuantity`]: t(
          "contractDeliveryBatches.form.validation.quantityGreaterThanZero"
        ),
      }));
    } else if (field === "contractItemId" && !value) {
      setFieldErrors((prev) => ({
        ...prev,
        [`contractDeliveryItems.${index}.contractItemId`]: t(
          "contractDeliveryBatches.form.validation.selectCoffeeType"
        ),
      }));
    }
  };

  const removeRow = (index: number) =>
    setFormData((prev) => {
      const base = { ...(prev as DeliveryBatchFormState) };
      const arr = [...(base.contractDeliveryItems || [])];
      arr.splice(index, 1);
      base.contractDeliveryItems = arr;
      return base;
    });

  const sumPlannedQuantity = () =>
    (formData.contractDeliveryItems || []).reduce(
      (acc, x) => acc + (Number(x.plannedQuantity) || 0),
      0
    );

  const sumFulfilledQuantity = () =>
    (formData.contractDeliveryItems || []).reduce(
      (acc, x) => acc + (Number(x.fulfilledQuantity) || 0),
      0
    );

  // Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Clear previous errors
    setFieldErrors({});
    setBusinessErrors([]);

    const data = formData;
    if (!data) {
      toast.error(t("contractDeliveryBatches.form.messages.formNotReady"));
      return;
    }

    // Validate cơ bản
    const clientErrors: Record<string, string> = {};

    if (!data.contractId) {
      clientErrors.contractId = t(
        "contractDeliveryBatches.form.validation.selectContract"
      );
    }

    if (!data.expectedDeliveryDate) {
      clientErrors.expectedDeliveryDate = t(
        "contractDeliveryBatches.form.validation.selectExpectedDate"
      );
    } else {
      const picked = new Date(data.expectedDeliveryDate as any);
      picked.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (picked < today) {
        clientErrors.expectedDeliveryDate = t(
          "contractDeliveryBatches.form.validation.pastDate"
        );
      }
    }

    if (data.deliveryRound < 1) {
      clientErrors.deliveryRound = t(
        "contractDeliveryBatches.form.validation.deliveryRoundMin"
      );
    }

    const items = data.contractDeliveryItems || [];
    if (!items.length) {
      clientErrors.contractDeliveryItems = t(
        "contractDeliveryBatches.form.validation.atLeastOneItem"
      );
    } else {
      items.forEach((item, index) => {
        if (!item.contractItemId) {
          clientErrors[`contractDeliveryItems.${index}.contractItemId`] = t(
            "contractDeliveryBatches.form.validation.selectCoffeeType"
          );
        }
        if (!(Number(item.plannedQuantity) > 0)) {
          clientErrors[`contractDeliveryItems.${index}.plannedQuantity`] = t(
            "contractDeliveryBatches.form.validation.quantityGreaterThanZero"
          );
        }
      });
    }

    const total = items.reduce(
      (s, x) => s + (Number(x.plannedQuantity) || 0),
      0
    );
    if (!(total > 0)) {
      clientErrors.totalPlannedQuantity = t(
        "contractDeliveryBatches.form.validation.totalQuantityGreaterThanZero"
      );
    }

    // If there are client-side errors, display them and stop
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      toast.error(t("contractDeliveryBatches.form.messages.checkFormErrors"));
      return;
    }

    // Build DTO đúng kiểu cho BE (DateOnly string)
    const expected = toDateOnlyString(data.expectedDeliveryDate);

    try {
      if (isEdit && initialData) {
        const payload: ContractDeliveryBatchUpdateDto = {
          deliveryBatchId: initialData.deliveryBatchId,
          contractId: data.contractId,
          deliveryRound: data.deliveryRound,
          expectedDeliveryDate: expected,
          totalPlannedQuantity: data.totalPlannedQuantity,
          status: data.status,
          contractDeliveryItems: data.contractDeliveryItems.map((item) => ({
            deliveryItemId: item.deliveryItemId || "", // Có thể undefined cho items mới
            deliveryBatchId: initialData.deliveryBatchId,
            contractItemId: item.contractItemId,
            plannedQuantity: item.plannedQuantity,
            fulfilledQuantity: item.fulfilledQuantity || 0, // Bao gồm khối lượng đã giao
            note: item.note || "",
          })),
        };

        await updateContractDeliveryBatch(payload.deliveryBatchId, payload);
        toast.success(t("contractDeliveryBatches.form.messages.updateSuccess"));
        router.back();
      } else {
        // Tạo payload riêng cho create để tránh vấn đề deliveryBatchId
        const createPayload = {
          contractId: data.contractId,
          deliveryRound: data.deliveryRound,
          expectedDeliveryDate: expected,
          totalPlannedQuantity: data.totalPlannedQuantity,
          status: data.status,
          contractDeliveryItems: data.contractDeliveryItems.map((item) => ({
            contractItemId: item.contractItemId,
            plannedQuantity: item.plannedQuantity,
            note: item.note || "",
          })),
        };

        await createContractDeliveryBatch(createPayload as any);
        toast.success(t("contractDeliveryBatches.form.messages.createSuccess"));
        onSuccess();
      }
    } catch (err) {
      // Xử lý lỗi validation từ backend
      if (err && typeof err === "object" && "errors" in err && err.errors) {
        const validationErrors = err.errors as Record<string, string[]>;
        const newFieldErrors: Record<string, string> = {};
        const newBusinessErrors: string[] = [];

        // Phân loại lỗi: field validation vs business logic
        Object.entries(validationErrors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            const message = messages[0];

            // Lỗi nghiệp vụ thường có đặc điểm:
            const isBusinessError =
              message.length > 50 ||
              message.includes("vượt quá") ||
              message.includes("đã tồn tại") ||
              message.includes("không được") ||
              message.includes("phải") ||
              message.includes("cùng loại") ||
              message.includes("tổng khối lượng") ||
              message.includes("tổng giá trị") ||
              message.includes("tổng trị giá") ||
              message.includes("đã tồn tại trong hệ thống") ||
              message.includes("không có quyền") ||
              message.includes("không tìm thấy") ||
              message.includes("vượt quá tổng") ||
              message.includes("không được có 2 dòng") ||
              message.includes("không được âm") ||
              message.includes("phải lớn hơn") ||
              message.includes("phải nhỏ hơn") ||
              message.includes("dòng hợp đồng") ||
              message.includes("hợp đồng đã khai báo") ||
              message.includes("kg) vượt quá") ||
              message.includes("VND) vượt quá") ||
              message.includes("từ các dòng") ||
              message.includes("đã khai báo") ||
              message.includes("các dòng hợp đồng") ||
              message.includes("đã khai báo (") ||
              message.includes(") vượt quá") ||
              message.includes("quản lý doanh nghiệp") ||
              message.includes("thông tin bên mua") ||
              message.includes("Số hợp đồng") ||
              message.includes("khối lượng từ các dòng") ||
              message.includes("trị giá từ các dòng") ||
              message.includes("vượt quá tổng khối lượng") ||
              message.includes("vượt quá tổng giá trị") ||
              message.includes("vượt quá tổng trị giá") ||
              message.includes("hiện có") ||
              message.includes("thêm") ||
              message.includes("từ các dòng hợp đồng") ||
              message.includes("Tổng khối lượng từ các dòng") ||
              message.includes("Tổng trị giá từ các dòng") ||
              message.includes("vượt quá tổng khối lượng hợp đồng") ||
              message.includes("vượt quá tổng giá trị hợp đồng") ||
              message.includes("vượt quá tổng trị giá hợp đồng") ||
              message.includes("Tổng khối lượng từ các dòng hợp đồng") ||
              message.includes("Tổng trị giá từ các dòng hợp đồng") ||
              message.includes(
                "vượt quá tổng khối lượng hợp đồng đã khai báo"
              ) ||
              message.includes("vượt quá tổng giá trị hợp đồng đã khai báo") ||
              message.includes("vượt quá tổng trị giá hợp đồng đã khai báo") ||
              message.includes("Tổng khối lượng từ các dòng hợp đồng (") ||
              message.includes("Tổng trị giá từ các dòng hợp đồng (") ||
              message.includes(
                "vượt quá tổng khối lượng hợp đồng đã khai báo ("
              ) ||
              message.includes(
                "vượt quá tổng giá trị hợp đồng đã khai báo ("
              ) ||
              message.includes(
                "vượt quá tổng trị giá hợp đồng đã khai báo ("
              ) ||
              message.includes("kg) vượt quá tổng khối lượng") ||
              message.includes("VND) vượt quá tổng giá trị") ||
              message.includes(
                "vượt quá tổng khối lượng hợp đồng đã khai báo"
              ) ||
              message.includes("vượt quá tổng giá trị hợp đồng đã khai báo") ||
              message.includes("vượt quá tổng trị giá hợp đồng đã khai báo");

            if (isBusinessError) {
              newBusinessErrors.push(message);
            } else {
              // Xử lý lỗi cho contract delivery items (dạng: ContractDeliveryItems[0].PlannedQuantity)
              if (
                field.startsWith("ContractDeliveryItems[") &&
                field.includes("].")
              ) {
                const match = field.match(
                  /ContractDeliveryItems\[(\d+)\]\.(\w+)/
                );
                if (match) {
                  const index = match[1];
                  const itemField = match[2];
                  newFieldErrors[
                    `contractDeliveryItems.${index}.${itemField.toLowerCase()}`
                  ] = message;
                }
              } else {
                // Xử lý lỗi cho các field chính
                newFieldErrors[field] = message;
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

        // Hiển thị toast với thông tin cụ thể
        if (
          Object.keys(newFieldErrors).length > 0 ||
          newBusinessErrors.length > 0
        ) {
          toast.error(
            t("contractDeliveryBatches.form.messages.checkFormErrors")
          );
        }
      } else {
        // Xử lý lỗi khác
        const errorMessage = getErrorMessage(err);
        toast.error(
          errorMessage || t("contractDeliveryBatches.form.messages.saveError")
        );
      }
    }
  }

  const dateString = toDateOnly(formData.expectedDeliveryDate);

  // ---------- UI ----------
  return (
    <form className="max-w-4xl mx-auto bg-white border rounded-2xl shadow p-8 space-y-6">
      <h2 className="text-2xl font-semibold text-center mb-6">
        {isEdit
          ? t("contractDeliveryBatches.form.title.edit")
          : t("contractDeliveryBatches.form.title.create")}
      </h2>

      {/* Hiển thị lỗi nghiệp vụ */}
      {businessErrors.length > 0 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-orange-800 font-medium">
              {t("contractDeliveryBatches.form.businessRules.title")}
            </h3>
            <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
              {businessErrors.length} quy tắc
            </span>
          </div>

          {/* Tóm tắt nhanh */}
          <div className="mb-3 p-2 bg-orange-100 rounded text-orange-800 text-sm">
            <strong>�� Tóm tắt:</strong>
            {businessErrors.some((err) => err.includes("vượt quá")) &&
              " Cần điều chỉnh tổng khối lượng/giá trị đợt giao"}
            {businessErrors.some((err) => err.includes("cùng loại")) &&
              " Cần loại bỏ mặt hàng trùng loại"}
            {businessErrors.some((err) => err.includes("đã tồn tại")) &&
              " Cần đổi thông tin đợt giao"}
            {businessErrors.some((err) => err.includes("không có quyền")) &&
              " Cần liên hệ admin"}
          </div>

          {/* Hướng dẫn giải quyết */}
          <div className="mt-3 pt-3 border-t border-orange-200">
            <p className="text-orange-600 text-sm font-medium mb-2">
              💡 Hướng dẫn:
            </p>
            <ul className="text-orange-600 text-xs space-y-1">
              {businessErrors.some((err) => err.includes("vượt quá")) && (
                <>
                  <li>• Kiểm tra lại tổng khối lượng của các mặt hàng</li>
                  <li>
                    • Đảm bảo tổng từ các mặt hàng không vượt quá tổng đã khai
                    báo
                  </li>
                  <li>• Hoặc tăng tổng khối lượng đợt giao lên</li>
                  {(() => {
                    const total = sumPlannedQuantity();
                    return (
                      <>
                        <li>• Tổng từ mặt hàng: {total.toFixed(1)} kg</li>
                        <li>
                          • Tổng đợt giao hiện tại:{" "}
                          {formData?.totalPlannedQuantity || 0} kg
                        </li>
                        <li className="mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const total = sumPlannedQuantity();
                              handleChange("totalPlannedQuantity", total);
                              toast.success(
                                t(
                                  "contractDeliveryBatches.form.messages.autoUpdateTotalSuccess"
                                )
                              );
                            }}
                            className="text-xs h-6 px-2"
                          >
                            {t(
                              "contractDeliveryBatches.form.actions.autoUpdateTotal"
                            )}
                          </Button>
                        </li>
                      </>
                    );
                  })()}
                </>
              )}
              {businessErrors.some((err) => err.includes("cùng loại")) && (
                <li>• Không được có 2 dòng đợt giao cùng loại cà phê</li>
              )}
              {businessErrors.some((err) => err.includes("đã tồn tại")) && (
                <li>• Thông tin đợt giao đã tồn tại, hãy đổi thông tin khác</li>
              )}
              {businessErrors.some((err) => err.includes("không có quyền")) && (
                <li>• Liên hệ admin để được cấp quyền phù hợp</li>
              )}
              {businessErrors.some((err) => err.includes("không được âm")) && (
                <li>• Kiểm tra các giá trị số không được âm</li>
              )}
              {businessErrors.some(
                (err) =>
                  err.includes("phải lớn hơn") || err.includes("phải nhỏ hơn")
              ) && <li>• Kiểm tra các điều kiện về giá trị min/max</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Hợp đồng */}
      {contractId ? (
        <div>
          <label className="block mb-1 text-sm font-medium">
            {t("contractDeliveryBatches.form.fields.contract")}
          </label>
          <Input value={contractId} disabled />
        </div>
      ) : (
        <div>
          <label className="block mb-1 text-sm font-medium">
            {t("contractDeliveryBatches.form.fields.contract")}{" "}
            <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.contractId}
            onChange={(e) => handleChange("contractId", e.target.value)}
            className={`w-full p-2 border rounded ${
              hasFieldError("contractId") ? "border-red-500" : ""
            }`}
            required
          >
            <option value="">
              {t("contractDeliveryBatches.form.placeholders.selectContract")}
            </option>
            {contractOptions.map((c) => (
              <option key={c.contractId} value={c.contractId}>
                {c.contractNumber}
                {c.remainingQuantity !== undefined &&
                  c.totalQuantity !== undefined &&
                  c.remainingQuantity > 0 &&
                  ` - Còn lại: ${c.remainingQuantity.toLocaleString()} kg / ${c.totalQuantity.toLocaleString()} kg`}
                {c.existingBatches !== undefined &&
                  c.existingBatches > 0 &&
                  ` (${c.existingBatches} đợt giao)`}
                {c.remainingQuantity === 0 && ` - Đã đủ đợt giao`}
              </option>
            ))}
          </select>
          {hasFieldError("contractId") && (
            <p className="text-red-500 text-xs mt-1">
              {getFieldError("contractId")}
            </p>
          )}

          {/* Thông báo hướng dẫn */}
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start gap-2">
              <div className="text-blue-600 mt-0.5">ℹ️</div>
              <div className="text-blue-800 text-sm">
                <p className="font-medium mb-1">
                  {t("contractDeliveryBatches.form.contractSelection.title")}
                </p>
                <ul className="text-xs space-y-1">
                  <li>
                    {t(
                      "contractDeliveryBatches.form.contractSelection.onlyAvailableContracts"
                    )}
                  </li>
                  <li>
                    {t(
                      "contractDeliveryBatches.form.contractSelection.displayFormat"
                    )}
                  </li>
                  <li>
                    {t(
                      "contractDeliveryBatches.form.contractSelection.autoDeliveryRound"
                    )}
                  </li>
                  <li>
                    {t(
                      "contractDeliveryBatches.form.contractSelection.completedContractsHidden"
                    )}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fields chính */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium">
            {t("contractDeliveryBatches.form.fields.deliveryRound")}{" "}
            <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            min={1}
            value={formData.deliveryRound}
            onChange={(e) =>
              handleChange("deliveryRound", Number(e.target.value))
            }
            className={`no-spinner ${
              hasFieldError("deliveryRound") ? "border-red-500" : ""
            }`}
            onKeyDown={(e) => {
              if (e.key === "-" || e.key.toLowerCase() === "e")
                e.preventDefault();
            }}
          />
          {hasFieldError("deliveryRound") && (
            <p className="text-red-500 text-xs mt-1">
              {getFieldError("deliveryRound")}
            </p>
          )}
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">
            {t("contractDeliveryBatches.form.fields.expectedDeliveryDate")}{" "}
            <span className="text-red-500">*</span>
          </label>
          <DatePicker
            value={dateString}
            onChange={(d) =>
              handleChange("expectedDeliveryDate", fromDateOnly(d))
            }
            error={hasFieldError("expectedDeliveryDate")}
            errorMessage={getFieldError("expectedDeliveryDate")}
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">
            {t("contractDeliveryBatches.form.fields.totalPlannedQuantity")}{" "}
            <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            min={0.1}
            step={0.1}
            value={formData.totalPlannedQuantity}
            onChange={(e) =>
              handleChange("totalPlannedQuantity", Number(e.target.value))
            }
            className={`no-spinner ${
              hasFieldError("totalPlannedQuantity") ? "border-red-500" : ""
            }`}
            onKeyDown={(e) => {
              if (e.key === "-" || e.key.toLowerCase() === "e")
                e.preventDefault();
            }}
          />
          {hasFieldError("totalPlannedQuantity") && (
            <p className="text-red-500 text-xs mt-1">
              {getFieldError("totalPlannedQuantity")}
            </p>
          )}
        </div>
      </div>

      {/* Trạng thái */}
      {isEdit ? (
        <div>
          <label className="block mb-1 text-sm font-medium">
            {t("contractDeliveryBatches.form.fields.status")}
          </label>
          <select
            className="w-full p-2 border rounded"
            value={formData.status}
            onChange={(e) =>
              handleChange(
                "status",
                e.target.value as ContractDeliveryBatchStatus
              )
            }
          >
            {Object.values(ContractDeliveryBatchStatus)
              .filter(
                (status) => status !== ContractDeliveryBatchStatus.Planned
              )
              .map((s) => (
                <option key={s} value={s}>
                  {getContractDeliveryBatchStatusLabel(s, t)}
                </option>
              ))}
          </select>
        </div>
      ) : (
        <div>
          <label className="block mb-1 text-sm font-medium">
            {t("contractDeliveryBatches.form.fields.status")}
          </label>
          <div className="p-2 border rounded bg-gray-50">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              {getContractDeliveryBatchStatusLabel(
                ContractDeliveryBatchStatus.InProgress,
                t
              )}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {t("contractDeliveryBatches.form.status.defaultNote")}
          </p>
        </div>
      )}

      {/* Ghi chú */}
      <div>
        <label className="block mb-1 text-sm font-medium">
          {t("contractDeliveryBatches.form.fields.note")}
        </label>
        <Textarea
          placeholder={t("contractDeliveryBatches.form.placeholders.note")}
          value={formData.note || ""}
          onChange={(e) => handleChange("note", e.target.value)}
        />
      </div>

      {/* Danh sách mặt hàng */}
      <div>
        <label className="block mb-1 text-sm font-medium">
          {t("contractDeliveryBatches.form.fields.deliveryItems")}{" "}
          <span className="text-red-500">*</span>
        </label>

        {/* Hiển thị lỗi tổng quát cho contract delivery items */}
        {hasFieldError("contractDeliveryItems") && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm font-medium">
              {getFieldError("contractDeliveryItems")}
            </p>
          </div>
        )}

        {(formData.contractDeliveryItems?.length ?? 0) > 0 && (
          <div
            className={`hidden md:grid gap-2 mb-1 text-xs font-medium text-muted-foreground ${
              isEdit ? "md:grid-cols-7" : "md:grid-cols-6"
            }`}
          >
            <span>
              {t("contractDeliveryBatches.form.table.headers.coffeeType")}{" "}
              <span className="text-red-500">*</span>
            </span>
            <span className="text-left">
              {t("contractDeliveryBatches.form.table.headers.quantity")}{" "}
              <span className="text-red-500">*</span>
            </span>
            {isEdit && (
              <span className="text-left">
                {t("contractDeliveryBatches.form.table.headers.fulfilled")}
              </span>
            )}
            <span className={isEdit ? "col-span-3" : "col-span-3"}>
              {t("contractDeliveryBatches.form.table.headers.note")}
            </span>
            <span></span>
          </div>
        )}

        {(formData.contractDeliveryItems || []).map((row, idx) => (
          <div
            key={idx}
            className={`grid grid-cols-1 gap-2 mb-2 ${
              isEdit ? "md:grid-cols-7" : "md:grid-cols-6"
            }`}
          >
            <select
              value={row.contractItemId}
              onChange={(e) => updateRow(idx, "contractItemId", e.target.value)}
              className={`p-2 border rounded ${
                hasFieldError(`contractDeliveryItems.${idx}.contractItemId`)
                  ? "border-red-500"
                  : ""
              }`}
              disabled={loadingItems || !itemOptions.length}
            >
              <option value="">
                {t(
                  "contractDeliveryBatches.form.placeholders.selectCoffeeType"
                )}
              </option>
              {itemOptions.map((opt) => (
                <option key={opt.contractItemId} value={opt.contractItemId}>
                  {opt.coffeeTypeName}
                </option>
              ))}
            </select>
            {hasFieldError(`contractDeliveryItems.${idx}.contractItemId`) && (
              <p className="text-red-500 text-xs mt-1">
                {getFieldError(`contractDeliveryItems.${idx}.contractItemId`)}
              </p>
            )}

            <Input
              type="number"
              min={0.1}
              step={0.1}
              value={row.plannedQuantity ?? 0}
              onChange={(e) =>
                updateRow(idx, "plannedQuantity", e.target.value)
              }
              className={`no-spinner text-left ${
                hasFieldError(`contractDeliveryItems.${idx}.plannedQuantity`)
                  ? "border-red-500"
                  : ""
              }`}
              onKeyDown={(e) => {
                if (e.key === "-" || e.key.toLowerCase() === "e")
                  e.preventDefault();
              }}
            />
            {hasFieldError(`contractDeliveryItems.${idx}.plannedQuantity`) && (
              <p className="text-red-500 text-xs mt-1">
                {getFieldError(`contractDeliveryItems.${idx}.plannedQuantity`)}
              </p>
            )}

            {/* Hiển thị khối lượng đã giao */}
            {isEdit && (
              <Input
                type="number"
                min={0}
                step={0.1}
                value={row.fulfilledQuantity ?? 0}
                onChange={(e) => {
                  updateRow(idx, "fulfilledQuantity", Number(e.target.value));
                }}
                className="no-spinner text-left"
                title={t(
                  "contractDeliveryBatches.form.table.headers.fulfilled"
                )}
              />
            )}

            <Input
              placeholder={t(
                "contractDeliveryBatches.form.placeholders.itemNote"
              )}
              value={row.note || ""}
              onChange={(e) => updateRow(idx, "note", e.target.value)}
              className={isEdit ? "md:col-span-3" : "md:col-span-3"}
            />

            <Button
              type="button"
              variant="destructive"
              onClick={() => removeRow(idx)}
              className="whitespace-nowrap"
            >
              {t("contractDeliveryBatches.form.actions.remove")}
            </Button>
          </div>
        ))}

        <div className="flex items-center justify-between mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={addRow}
            disabled={!formData.contractId || loadingItems}
          >
            {t("contractDeliveryBatches.form.actions.addRow")}
          </Button>

          <div className="text-sm text-gray-600">
            {t("contractDeliveryBatches.form.summary.totalQuantity")}{" "}
            <strong>{sumPlannedQuantity().toLocaleString()}</strong> kg
            {isEdit && (
              <>
                <br />
                {t("contractDeliveryBatches.form.summary.totalFulfilled")}{" "}
                <strong
                  className={
                    sumFulfilledQuantity() >= sumPlannedQuantity()
                      ? "text-green-600"
                      : "text-blue-600"
                  }
                >
                  {sumFulfilledQuantity().toLocaleString()}
                </strong>{" "}
                kg
                {sumFulfilledQuantity() >= sumPlannedQuantity() && (
                  <span className="ml-2 text-green-600">
                    {t("contractDeliveryBatches.form.summary.completed")}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <DialogFooter className="flex justify-between pt-4">
        <Button type="submit" onClick={handleSubmit}>
          <h2>
            {isEdit
              ? t("contractDeliveryBatches.form.actions.save")
              : t("contractDeliveryBatches.form.actions.create")}
          </h2>
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {t("contractDeliveryBatches.form.actions.back")}
        </Button>
      </DialogFooter>
    </form>
  );
}
