"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
// Removed useTranslation import
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import {
  createOrder,
  updateOrder,
  getOrderDetails,
  getAllOrders,
  type OrderCreateDto,
  type OrderUpdateDto,
  type OrderViewAllDto,
} from "@/lib/api/orders";
import {
  getContractDeliveryBatchById,
  type ContractDeliveryBatchViewDetailsDto,
  getAllContractDeliveryBatches,
} from "@/lib/api/contractDeliveryBatches";
import {
  getContractDetails,
  type ContractViewDetailsDto,
} from "@/lib/api/contracts";

import { getProductOptions, type ProductOption } from "@/lib/api/products";
import { OrderStatus } from "@/lib/constants/orderStatus";

type Props = {
  initialData?: OrderUpdateDto;
  deliveryBatchId?: string;
  onSuccess: () => void;
};

type OrderItemRow = {
  orderItemId?: string;
  contractDeliveryItemId: string;
  productId: string;
  quantity: number | "";
  unitPrice: number | "";
  discountAmount?: number | "";
  note?: string;
};

type FormState = {
  deliveryBatchId: string;
  deliveryRound?: number | "";
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
  // const { t } = useTranslation();
  const isEdit = !!initialData;
  const router = useRouter();

  // Form state
  const [form, setForm] = useState<FormState>({
    deliveryBatchId: deliveryBatchId ?? "",
    deliveryRound: "",
    note: "",
    status: OrderStatus.Preparing,
    cancelReason: "",
    orderItems: [],
  });

  // Options and data
  const [deliveryItemOptions, setDeliveryItemOptions] = useState<{ contractDeliveryItemId: string; name: string }[]>([]);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [batchOptions, setBatchOptions] = useState<{ id: string; label: string }[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [deliveryBatchCode, setDeliveryBatchCode] = useState<string>("");
  const [existingOrders, setExistingOrders] = useState<OrderViewAllDto[]>([]);

  // Product selection state
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showProductList, setShowProductList] = useState(true);
  const [productSearch, setProductSearch] = useState("");
  const [selectedCoffeeType, setSelectedCoffeeType] = useState<string>("");

  // Maps for auto-fill
  const [deliveryItemUnitPriceMap, setDeliveryItemUnitPriceMap] = useState<Record<string, number>>({});
  const [deliveryItemDiscountMap, setDeliveryItemDiscountMap] = useState<Record<string, number>>({});
  const [deliveryItemCoffeeTypeMap, setDeliveryItemCoffeeTypeMap] = useState<Record<string, string>>({});
  const [deliveryItemQuantityMap, setDeliveryItemQuantityMap] = useState<Record<string, number>>({});

  // Error handling
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [businessErrors, setBusinessErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Map edit data to form
  useEffect(() => {
    if (!initialData) return;

    setForm({
      deliveryBatchId: initialData.deliveryBatchId,
      deliveryRound: initialData.deliveryRound ?? "",
      note: initialData.note ?? "",
      status: initialData.status ?? OrderStatus.Preparing,
      cancelReason: initialData.cancelReason ?? "",
      orderItems: (initialData.orderItems ?? []).map(
        (it): OrderItemRow => ({
          orderItemId: it.orderItemId,
          contractDeliveryItemId: it.contractDeliveryItemId,
          productId: it.productId,
          quantity: typeof it.quantity === "number" ? it.quantity : "",
          unitPrice: typeof it.unitPrice === "number" ? it.unitPrice : "",
          discountAmount: it.discountAmount ?? 0,
          note: it.note ?? "",
        })
      ),
    });

    // Set selected products for edit mode
    const selected = new Set(initialData.orderItems?.map(item => item.productId) || []);
    setSelectedProducts(selected);
  }, [initialData]);

  // Load delivery batch options
  useEffect(() => {
    (async () => {
      if (!form.deliveryBatchId) {
        setDeliveryItemOptions([]);
        setDeliveryBatchCode("");
        return;
      }
      setLoadingOptions(true);
      try {
        const details = (await getContractDeliveryBatchById(
          form.deliveryBatchId
        )) as ContractDeliveryBatchViewDetailsDto;

        setDeliveryBatchCode(details.deliveryBatchCode || "");
        if (form.deliveryRound === "" || form.deliveryRound === undefined) {
          setField("deliveryRound", details.deliveryRound ?? "");
        }

        const opts = (details.contractDeliveryItems ?? []).map((x) => ({
          contractDeliveryItemId: x.deliveryItemId,
          name: `${x.coffeeTypeName} — KH: ${x.plannedQuantity}`,
        }));
        setDeliveryItemOptions(opts);

        const typeMap: Record<string, string> = {};
        const quantityMap: Record<string, number> = {};
        for (const it of details.contractDeliveryItems ?? []) {
          if (it.deliveryItemId && it.coffeeTypeName) {
            typeMap[it.deliveryItemId] = it.coffeeTypeName;
          }
          if (it.deliveryItemId && it.plannedQuantity) {
            quantityMap[it.deliveryItemId] = it.plannedQuantity;
          }
        }
        setDeliveryItemCoffeeTypeMap(typeMap);
        setDeliveryItemQuantityMap(quantityMap);

        try {
          const contract = (await getContractDetails(
            details.contractId
          )) as ContractViewDetailsDto;
          const priceByContractItem = new Map(
            (contract.contractItems ?? []).map((ci) => [
              ci.contractItemId,
              Number(ci.unitPrice ?? 0),
            ])
          );
          const discountByContractItem = new Map(
            (contract.contractItems ?? []).map((ci) => [
              ci.contractItemId,
              Number(ci.discountAmount ?? 0),
            ])
          );
          const map: Record<string, number> = {};
          const discMap: Record<string, number> = {};
          for (const di of details.contractDeliveryItems ?? []) {
            const price = priceByContractItem.get(di.contractItemId);
            if (price !== undefined) {
              map[di.deliveryItemId] = price;
            }
            const disc = discountByContractItem.get(di.contractItemId);
            if (disc !== undefined) {
              discMap[di.deliveryItemId] = disc;
            }
          }
          setDeliveryItemUnitPriceMap(map);
          setDeliveryItemDiscountMap(discMap);
        } catch (err) {
          console.warn("Failed to load contract details for unit prices", err);
          setDeliveryItemUnitPriceMap({});
          setDeliveryItemDiscountMap({});
        }

        const products = await getProductOptions();
        setProductOptions(products ?? []);
              } catch (e) {
          console.error(e);
          toast.error("Lỗi khi tải thông tin đợt giao hàng");
        } finally {
        setLoadingOptions(false);
      }
    })();
  }, [form.deliveryBatchId]);

  // Load batch options when no deliveryBatchId
  useEffect(() => {
    if (form.deliveryBatchId) return;
    (async () => {
      try {
        const [all, orders] = await Promise.all([
          getAllContractDeliveryBatches(),
          getAllOrders()
        ]);

        setExistingOrders(orders ?? []);

        // Lọc bỏ các delivery batch đã có order
        const deliveryBatchCodesWithOrders = new Set(orders.map(order => order.deliveryBatchCode));
        const availableBatches = (all ?? []).filter(batch => !deliveryBatchCodesWithOrders.has(batch.deliveryBatchCode));

        setBatchOptions(
          availableBatches.map((b) => ({
            id: b.deliveryBatchId,
            label: `${b.deliveryBatchCode} — ${b.contractNumber}`,
          }))
        );
              } catch (e) {
          console.error(e);
          toast.error("Lỗi khi tải danh sách đợt giao hàng");
        }
    })();
  }, [form.deliveryBatchId]);

  // Helper functions
  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const addProductToOrder = (productId: string) => {
    const product = productOptions.find(p => p.productId === productId);
    if (!product) return;

    // Find matching delivery item for this product type
    const coffeeType = product.coffeeTypeName?.toLowerCase();
    const matchingDeliveryItem = deliveryItemOptions.find(item => {
      const itemCoffeeType = deliveryItemCoffeeTypeMap[item.contractDeliveryItemId]?.toLowerCase();
      return itemCoffeeType === coffeeType;
    });

    if (!matchingDeliveryItem) {
      toast.error("Không tìm thấy mặt hàng đợt giao phù hợp cho sản phẩm này");
      return;
    }

    const newItem: OrderItemRow = {
      contractDeliveryItemId: matchingDeliveryItem.contractDeliveryItemId,
      productId: productId,
      quantity: 1,
      unitPrice: deliveryItemUnitPriceMap[matchingDeliveryItem.contractDeliveryItemId] || 0,
      discountAmount: deliveryItemDiscountMap[matchingDeliveryItem.contractDeliveryItemId] || 0,
      note: "",
    };

    setForm(prev => ({
      ...prev,
      orderItems: [...prev.orderItems, newItem]
    }));
  };

  const removeProductFromOrder = (productId: string) => {
    setForm(prev => ({
      ...prev,
      orderItems: prev.orderItems.filter(item => item.productId !== productId)
    }));
  };

  const updateOrderItemQuantity = (productId: string, quantity: number) => {
    setForm(prev => ({
      ...prev,
      orderItems: prev.orderItems.map(item =>
        item.productId === productId
          ? { ...item, quantity: quantity }
          : item
      )
    }));
  };

  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
      removeProductFromOrder(productId);
    } else {
      newSelected.add(productId);
      addProductToOrder(productId);
    }
    setSelectedProducts(newSelected);
  };

  // Error helper functions
  const getFieldError = (fieldName: string): string | undefined => {
    return fieldErrors[fieldName];
  };

  const hasFieldError = (fieldName: string): boolean => {
    return !!fieldErrors[fieldName];
  };

  // Calculate totals
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

  // Filter products based on search and delivery batch contract
  const filteredProducts = useMemo(() => {
    return productOptions.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.productId.toLowerCase().includes(productSearch.toLowerCase());

      // Filter by coffee type from delivery batch contract
      const matchesDeliveryBatchContract = !form.deliveryBatchId ||
        deliveryItemCoffeeTypeMap && Object.values(deliveryItemCoffeeTypeMap).some(coffeeType =>
          coffeeType.toLowerCase() === (product.coffeeTypeName || "").toLowerCase()
        );

      // Filter by selected coffee type
      const matchesSelectedType = !selectedCoffeeType ||
        product.coffeeTypeName === selectedCoffeeType;

      return matchesSearch && matchesDeliveryBatchContract && matchesSelectedType;
    });
  }, [productOptions, productSearch, form.deliveryBatchId, deliveryItemCoffeeTypeMap, selectedCoffeeType]);

  // Get coffee types from delivery batch contract for filter
  const availableCoffeeTypes = useMemo(() => {
    if (!form.deliveryBatchId || !deliveryItemCoffeeTypeMap) return [];
    const types = new Set(Object.values(deliveryItemCoffeeTypeMap).filter(Boolean));
    return Array.from(types);
  }, [form.deliveryBatchId, deliveryItemCoffeeTypeMap]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    setFieldErrors({});
    setBusinessErrors([]);

    const data = form;

    // Validate
    const clientErrors: Record<string, string> = {};

    if (!data.deliveryBatchId) {
      clientErrors.deliveryBatchId = "Vui lòng chọn đợt giao hàng";
    }
    if (!data.orderItems.length) {
      clientErrors.orderItems = "Vui lòng thêm ít nhất một sản phẩm";
    } else {
      data.orderItems.forEach((item, index) => {
        if (!item.contractDeliveryItemId) {
          clientErrors[`orderItems.${index}.contractDeliveryItemId`] = "Vui lòng chọn mặt hàng đợt giao";
        }
        if (!item.productId) {
          clientErrors[`orderItems.${index}.productId`] = "Vui lòng chọn sản phẩm";
        }
        if (!(Number(item.quantity) > 0)) {
          clientErrors[`orderItems.${index}.quantity`] = "Số lượng phải lớn hơn 0";
        }
        if (!(Number(item.unitPrice) > 0)) {
          clientErrors[`orderItems.${index}.unitPrice`] = "Đơn giá phải lớn hơn 0";
        }
      });
    }

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      toast.error("Vui lòng kiểm tra lại các lỗi trong form");
      return;
    }

    const orderDateIso = undefined;
    const actualDeliveryDateStr = undefined;

    try {
      setSaving(true);

      if (isEdit && initialData) {
        const payload: OrderUpdateDto = {
          orderId: initialData.orderId,
          deliveryBatchId: data.deliveryBatchId,
          deliveryRound: data.deliveryRound === "" || data.deliveryRound === undefined
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
            return {
              orderItemId: r.orderItemId!,
              orderId: initialData.orderId,
              contractDeliveryItemId: r.contractDeliveryItemId,
              productId: r.productId,
              quantity: qty,
              unitPrice: price,
              discountAmount: discountPercent,
              note: r.note?.trim() || undefined,
            };
          }),
        };

        const req = updateOrder(payload.orderId, payload);
        toast.promise(req, {
          loading: "Đang cập nhật...",
          success: "Cập nhật đơn hàng thành công",
          error: "Lỗi khi cập nhật đơn hàng",
        });
        await req;
      } else {
        const payload: OrderCreateDto = {
          deliveryBatchId: data.deliveryBatchId,
          deliveryRound: data.deliveryRound === "" || data.deliveryRound === undefined
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
            return {
              contractDeliveryItemId: r.contractDeliveryItemId,
              productId: r.productId,
              quantity: qty,
              unitPrice: price,
              discountAmount: discountPercent,
              note: r.note?.trim() || undefined,
            };
          }),
        };

        const req = createOrder(payload);
        toast.promise(req, {
          loading: "Đang tạo...",
          success: "Tạo đơn hàng thành công",
          error: "Lỗi khi tạo đơn hàng",
        });
        await req;
      }

      onSuccess();
    } catch (err) {
      if (err && typeof err === "object" && "errors" in err && err.errors) {
        const validationErrors = err.errors as Record<string, string[]>;
        const newFieldErrors: Record<string, string> = {};
        const newBusinessErrors: string[] = [];

        Object.entries(validationErrors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            const message = messages[0];
            const isBusinessError = message.length > 50 || message.includes("vượt quá") || message.includes("đã tồn tại");

            if (isBusinessError) {
              newBusinessErrors.push(message);
            } else {
              if (field.startsWith("OrderItems[") && field.includes("].")) {
                const match = field.match(/OrderItems\[(\d+)\]\.(\w+)/);
                if (match) {
                  const index = match[1];
                  const itemField = match[2];
                  newFieldErrors[`orderItems.${index}.${itemField.toLowerCase()}`] = message;
                }
              } else {
                newFieldErrors[field] = message;
              }
            }
          }
        });

        if (Object.keys(newFieldErrors).length > 0) {
          setFieldErrors(newFieldErrors);
        }
        if (newBusinessErrors.length > 0) {
          setBusinessErrors(newBusinessErrors);
        }
        if (Object.keys(newFieldErrors).length > 0 || newBusinessErrors.length > 0) {
          toast.error("Vui lòng kiểm tra lại các lỗi trong form");
        }
      } else {
        toast.error("Lỗi khi lưu đơn hàng");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto bg-white border rounded-lg shadow p-6">
      {/* Header */}
      <div className="text-center mb-6">
                         <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? "Chỉnh sửa đơn hàng" : "Tạo đơn hàng mới"}
        </h1>
        <p className="text-gray-600 mt-1">
          Quản lý thông tin đơn hàng và sản phẩm
        </p>
      </div>

      {/* Order Creation Mode */}
      <div className="mb-6">
                         <label className="block text-sm font-medium text-gray-700 mb-2">
          Chế độ tạo đơn hàng:
        </label>
        <select className="w-full max-w-xs p-2 border border-gray-300 rounded-lg">
          <option value="multiple">Nhiều sản phẩm</option>
        </select>
      </div>

      {/* Business Errors */}
      {businessErrors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          {businessErrors.map((error, index) => (
            <p key={index} className="text-red-600 text-sm">• {error}</p>
          ))}
        </div>
      )}

      {/* Main Form Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Order Information */}
        <div className="space-y-6">
          {/* Delivery Batch Information */}
          <div className="bg-gray-50 p-6 rounded-lg h-fit">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
                             <h3 className="text-lg font-semibold text-gray-900">Thông tin đợt giao hàng</h3>
            </div>

            <div className="space-y-4">
              <div>
                                                 <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đợt giao hàng <span className="text-red-500">*</span>
                </label>
                {!isEdit ? (
                  <>
                    <select
                      className={`w-full p-3 border rounded-lg ${hasFieldError("deliveryBatchId") ? "border-red-500" : "border-gray-300"}`}
                      value={form.deliveryBatchId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setField("deliveryBatchId", id);
                        const found = batchOptions.find((b) => b.id === id);
                        if (found) setDeliveryBatchCode(found.label.split(" — ")[0] || "");
                      }}
                    >
                                             <option value="">Chọn đợt giao hàng</option>
                      {batchOptions.map((b) => (
                        <option key={b.id} value={b.id}>{b.label}</option>
                      ))}
                    </select>
                    {batchOptions.length === 0 && (
                      <p className="text-amber-600 text-xs mt-1">
                        Không có đợt giao hàng khả dụng
                      </p>
                    )}
                  </>
                ) : (
                  <Input value={deliveryBatchCode || "—"} readOnly className="bg-gray-50" />
                )}
                {hasFieldError("deliveryBatchId") && (
                  <p className="text-red-500 text-xs mt-1">{getFieldError("deliveryBatchId")}</p>
                )}
              </div>

                             <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Đợt giao
                 </label>
                 <Input
                   type="number"
                   value={form.deliveryRound ?? ""}
                   onChange={(e) => setField("deliveryRound", e.target.value === "" ? "" : Number(e.target.value))}
                   placeholder="Tự động từ hợp đồng"
                   className="no-spinner bg-gray-50"
                   readOnly
                 />
                 <p className="text-xs text-gray-500 mt-1">
                   Đợt giao được lấy tự động từ hợp đồng
                 </p>
               </div>
            </div>
          </div>

          {/* Order Information */}
          <div className="bg-gray-50 p-6 rounded-lg h-fit">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Thông tin đơn hàng</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <Textarea
                  placeholder="Nhập ghi chú cho đơn hàng"
                  value={form.note ?? ""}
                  onChange={(e) => setField("note", e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value as OrderStatus)}
                >
                  {Object.values(OrderStatus)
                    .filter((s) => s !== OrderStatus.Pending)
                    .map((s) => (
                      <option key={s} value={s}>
                        {s === OrderStatus.Preparing ? "Đang chuẩn bị" :
                          s === OrderStatus.Shipped ? "Đã xuất hàng" :
                            s === OrderStatus.Delivered ? "Đã giao hàng" :
                              s === OrderStatus.Cancelled ? "Đã hủy" :
                                s === OrderStatus.Failed ? "Giao thất bại" : s}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Product Selection */}
        <div className="space-y-6">
                     {/* Select Products Header */}
           <div className="bg-gray-50 p-6 rounded-lg">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center">
                 <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                   <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                   </svg>
                 </div>
                 <h3 className="text-lg font-semibold text-gray-900">Chọn sản phẩm</h3>
               </div>
               <Button
                 type="button"
                 variant="outline"
                 size="sm"
                 onClick={() => setShowProductList(!showProductList)}
               >
                 {showProductList ? "Ẩn danh sách" : "Hiện danh sách"}
               </Button>
             </div>
             
             {/* Contract Summary */}
             {form.deliveryBatchId && deliveryItemOptions.length > 0 && (
               <div className="bg-blue-50 p-4 rounded-lg mb-4">
                 <h4 className="font-medium text-gray-900 mb-2">Thông tin hợp đồng</h4>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p><strong>Đợt giao:</strong> {form.deliveryRound || "Chưa có"}</p>
                      <p><strong>Tổng số lượng hợp đồng:</strong> {Object.values(deliveryItemQuantityMap).reduce((sum, qty) => sum + qty, 0).toLocaleString()} Kg</p>
                    </div>
                    <div>
                      <p><strong>Số loại cà phê:</strong> {deliveryItemOptions.length}</p>
                      <p><strong>Đơn giá trung bình:</strong> {(() => {
                        const prices = Object.values(deliveryItemUnitPriceMap).filter(p => p > 0);
                        return prices.length > 0 ? new Intl.NumberFormat("vi-VN").format(prices.reduce((sum, price) => sum + price, 0) / prices.length) : "N/A";
                      })()} VNĐ/Kg
                      </p>
                    </div>
                  </div>
                 <div className="mt-3 pt-3 border-t border-blue-200">
                   <p className="text-xs text-gray-600">
                     <strong>Lưu ý:</strong> Số lượng hợp đồng là tổng cho tất cả sản phẩm cùng loại cà phê
                   </p>
                 </div>
               </div>
             )}
           </div>

          {/* Product List */}
          {showProductList && (
            <div className="bg-gray-50 p-6 rounded-lg">
              {/* Search and Filter */}
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Tìm kiếm sản phẩm..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full"
                  />
                </div>
                <select
                  className="p-2 border border-gray-300 rounded-lg"
                  value={selectedCoffeeType}
                  onChange={(e) => setSelectedCoffeeType(e.target.value)}
                >
                  <option value="">Tất cả loại cà phê</option>
                  {availableCoffeeTypes.map((type: string) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Products Grid */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => {
                  const isSelected = selectedProducts.has(product.productId);
                  const orderItem = form.orderItems.find(item => item.productId === product.productId);

                  return (
                    <div key={product.productId} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleProductSelection(product.productId)}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{product.name}</h4>
                                                         <div className="text-sm text-gray-600 space-y-1 mt-1">
                               <p><strong>Loại cà phê:</strong> {product.coffeeTypeName || "N/A"}</p>
                               <p><strong>Tồn kho:</strong> {product.quantityAvailable?.toLocaleString() || 0} Kg</p>
                             </div>

                            {isSelected && orderItem && (
                              <div className="mt-3 p-2 bg-blue-50 rounded border">
                                <div className="flex items-center space-x-2">
                                  <label className="text-sm font-medium">Số lượng:</label>
                                  <Input
                                    type="number"
                                    min={1}
                                    value={orderItem.quantity}
                                    onChange={(e) => updateOrderItemQuantity(product.productId, Number(e.target.value) || 1)}
                                    className="w-20 h-8 text-sm"
                                  />
                                  <span className="text-sm text-gray-600">Kg</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {isSelected && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => toggleProductSelection(product.productId)}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </Button>
                          )}
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            {product.coffeeTypeName}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected Products Summary */}
          {form.orderItems.length > 0 && (
            <div className="bg-blue-50 p-6 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Tóm tắt sản phẩm đã chọn</h4>
              <div className="space-y-2">
                {form.orderItems.map((item, index) => {
                  const product = productOptions.find(p => p.productId === item.productId);
                  return (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{product?.name}</span>
                      <span className="text-gray-900 font-medium">
                        {item.quantity} kg × {fmtVnd(Number(item.unitPrice))} VNĐ
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center justify-between font-medium">
                  <span>Tổng số lượng:</span>
                  <span>{totalQuantity.toLocaleString()} kg</span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span>Tổng tiền:</span>
                  <span>{fmtVnd(totalAmount)} VNĐ</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-between pt-6 border-t mt-6">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Hủy
        </Button>
        <Button type="submit" onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {isEdit ? "Đang cập nhật..." : "Đang tạo..."}
            </div>
          ) : (
            isEdit ? "Cập nhật" : "Tạo đơn hàng"
          )}
        </Button>
      </div>
    </div>
  );
}
