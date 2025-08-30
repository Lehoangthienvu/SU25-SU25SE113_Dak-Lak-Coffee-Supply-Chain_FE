"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/DatePicker";
import { DialogFooter } from "@/components/ui/dialog";

import {
  createOrder,
  updateOrder,
  getOrderDetails,
  type OrderCreateDto,
  type OrderUpdateDto,
} from "@/lib/api/orders";
import {
  getContractDeliveryBatchById,
  buildCdiOptions,
  type ContractDeliveryBatchViewDetailsDto,
  getAllContractDeliveryBatches,
} from "@/lib/api/contractDeliveryBatches";
import { getProductOptions, type ProductOption } from "@/lib/api/products";
import { OrderStatus } from "@/lib/constants/orderStatus";

type Props = {
  initialData?: OrderUpdateDto; // nếu có -> Edit; nếu không -> Create
  deliveryBatchId?: string; // có thể truyền sẵn khi tạo từ trang đợt giao
  onSuccess: () => void;
};

/** Dòng sản phẩm trong form */
type OrderItemRow = {
  orderItemId?: string; // chỉ có khi edit
  contractDeliveryItemId: string;
  productId: string;
  quantity: number | "";
  unitPrice: number | "";
  /** UI dùng %; khi submit sẽ convert sang amount */
  discountAmount?: number | ""; // %
  note?: string;
};

type FormState = {
  deliveryBatchId: string;
  deliveryRound?: number | "";
  /** Dùng string để bind với input type="date" */
  orderDate?: string; // yyyy-MM-dd (sẽ convert -> ISO khi submit)
  actualDeliveryDate?: string; // yyyy-MM-dd
  note?: string;
  status: OrderStatus;
  cancelReason?: string;
  orderItems: OrderItemRow[];
};

export default function OrderForm({
  initialData,
  deliveryBatchId,
  onSuccess,
}: Props) {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const router = useRouter();

  // Options
  type DeliveryItemOption = { contractDeliveryItemId: string; name: string };
  const [deliveryItemOptions, setDeliveryItemOptions] = useState<
    DeliveryItemOption[]
  >([]);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [batchOptions, setBatchOptions] = useState<
    { id: string; label: string }[]
  >([]);

  // UI giảm theo %
  const DISCOUNT_IS_PERCENT = true;

  // Hiển thị code đợt giao
  const [deliveryBatchCode, setDeliveryBatchCode] = useState<string>("");

  // Thêm state cho error handling
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [businessErrors, setBusinessErrors] = useState<string[]>([]);

  // -------------------- form state (không-null để tránh lỗi hooks) --------------------
  const [form, setForm] = useState<FormState>({
    deliveryBatchId: deliveryBatchId ?? "",
    deliveryRound: "",
    orderDate: undefined,
    actualDeliveryDate: undefined,
    note: "",
    status: OrderStatus.Pending,
    cancelReason: "",
    orderItems: [],
  });

  // Map dữ liệu edit -> form
  useEffect(() => {
    if (!initialData) return;

    // orderDate từ BE là ISO -> cắt yyyy-MM-dd cho input date
    const orderDateStr = initialData.orderDate
      ? String(initialData.orderDate).substring(0, 10)
      : undefined;

    setForm({
      deliveryBatchId: initialData.deliveryBatchId,
      deliveryRound: initialData.deliveryRound ?? "",
      orderDate: orderDateStr,
      actualDeliveryDate: initialData.actualDeliveryDate ?? undefined, // đã yyyy-MM-dd
      note: initialData.note ?? "",
      status: initialData.status ?? OrderStatus.Pending,
      cancelReason: initialData.cancelReason ?? "",
      orderItems: (initialData.orderItems ?? []).map(
        (it): OrderItemRow => ({
          orderItemId: it.orderItemId,
          contractDeliveryItemId: it.contractDeliveryItemId,
          productId: it.productId,
          quantity: typeof it.quantity === "number" ? it.quantity : "",
          unitPrice: typeof it.unitPrice === "number" ? it.unitPrice : "",
          // UI hiển thị %: nếu BE lưu amount, bạn có thể để 0 hoặc tính ngược lại tuỳ nhu cầu
          discountAmount: 0,
          note: it.note ?? "",
        })
      ),
    });
  }, [initialData]);

  // Load options theo đợt giao + danh sách sản phẩm
  useEffect(() => {
    (async () => {
      if (!form.deliveryBatchId) {
        // clear khi chưa chọn đợt giao
        setDeliveryItemOptions([]);
        setDeliveryBatchCode("");
        return;
      }
      setLoadingOptions(true);
      try {
        // Lấy viewDetails của đợt giao
        const details = (await getContractDeliveryBatchById(
          form.deliveryBatchId
        )) as ContractDeliveryBatchViewDetailsDto;

        // Set mã đợt giao và gợi ý số đợt nếu form đang trống
        setDeliveryBatchCode(details.deliveryBatchCode || "");
        if (form.deliveryRound === "" || form.deliveryRound === undefined) {
          setField("deliveryRound", details.deliveryRound ?? "");
        }

        // Build options cho dropdown "Mặt hàng đợt giao"
        // viewDetails dùng deliveryItemId -> map sang contractDeliveryItemId cho UI
        const opts = (details.contractDeliveryItems ?? []).map((x) => ({
          contractDeliveryItemId: x.deliveryItemId,
          name: `${x.coffeeTypeName} — KH: ${x.plannedQuantity}`,
        }));
        setDeliveryItemOptions(opts);

        // 4) Product options
        const products = await getProductOptions();
        setProductOptions(products ?? []);
      } catch (e) {
        console.error(e);
        toast.error(t('managerOrders.form.errors.loadDeliveryBatch'));
      } finally {
        setLoadingOptions(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.deliveryBatchId]);

  // Khi chưa có deliveryBatchId, load danh sách đợt giao để chọn
  useEffect(() => {
    if (form.deliveryBatchId) return;
    (async () => {
      try {
        const all = await getAllContractDeliveryBatches();
        setBatchOptions(
          (all ?? []).map((b) => ({
            id: b.deliveryBatchId,
            label: `${b.deliveryBatchCode} — ${b.contractNumber}`,
          }))
        );
      } catch (e) {
        console.error(e);
        toast.error(t('managerOrders.form.errors.loadDeliveryBatches'));
      }
    })();
  }, [form.deliveryBatchId]);

  // Helpers
  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...(prev as FormState), [key]: value }));

    // Clear field error when user starts typing
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }

    // Clear business errors when user makes any change
    if (businessErrors.length > 0) {
      setBusinessErrors([]);
    }
  };

  const ensureItems = () =>
    setForm((prev) => ({
      ...(prev as FormState),
      orderItems: Array.isArray(prev?.orderItems) ? prev!.orderItems : [],
    }));

  const addRow = () => {
    ensureItems();
    setForm((prev) => ({
      ...(prev as FormState),
      orderItems: [
        ...((prev as FormState).orderItems || []),
        {
          contractDeliveryItemId: "",
          productId: "",
          quantity: "",
          unitPrice: "",
          discountAmount: 0, // %
          note: "",
        },
      ],
    }));
  };

  const updateRow = <K extends keyof OrderItemRow>(
    idx: number,
    key: K,
    value: OrderItemRow[K]
  ) => {
    setForm((prev) => {
      const base = { ...(prev as FormState) };
      const arr = [...(base.orderItems || [])];
      arr[idx] = {
        ...arr[idx],
        [key]:
          key === "quantity" || key === "unitPrice" || key === "discountAmount"
            ? ((value === "" ? "" : Number(value)) as any)
            : (value as any),
      };
      base.orderItems = arr;
      return base;
    });

    // Clear field error when user starts typing
    const fieldKey = `orderItems.${idx}.${key}`;
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
  };

  const removeRow = (idx: number) =>
    setForm((prev) => {
      const base = { ...(prev as FormState) };
      const arr = [...(base.orderItems || [])];
      arr.splice(idx, 1);
      base.orderItems = arr;
      return base;
    });

  // Helper function to get error for a specific field
  const getFieldError = (fieldName: string): string | undefined => {
    return fieldErrors[fieldName];
  };

  // Helper function to check if field has error
  const hasFieldError = (fieldName: string): boolean => {
    return !!fieldErrors[fieldName];
  };

  // Helper function to get error for order item field
  const getOrderItemError = (
    index: number,
    field: string
  ): string | undefined => {
    return fieldErrors[`orderItems.${index}.${field}`];
  };

  // Helper function to check if order item field has error
  const hasOrderItemError = (index: number, field: string): boolean => {
    return !!fieldErrors[`orderItems.${index}.${field}`];
  };

  // Tính tổng
  const items = form.orderItems ?? [];

  const lineTotal = (r: OrderItemRow) => {
    const qty = Number(r.quantity) || 0;
    const price = Number(r.unitPrice) || 0;
    const discPercent = Number(r.discountAmount) || 0;
    return Math.max(qty * price * (1 - discPercent / 100), 0);
  };

  const totalQuantity = useMemo(
    () => items.reduce((s, x) => s + (Number(x.quantity) || 0), 0),
    [items]
  );

  const totalAmount = useMemo(
    () => items.reduce((s, x) => s + lineTotal(x), 0),
    [items]
  );

  const fmtVnd = (n: number) =>
    new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(n);

  const [saving, setSaving] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    // Clear previous errors
    setFieldErrors({});
    setBusinessErrors([]);

    const data = form;

    // Validate
    const clientErrors: Record<string, string> = {};

    if (!data.deliveryBatchId) {
      clientErrors.deliveryBatchId = t('managerOrders.form.validation.selectDeliveryBatch');
    }
    if (!data.orderItems.length) {
      clientErrors.orderItems = t('managerOrders.form.validation.addAtLeastOneItem');
    } else {
      data.orderItems.forEach((item, index) => {
        if (!item.contractDeliveryItemId) {
          clientErrors[`orderItems.${index}.contractDeliveryItemId`] =
            t('managerOrders.form.validation.selectDeliveryItem');
        }
        if (!item.productId) {
          clientErrors[`orderItems.${index}.productId`] =
            t('managerOrders.form.validation.selectProduct');
        }
        if (!(Number(item.quantity) > 0)) {
          clientErrors[`orderItems.${index}.quantity`] =
            t('managerOrders.form.validation.quantityRequired');
        }
        if (!(Number(item.unitPrice) > 0)) {
          clientErrors[`orderItems.${index}.unitPrice`] =
            t('managerOrders.form.validation.unitPriceRequired');
        }
      });
    }

    // Validate ngày giao thực tế không được trước ngày tạo đơn hàng
    if (data.actualDeliveryDate && data.orderDate) {
      const actualDate = new Date(data.actualDeliveryDate);
      const orderDate = new Date(data.orderDate);
      if (actualDate < orderDate) {
        clientErrors.actualDeliveryDate =
          t('managerOrders.form.validation.actualDeliveryDateBeforeOrderDate');
      }
    }

    // If there are client-side errors, display them and stop
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      toast.error(t('managerOrders.form.validation.checkFormErrors'));
      return;
    }

    // Convert ngày: yyyy-MM-dd -> ISO (orderDate) và giữ yyyy-MM-dd (actual)
    const orderDateIso = data.orderDate
      ? new Date(`${data.orderDate}T00:00:00`).toISOString()
      : undefined;
    const actualDeliveryDateStr = data.actualDeliveryDate || undefined;

    try {
      setSaving(true);

      if (isEdit && initialData) {
        const payload: OrderUpdateDto = {
          orderId: initialData.orderId,
          deliveryBatchId: data.deliveryBatchId,
          deliveryRound:
            data.deliveryRound === "" || data.deliveryRound === undefined
              ? null
              : Number(data.deliveryRound),
          orderDate: orderDateIso ?? undefined,
          actualDeliveryDate: actualDeliveryDateStr ?? undefined,
          note: data.note?.trim() || undefined,
          status: data.status,
          cancelReason: data.cancelReason?.trim() || undefined,
          orderItems: (data.orderItems || []).map((r) => {
            const qty = Number(r.quantity) || 0;
            const price = Number(r.unitPrice) || 0;
            const discountPercent = Number(r.discountAmount) || 0;
            const discountAmount = DISCOUNT_IS_PERCENT
              ? qty * price * (discountPercent / 100)
              : Number(r.discountAmount || 0);
            return {
              orderItemId: r.orderItemId!, // edit phải có
              orderId: initialData.orderId,
              contractDeliveryItemId: r.contractDeliveryItemId,
              productId: r.productId,
              quantity: qty,
              unitPrice: price,
              discountAmount,
              note: r.note?.trim() || undefined,
            };
          }),
        };

        // Tạo promise gốc
        const req = updateOrder(payload.orderId, payload);
        // Hiển thị toast theo trạng thái promise
        toast.promise(req, {
          loading: t('managerOrders.form.actions.updating'),
          success: t('managerOrders.form.actions.updateSuccess'),
          error: t('managerOrders.form.actions.updateError'),
        });
        // Quan trọng: chờ promise gốc -> nếu fail sẽ nhảy vào catch, KHÔNG gọi onSuccess
        await req;
      } else {
        const payload: OrderCreateDto = {
          deliveryBatchId: data.deliveryBatchId,
          deliveryRound:
            data.deliveryRound === "" || data.deliveryRound === undefined
              ? null
              : Number(data.deliveryRound),
          orderDate: orderDateIso ?? null,
          actualDeliveryDate: actualDeliveryDateStr ?? null,
          note: data.note?.trim() ?? null,
          status: data.status,
          cancelReason: data.cancelReason?.trim() ?? null,
          orderItems: (data.orderItems || []).map((r) => {
            const qty = Number(r.quantity) || 0;
            const price = Number(r.unitPrice) || 0;
            const discountPercent = Number(r.discountAmount) || 0;
            const discountAmount = DISCOUNT_IS_PERCENT
              ? qty * price * (discountPercent / 100)
              : Number(r.discountAmount || 0);
            return {
              contractDeliveryItemId: r.contractDeliveryItemId,
              productId: r.productId,
              quantity: qty,
              unitPrice: price,
              discountAmount,
              note: r.note?.trim() || undefined,
            };
          }),
        };

        const req = createOrder(payload);
        toast.promise(req, {
          loading: t('managerOrders.form.actions.creating'),
          success: t('managerOrders.form.actions.createSuccess'),
          error: t('managerOrders.form.actions.createError'),
        });
        await req;
      }

      // Chỉ gọi khi request thành công
      onSuccess();
    } catch (err) {
      // KHÔNG log console.error để tránh hiển thị error box
      // console.error(err);

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
              message.includes("vượt quá tổng trị giá hợp đồng đã khai báo") ||
              message.includes("Lô giao hàng này đã có đơn hàng") ||
              message.includes("Bạn không có quyền") ||
              message.includes("Không tìm thấy lô giao hàng") ||
              message.includes("Không tìm thấy Manager hoặc Staff") ||
              message.includes("Ngày đặt hàng không được vượt quá") ||
              message.includes("Ngày giao thực tế không được") ||
              message.includes("Đơn hàng phải có ít nhất") ||
              message.includes("Có sản phẩm bị trùng lặp") ||
              message.includes("Đợt giao hàng phải lớn hơn") ||
              message.includes("Giảm giá không được vượt quá") ||
              message.includes("Giảm giá không được âm");

            if (isBusinessError) {
              newBusinessErrors.push(message);
            } else {
              // Xử lý lỗi cho order items (dạng: OrderItems[0].Quantity)
              if (field.startsWith("OrderItems[") && field.includes("].")) {
                const match = field.match(/OrderItems\[(\d+)\]\.(\w+)/);
                if (match) {
                  const index = match[1];
                  const itemField = match[2];
                  newFieldErrors[
                    `orderItems.${index}.${itemField.toLowerCase()}`
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
          toast.error(t('managerOrders.form.errors.checkFormErrors'));
        }
      } else {
        // Xử lý lỗi khác - kiểm tra message trực tiếp
        let errorMessage = t('managerOrders.form.errors.saveOrderError');

        if (err && typeof err === "object" && "message" in err) {
          const message = String(err.message);

          // Kiểm tra các lỗi nghiệp vụ cụ thể
          if (message.includes("Lô giao hàng này đã có đơn hàng")) {
            setBusinessErrors([message]);
            errorMessage = t('managerOrders.form.errors.businessError') + message;
          } else if (message.includes("Bạn không có quyền")) {
            setBusinessErrors([message]);
            errorMessage = t('managerOrders.form.errors.accessError') + message;
          } else if (message.includes("Không tìm thấy")) {
            setBusinessErrors([message]);
            errorMessage = t('managerOrders.form.errors.dataError') + message;
          }
        }

        toast.error(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="max-w-5xl mx-auto bg-white border rounded-2xl shadow p-8 space-y-6">
      <h2 className="text-2xl font-semibold text-center">
        {isEdit ? t('managerOrders.edit.title') : t('managerOrders.create.title')}
      </h2>

      {/* Hiển thị lỗi nghiệp vụ */}
      {businessErrors.length > 0 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-orange-800 font-medium">
              {t('managerOrders.form.businessRules.title')}
            </h3>
            <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
              {businessErrors.length} {t('managerOrders.form.businessRules.rules')}
            </span>
          </div>

          {/* Tóm tắt nhanh */}
          <div className="mb-3 p-2 bg-orange-100 rounded text-orange-800 text-sm">
            <strong> {t('managerOrders.form.businessRules.summary')}:</strong>
            {businessErrors.some((err) => err.includes("vượt quá")) &&
              ` ${t('managerOrders.form.businessRules.adjustOrderInfo')}`}
            {businessErrors.some((err) => err.includes("cùng loại")) &&
              ` ${t('managerOrders.form.businessRules.removeDuplicateProducts')}`}
            {businessErrors.some((err) => err.includes("đã tồn tại")) &&
              ` ${t('managerOrders.form.businessRules.changeOrderInfo')}`}
            {businessErrors.some((err) => err.includes("không có quyền")) &&
              ` ${t('managerOrders.form.businessRules.contactAdmin')}`}
            {businessErrors.some((err) =>
              err.includes("Lô giao hàng này đã có đơn hàng")
            ) && ` ${t('managerOrders.form.businessRules.deliveryBatchUsed')}`}
            {businessErrors.some((err) => err.includes("Không tìm thấy")) &&
              ` ${t('managerOrders.form.businessRules.dataNotFound')}`}
          </div>

          {/* Hướng dẫn giải quyết */}
          <div className="mt-3 pt-3 border-t border-orange-200">
            <p className="text-orange-600 text-sm font-medium mb-2">
              💡 {t('managerOrders.form.businessRules.guidance')}:
            </p>
            <ul className="text-orange-600 text-xs space-y-1">
              {businessErrors.some((err) => err.includes("vượt quá")) && (
                <li>• {t('managerOrders.form.businessRules.checkOrderInfo')}</li>
              )}
              {businessErrors.some((err) => err.includes("cùng loại")) && (
                <li>• {t('managerOrders.form.businessRules.noDuplicateProducts')}</li>
              )}
              {businessErrors.some((err) => err.includes("đã tồn tại")) && (
                <li>• {t('managerOrders.form.businessRules.orderInfoExists')}</li>
              )}
              {businessErrors.some((err) => err.includes("không có quyền")) && (
                <li>• {t('managerOrders.form.businessRules.contactAdminForPermission')}</li>
              )}
              {businessErrors.some((err) =>
                err.includes("Lô giao hàng này đã có đơn hàng")
              ) && <li>• {t('managerOrders.form.businessRules.oneOrderPerBatch')}</li>}
              {businessErrors.some((err) =>
                err.includes("Ngày đặt hàng không được vượt quá")
              ) && <li>• {t('managerOrders.form.businessRules.orderDateNotExceedCurrent')}</li>}
              {businessErrors.some((err) =>
                err.includes("Ngày giao thực tế không được")
              ) && <li>• {t('managerOrders.form.businessRules.deliveryDateNotBeforeOrder')}</li>}
              {businessErrors.some((err) =>
                err.includes("Giảm giá không được vượt quá")
              ) && <li>• {t('managerOrders.form.businessRules.discountNotExceedTotal')}</li>}
              {businessErrors.some((err) =>
                err.includes("Giảm giá không được âm")
              ) && <li>• {t('managerOrders.form.businessRules.discountNotNegative')}</li>}
              {businessErrors.some((err) => err.includes("Không tìm thấy")) && (
                <li>• {t('managerOrders.form.businessRules.dataNotExists')}</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* DeliveryBatch */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Đợt giao (create = select, edit = read-only) */}
        <div>
          <label className="block mb-1 text-sm font-medium">{t('managerOrders.form.fields.deliveryBatch')}</label>

          {!isEdit ? (
            // CREATE: cho phép chọn
            <select
              className={`w-full p-2 border rounded ${
                hasFieldError("deliveryBatchId") ? "border-red-500" : ""
              }`}
              value={form.deliveryBatchId}
              onChange={(e) => {
                const id = e.target.value;
                setField("deliveryBatchId", id);
                // tùy chọn: cập nhật code tức thời từ batchOptions
                const found = batchOptions.find((b) => b.id === id);
                if (found)
                  setDeliveryBatchCode(found.label.split(" — ")[0] || "");
                // effect sau đó sẽ fetch viewDetails và đồng bộ lại mọi thứ
              }}
            >
              <option value="">-- {t('managerOrders.form.placeholders.selectDeliveryBatch')} --</option>
              {batchOptions.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          ) : (
            // EDIT: chỉ hiển thị code đọc-chỉ để biết đang thuộc đợt nào
            <Input
              value={deliveryBatchCode || "—"}
              readOnly
              className="bg-muted/40"
            />
          )}
          {hasFieldError("deliveryBatchId") && (
            <p className="text-red-500 text-xs mt-1">
              {getFieldError("deliveryBatchId")}
            </p>
          )}
        </div>

        {/* Số đợt */}
        <div>
          <label className="block mb-1 text-sm font-medium">{t('managerOrders.form.fields.deliveryRound')}</label>
          <Input
            type="number"
            value={form.deliveryRound ?? ""}
            onChange={(e) =>
              setField(
                "deliveryRound",
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
            className="no-spinner"
            onKeyDown={(e) => {
              if (e.key === "-" || e.key.toLowerCase() === "e")
                e.preventDefault();
            }}
          />
        </div>

        {/* Ngày tạo đơn hàng */}
        <div>
          <label className="block mb-1 text-sm font-medium">
            {t('managerOrders.form.fields.orderDate')}
          </label>
          <DatePicker
            value={form.orderDate}
            onChange={(v) => setField("orderDate", v)}
            placeholder="yyyy-MM-dd"
            disabled={isEdit} // Disable khi edit vì ngày tạo không được thay đổi
          />
          {isEdit && (
            <p className="text-xs text-gray-500 mt-1">
              {t('managerOrders.form.fields.orderDateCannotChange')}
            </p>
          )}
        </div>
      </div>

      {/* ActualDeliveryDate + Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium">
            {t('managerOrders.form.fields.actualDeliveryDate')}
          </label>
          <DatePicker
            value={form.actualDeliveryDate}
            onChange={(v) => setField("actualDeliveryDate", v)}
            placeholder="yyyy-MM-dd"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">{t('managerOrders.form.fields.status')}</label>
          <select
            className="w-full p-2 border rounded"
            value={form.status}
            onChange={(e) => setField("status", e.target.value as OrderStatus)}
          >
            {Object.values(OrderStatus).map((s) => (
              <option key={s} value={s}>
                {t(`managerOrders.status.${s.toLowerCase()}`)}
              </option>
            ))}
          </select>
        </div>

        {isEdit && (
          <div>
            <label className="block mb-1 text-sm font-medium">
              {t('managerOrders.form.fields.cancelReason')} {t('managerOrders.form.common.optional')}
            </label>
            <Input
              value={form.cancelReason ?? ""}
              onChange={(e) => setField("cancelReason", e.target.value)}
              placeholder={t('managerOrders.form.placeholders.cancelReason')}
              disabled={form.status !== OrderStatus.Cancelled}
            />
          </div>
        )}
      </div>

      {/* Note */}
      <div>
        <label className="block mb-1 text-sm font-medium">{t('managerOrders.form.fields.note')}</label>
        <Textarea
          placeholder={t('managerOrders.form.placeholders.note')}
          value={form.note ?? ""}
          onChange={(e) => setField("note", e.target.value)}
        />
      </div>

      {/* Order Items */}
      <div className="space-y-2">
        <label className="block mb-1 text-sm font-medium">
          {t('managerOrders.detail.productList.title')}
        </label>

        {/* Hiển thị lỗi tổng quát cho order items */}
        {hasFieldError("orderItems") && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm font-medium">
              {getFieldError("orderItems")}
            </p>
          </div>
        )}

        {(form.orderItems ?? []).length > 0 && (
          <>
            {/* Header giống contract, thêm cột Sản phẩm => 7 cột */}
            <div className="hidden md:grid md:grid-cols-7 gap-2 mb-1 text-xs font-medium text-muted-foreground">
              <span>{t('managerOrders.form.table.headers.deliveryItem')}</span>
              <span>{t('managerOrders.form.table.headers.product')}</span>
              <span>{t('managerOrders.form.table.headers.quantity')}</span>
              <span>{t('managerOrders.form.table.headers.unitPrice')}</span>
              <span>{t('managerOrders.form.table.headers.discount')}</span>
              <span>{t('managerOrders.form.table.headers.note')}</span>
              <span></span>
            </div>

            {/* Body */}
            {(form.orderItems || []).map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-7 gap-2 mb-2"
              >
                {/* Mặt hàng đợt giao */}
                <select
                  value={row.contractDeliveryItemId}
                  onChange={(e) =>
                    updateRow(idx, "contractDeliveryItemId", e.target.value)
                  }
                  className={`p-2 border rounded ${
                    hasOrderItemError(idx, "contractDeliveryItemId")
                      ? "border-red-500"
                      : ""
                  }`}
                  disabled={loadingOptions}
                >
                  <option value="">-- {t('managerOrders.form.placeholders.selectDeliveryItem')} --</option>
                  {(deliveryItemOptions ?? []).map((it) => (
                    <option
                      key={it.contractDeliveryItemId}
                      value={it.contractDeliveryItemId}
                    >
                      {it.name}
                    </option>
                  ))}
                </select>
                {hasOrderItemError(idx, "contractDeliveryItemId") && (
                  <p className="text-red-500 text-xs mt-1 md:col-span-7">
                    {getOrderItemError(idx, "contractDeliveryItemId")}
                  </p>
                )}

                {/* Sản phẩm */}
                <select
                  value={row.productId}
                  onChange={(e) => updateRow(idx, "productId", e.target.value)}
                  className={`p-2 border rounded ${
                    hasOrderItemError(idx, "productId") ? "border-red-500" : ""
                  }`}
                  disabled={loadingOptions}
                >
                  <option value="">-- {t('managerOrders.form.placeholders.selectProduct')} --</option>
                  {(productOptions ?? []).map((p) => (
                    <option key={p.productId} value={p.productId}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {hasOrderItemError(idx, "productId") && (
                  <p className="text-red-500 text-xs mt-1 md:col-span-7">
                    {getOrderItemError(idx, "productId")}
                  </p>
                )}

                {/* Số lượng */}
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={row.quantity}
                  onChange={(e) =>
                    updateRow(
                      idx,
                      "quantity",
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className={`no-spinner ${
                    hasOrderItemError(idx, "quantity") ? "border-red-500" : ""
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key.toLowerCase() === "e")
                      e.preventDefault();
                  }}
                />
                {hasOrderItemError(idx, "quantity") && (
                  <p className="text-red-500 text-xs mt-1 md:col-span-7">
                    {getOrderItemError(idx, "quantity")}
                  </p>
                )}

                {/* Đơn giá */}
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  value={row.unitPrice}
                  onChange={(e) =>
                    updateRow(
                      idx,
                      "unitPrice",
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className={`no-spinner ${
                    hasOrderItemError(idx, "unitPrice") ? "border-red-500" : ""
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key.toLowerCase() === "e")
                      e.preventDefault();
                  }}
                />
                {hasOrderItemError(idx, "unitPrice") && (
                  <p className="text-red-500 text-xs mt-1 md:col-span-7">
                    {getOrderItemError(idx, "unitPrice")}
                  </p>
                )}

                {/* Giảm trừ (%) */}
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={row.discountAmount ?? 0}
                  onChange={(e) =>
                    updateRow(
                      idx,
                      "discountAmount",
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="no-spinner"
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key.toLowerCase() === "e")
                      e.preventDefault();
                  }}
                />

                {/* Ghi chú */}
                <Input
                  placeholder={t('managerOrders.form.placeholders.note')}
                  value={row.note ?? ""}
                  onChange={(e) => updateRow(idx, "note", e.target.value)}
                />

                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => removeRow(idx)}
                >
                  {t('managerOrders.form.actions.removeItem')}
                </Button>
              </div>
            ))}
          </>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={addRow}
          disabled={loadingOptions || !form.deliveryBatchId}
        >
          {t('managerOrders.form.actions.addItem')}
        </Button>

        {/* Tổng */}
        <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
          <div>
            {t('managerOrders.form.summary.totalQuantity')}: <strong>{totalQuantity.toLocaleString()} kg</strong>
          </div>
          <div>
            {t('managerOrders.form.summary.totalAmount')}: <strong>{fmtVnd(totalAmount)} VNĐ</strong>
          </div>
        </div>
      </div>

      <DialogFooter className="flex justify-between pt-4">
        <Button type="submit" onClick={handleSubmit} disabled={saving}>
          {isEdit ? t('managerOrders.form.actions.updateOrder') : t('managerOrders.form.actions.createOrder')}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {t('managerOrders.detail.actions.back')}
        </Button>
      </DialogFooter>
    </form>
  );
}
