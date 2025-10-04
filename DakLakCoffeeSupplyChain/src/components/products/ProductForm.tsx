"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";

import {
  createProduct,
  updateProduct,
  getProductById,
  type ProductCreateDto,
  type ProductUpdateDto,
  type ProductViewDetailsDto,
  ProductUnit,
  ProductUnitLabel,
  getProcessingBatchOptions,
  getInventoryOptions,
  getAvailableInventoryOptions,
  getInventoryDetailTest,
  type ProcessingBatchOption,
  type InventoryOption,
} from "@/lib/api/products";
import { getCoffeeTypes, type CoffeeType } from "@/lib/api/coffeeType";
import {
  ProductStatus,
  ProductStatusLabel,
  getProductStatusLabel,
} from "@/lib/constants/productStatus";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { useAuth } from "@/lib/hooks/useAuth";

type Props = {
  initialData?: ProductUpdateDto | ProductViewDetailsDto; // nếu có -> Edit; nếu không -> Create
  onSuccess: () => void;
};

type FormState = {
  productName: string;
  description: string;
  unitPrice: number | "";
  quantityAvailable: number | "";
  unit: ProductUnit;
  batchId: string;
  inventoryId: string;
  coffeeTypeId: string;
  originRegion: string;
  originFarmLocation: string;
  geographicalIndicationCode: string;
  certificationUrl: string;
  evaluatedQuality: string;
  evaluationScore: number | "";
  status: ProductStatus;
  approvalNote: string;
  farmerName: string;
};

export default function ProductForm({ initialData, onSuccess }: Props) {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const router = useRouter();
  const { user } = useAuth(); // Lấy thông tin user hiện tại

  // Options
  const [coffeeTypes, setCoffeeTypes] = useState<CoffeeType[]>([]);
  const [batchOptions, setBatchOptions] = useState<ProcessingBatchOption[]>([]);
  const [inventoryOptions, setInventoryOptions] = useState<InventoryOption[]>(
    []
  );
  const [loadingOptions, setLoadingOptions] = useState(false);

  // -------------------- form state --------------------
  const [form, setForm] = useState<FormState>({
    productName: "",
    description: "",
    unitPrice: "",
    quantityAvailable: "",
    unit: ProductUnit.Kg,
    batchId: "",
    inventoryId: "",
    coffeeTypeId: "",
    originRegion: "",
    originFarmLocation: "",
    geographicalIndicationCode: "",
    certificationUrl: "",
    evaluatedQuality: "",
    evaluationScore: "",
    status: ProductStatus.Approved, // Always Approved for new products
    approvalNote: "",
    farmerName: "",
  });

  // Map dữ liệu edit -> form
  useEffect(() => {
    if (!initialData) return;

    // Ưu tiên sử dụng ID trực tiếp nếu có
    let batchId = (initialData as any).batchId || "";
    let inventoryId = (initialData as any).inventoryId || "";
    let coffeeTypeId = (initialData as any).coffeeTypeId || "";

    // Nếu không có ID trực tiếp, tìm từ tên
    if (!batchId && (initialData as any).batchCode) {
      const matchingBatch = batchOptions.find(
        (batch) => batch.batchCode === (initialData as any).batchCode
      );
      batchId = matchingBatch?.batchId || "";
    }

    // Tìm inventoryId từ inventoryCode (ưu tiên) hoặc warehouseName
    if (!inventoryId) {
      if ((initialData as any).inventoryCode) {
        // Tìm theo inventoryCode trước
        const matchingInventory = inventoryOptions.find(
          (inv) => inv.inventoryCode === (initialData as any).inventoryCode
        );
        inventoryId = matchingInventory?.inventoryId || "";

        if (!inventoryId) {
          console.log(
            "Không tìm thấy inventory với code:",
            (initialData as any).inventoryCode
          );
        }
      } else if ((initialData as any).inventoryLocation) {
        // Fallback: tìm theo inventoryLocation
        const matchingInventory = inventoryOptions.find(
          (inv) =>
            inv.warehouseName.includes(
              (initialData as any).inventoryLocation
            ) || inv.location.includes((initialData as any).inventoryLocation)
        );
        inventoryId = matchingInventory?.inventoryId || "";
      }
    }

    if (!coffeeTypeId && (initialData as any).coffeeTypeName) {
      const matchingCoffeeType = coffeeTypes.find(
        (type) => type.typeName === (initialData as any).coffeeTypeName
      );
      coffeeTypeId = matchingCoffeeType?.coffeeTypeId || "";
    }

    console.log("Mapping edit data:", {
      initialData,
      foundBatchId: batchId,
      foundInventoryId: inventoryId,
      foundCoffeeTypeId: coffeeTypeId,
      inventoryCode: (initialData as any).inventoryCode,
      warehouseName: (initialData as any).warehouseName,
    });

    setForm({
      productName: initialData.productName || "",
      description: initialData.description || "",
      unitPrice: initialData.unitPrice || "",
      quantityAvailable: initialData.quantityAvailable || "",
      unit: (initialData.unit as ProductUnit) || ProductUnit.Kg,
      batchId,
      inventoryId,
      coffeeTypeId,
      originRegion: initialData.originRegion || "",
      originFarmLocation: initialData.originFarmLocation || "",
      geographicalIndicationCode: initialData.geographicalIndicationCode || "",
      certificationUrl: initialData.certificationUrl || "",
      evaluatedQuality: initialData.evaluatedQuality || "",
      evaluationScore: initialData.evaluationScore || "",
      status: (initialData.status as ProductStatus) || ProductStatus.Pending,
      approvalNote: initialData.approvalNote || "",
      farmerName: (initialData as any).farmerName || "",
    });
  }, [initialData, batchOptions, inventoryOptions, coffeeTypes]);

  // Load options
  useEffect(() => {
    (async () => {
      setLoadingOptions(true);
      try {
        console.log("Loading options...");
        const [types, batches, inventories] = await Promise.all([
          getCoffeeTypes(),
          getProcessingBatchOptions(),
          getInventoryOptions(),
        ]);
        console.log("Coffee types:", types);
        console.log("Processing batches:", batches);
        console.log("Inventories:", inventories);
        console.log("Inventories length:", inventories?.length);
        console.log("First inventory item:", inventories?.[0]);

        // Sử dụng dữ liệu từ API hoặc fallback data
        setCoffeeTypes(
          types && types.length > 0
            ? types
            : [
                { coffeeTypeId: "1", typeCode: "ARAB", typeName: "Arabica" },
                { coffeeTypeId: "2", typeCode: "ROBU", typeName: "Robusta" },
                { coffeeTypeId: "3", typeCode: "CULI", typeName: "Culi" },
              ]
        );

        setBatchOptions(
          batches && batches.length > 0
            ? batches
            : [
                { batchId: "1", batchCode: "BATCH-001" },
                { batchId: "2", batchCode: "BATCH-002" },
                { batchId: "3", batchCode: "BATCH-003" },
              ]
        );

        if (inventories && inventories.length > 0) {
          console.log(
            "Using API data for inventories:",
            inventories.length,
            "items"
          );

          // Lọc ra những inventory chưa được tạo product (chỉ hiển thị khi tạo mới)
          if (!isEdit) {
            // Sử dụng API mới để lấy inventory chưa có product
            try {
              console.log(
                "Creating new product - getting available inventories only"
              );
              const availableInventories = await getAvailableInventoryOptions();
              setInventoryOptions(availableInventories);
            } catch (error) {
              console.error(
                "Error getting available inventories, falling back to all:",
                error
              );
              setInventoryOptions(inventories);
            }
          } else {
            // Khi edit, hiển thị tất cả inventory
            setInventoryOptions(inventories);
          }
        } else {
          console.log("Using fallback data for inventories");
          setInventoryOptions([
            {
              inventoryId: "1",
              location: "Kho chính",
              inventoryCode: "INV-001",
              warehouseCode: "INV-001",
              warehouseName: "Kho chính",
              warehouseCapacity: undefined,
              batchId: "1",
              batchCode: "BATCH-001",
              coffeeTypeName: "Arabica",
              quantity: 100,
              unit: "Kg",
            },
            {
              inventoryId: "2",
              location: "Kho phụ",
              inventoryCode: "INV-002",
              warehouseCode: "INV-002",
              warehouseName: "Kho phụ",
              warehouseCapacity: undefined,
              batchId: "2",
              batchCode: "BATCH-002",
              coffeeTypeName: "Robusta",
              quantity: 150,
              unit: "Kg",
            },
            {
              inventoryId: "3",
              location: "Kho lưu trữ",
              inventoryCode: "INV-003",
              warehouseCode: "INV-003",
              warehouseName: "Kho lưu trữ",
              warehouseCapacity: undefined,
              batchId: "3",
              batchCode: "BATCH-003",
              coffeeTypeName: "Culi",
              quantity: 80,
              unit: "Kg",
            },
          ]);
        }
      } catch (e) {
        console.error("Error loading options:", e);
        toast.error(t("products.form.messages.loadingOptions"));

        // Fallback data khi có lỗi
        console.log("Setting fallback coffee types due to error");
        setCoffeeTypes([
          { coffeeTypeId: "1", typeCode: "ARAB", typeName: "Arabica" },
          { coffeeTypeId: "2", typeCode: "ROBU", typeName: "Robusta" },
          { coffeeTypeId: "3", typeCode: "CULI", typeName: "Culi" },
        ]);

        console.log("Setting fallback batch options due to error");
        setBatchOptions([
          { batchId: "1", batchCode: "BATCH-001" },
          { batchId: "2", batchCode: "BATCH-002" },
          { batchId: "3", batchCode: "BATCH-003" },
        ]);

        console.log("Setting fallback inventory options due to error");
        setInventoryOptions([
          {
            inventoryId: "1",
            location: "Kho chính",
            inventoryCode: "INV-001",
            warehouseCode: "INV-001",
            warehouseName: "Kho chính",
            warehouseCapacity: undefined,
            batchId: "1",
            batchCode: "BATCH-001",
            coffeeTypeName: "Arabica",
            quantity: 100,
            unit: "Kg",
          },
          {
            inventoryId: "2",
            location: "Kho phụ",
            inventoryCode: "INV-002",
            warehouseCode: "INV-002",
            warehouseName: "Kho phụ",
            warehouseCapacity: undefined,
            batchId: "2",
            batchCode: "BATCH-002",
            coffeeTypeName: "Robusta",
            quantity: 150,
            unit: "Kg",
          },
          {
            inventoryId: "3",
            location: "Kho lưu trữ",
            inventoryCode: "INV-003",
            warehouseCode: "INV-003",
            warehouseName: "Kho lưu trữ",
            warehouseCapacity: undefined,
            batchId: "3",
            batchCode: "BATCH-003",
            coffeeTypeName: "Culi",
            quantity: 80,
            unit: "Kg",
          },
        ]);
      } finally {
        setLoadingOptions(false);
      }
    })();
  }, [isEdit]);

  // Helpers
  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Hàm xử lý khi inventory thay đổi
  const handleInventoryChange = (inventoryId: string) => {
    const selectedInventory = inventoryOptions.find(
      (inv) => inv.inventoryId === inventoryId
    );

    if (selectedInventory) {
      // Tự động điền batchId và coffeeTypeId
      if (selectedInventory.batchId) {
        setField("batchId", selectedInventory.batchId);
      }

      if (selectedInventory.coffeeTypeName) {
        // Tìm coffeeTypeId từ coffeeTypeName
        const matchingCoffeeType = coffeeTypes.find(
          (type) => type.typeName === selectedInventory.coffeeTypeName
        );
        if (matchingCoffeeType) {
          setField("coffeeTypeId", matchingCoffeeType.coffeeTypeId);
        }
      }

      // Tự động điền số lượng có sẵn
      if (selectedInventory.quantity !== undefined) {
        setField("quantityAvailable", selectedInventory.quantity);
      }

      // Tự động điền đơn vị nếu có
      if (selectedInventory.unit) {
        setField("unit", selectedInventory.unit as ProductUnit);
      }

      // ✅ Test: Lấy thông tin chi tiết từ endpoint detail
      getInventoryDetailTest(inventoryId)
        .then((detailData: any) => {
          if (detailData) {
            // Tự động điền từ detail data
            const growingRegion =
              detailData.farmLocation || detailData.FarmLocation; // ✅ THÊM: Check cả 2 cases
            if (growingRegion) {
              setField("originRegion", growingRegion);
            } else {
              // ✅ THÊM: Fallback - thử lấy từ Crop API nếu có cropId
              if (detailData.cropId) {
                import("@/lib/api/crops").then(({ getCropById }) => {
                  getCropById(detailData.cropId)
                    .then((cropData: any) => {
                      if (cropData.address) {
                        setField("originRegion", cropData.address);
                      }
                    })
                    .catch((error) => {
                      console.error("❌ Error getting crop data:", error);
                    });
                });
              }
            }
            if (detailData.farmerName) {
              setField("farmerName", detailData.farmerName);
            }
            if (detailData.evaluationResult) {
              setField("evaluatedQuality", detailData.evaluationResult);
            }
            if (detailData.totalScore !== undefined) {
              setField("evaluationScore", detailData.totalScore);
            }
          } else {
            console.log("❌ No detail data received from API");
          }
        })
        .catch((error) => {
          console.error("❌ Error getting inventory detail:", error);
        });
    }
  };

  // Hàm kiểm tra xem có thể chỉnh sửa batch và coffee type không
  const canEditBatch = () => {
    // Luôn disable cho đến khi chọn inventory
    if (!form.inventoryId) return false;
    const selectedInventory = inventoryOptions.find(
      (inv) => inv.inventoryId === form.inventoryId
    );
    return !selectedInventory?.batchId;
  };

  const canEditCoffeeType = () => {
    // Luôn disable cho đến khi chọn inventory
    if (!form.inventoryId) return false;
    const selectedInventory = inventoryOptions.find(
      (inv) => inv.inventoryId === form.inventoryId
    );
    return !selectedInventory?.coffeeTypeName;
  };

  // Hàm kiểm tra xem có thể chỉnh sửa đơn vị không
  const canEditUnit = () => {
    // Luôn disable cho đến khi chọn inventory
    if (!form.inventoryId) return false;
    const selectedInventory = inventoryOptions.find(
      (inv) => inv.inventoryId === form.inventoryId
    );
    return !selectedInventory?.unit;
  };

  // Lấy số lượng tối đa có thể nhập
  const getMaxQuantity = () => {
    if (!form.inventoryId) return undefined;
    const selectedInventory = inventoryOptions.find(
      (inv) => inv.inventoryId === form.inventoryId
    );
    return selectedInventory?.quantity;
  };

  // Kiểm tra xem đơn vị có được chọn tự động không
  const isUnitAutoSelected = () => {
    if (!form.inventoryId) return false;
    const selectedInventory = inventoryOptions.find(
      (inv) => inv.inventoryId === form.inventoryId
    );
    return !!selectedInventory?.unit;
  };

  const [saving, setSaving] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    const data = form;

    // Validate
    if (!data.productName.trim())
      return toast.error(t("products.form.validation.productNameRequired"));
    if (data.productName.length > 100)
      return toast.error(t("products.form.validation.productNameTooLong"));
    if (data.description.length > 500)
      return toast.error(t("products.form.validation.descriptionTooLong"));
    if (!(Number(data.unitPrice) > 0))
      return toast.error(t("products.form.validation.unitPriceRequired"));
    if (!(Number(data.quantityAvailable) >= 0))
      return toast.error(t("products.form.validation.quantityRequired"));

    // Kiểm tra số lượng không được vượt quá số lượng có sẵn trong kho
    const maxQuantity = getMaxQuantity();
    if (
      maxQuantity !== undefined &&
      Number(data.quantityAvailable) > maxQuantity
    ) {
      return toast.error(
        t("products.form.validation.quantityExceedsAvailable", {
          maxQuantity,
          unit: data.unit,
        })
      );
    }
    if (!data.batchId)
      return toast.error(t("products.form.validation.batchRequired"));
    if (!data.inventoryId)
      return toast.error(t("products.form.validation.inventoryRequired"));
    if (!data.coffeeTypeId)
      return toast.error(t("products.form.validation.coffeeTypeRequired"));
    if (data.originRegion.length > 100)
      return toast.error(t("products.form.validation.originRegionTooLong"));
    if (data.originFarmLocation.length > 200)
      return toast.error(
        t("products.form.validation.originFarmLocationTooLong")
      );
    if (data.geographicalIndicationCode.length > 50)
      return toast.error(
        t("products.form.validation.geographicalIndicationCodeTooLong")
      );
    if (data.evaluatedQuality.length > 50)
      return toast.error(t("products.form.validation.evaluatedQualityTooLong"));
    if (
      data.evaluationScore !== "" &&
      (Number(data.evaluationScore) < 0 || Number(data.evaluationScore) > 100)
    ) {
      return toast.error(t("products.form.validation.evaluationScoreRange"));
    }
    if (data.approvalNote.length > 50)
      return toast.error(t("products.form.validation.approvalNoteTooLong"));

    try {
      setSaving(true);

      if (isEdit && initialData) {
        const payload: ProductUpdateDto = {
          productId: initialData.productId,
          productName: data.productName.trim(),
          description: data.description.trim(),
          unitPrice: Number(data.unitPrice),
          quantityAvailable: Number(data.quantityAvailable),
          unit: data.unit,
          batchId: data.batchId,
          inventoryId: data.inventoryId,
          coffeeTypeId: data.coffeeTypeId,
          originRegion: data.originRegion.trim(),
          originFarmLocation: data.originFarmLocation.trim(),
          geographicalIndicationCode: data.geographicalIndicationCode.trim(),
          certificationUrl: data.certificationUrl.trim() || undefined,
          evaluatedQuality: data.evaluatedQuality.trim(),
          evaluationScore:
            data.evaluationScore !== ""
              ? Number(data.evaluationScore)
              : undefined,
          status: data.status,
          approvalNote: data.approvalNote.trim(),
          // Tự động điền thông tin người duyệt nếu status = Approved
          approvedBy:
            data.status === ProductStatus.Approved ? user?.id : undefined,
          approvedAt:
            data.status === ProductStatus.Approved
              ? new Date().toISOString()
              : undefined,
        };

        const req = updateProduct(payload.productId, payload);
        toast.promise(req, {
          loading: t("products.form.toast.updating"),
          success: t("products.form.toast.updateSuccess"),
          error: t("products.form.toast.updateError"),
        });
        await req;
      } else {
        const payload: ProductCreateDto = {
          productName: data.productName.trim(),
          description: data.description.trim(),
          unitPrice: Number(data.unitPrice),
          quantityAvailable: Number(data.quantityAvailable),
          unit: data.unit,
          batchId: data.batchId,
          inventoryId: data.inventoryId,
          coffeeTypeId: data.coffeeTypeId,
          originRegion: data.originRegion.trim(),
          originFarmLocation: data.originFarmLocation.trim(),
          geographicalIndicationCode: data.geographicalIndicationCode.trim(),
          certificationUrl: data.certificationUrl.trim() || undefined,
          evaluatedQuality: data.evaluatedQuality.trim(),
          evaluationScore:
            data.evaluationScore !== ""
              ? Number(data.evaluationScore)
              : undefined,
          status: ProductStatus.Approved, // Always Approved when creating new products
          approvalNote: data.approvalNote.trim(),
        };

        const req = createProduct(payload);
        toast.promise(req, {
          loading: t("products.form.toast.creating"),
          success: t("products.form.toast.createSuccess"),
          error: t("products.form.toast.createError"),
        });
        await req;
      }

      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(t("products.form.messages.saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="max-w-4xl mx-auto bg-white border rounded-2xl shadow p-8 space-y-6">
      <h2 className="text-2xl font-semibold text-center">
        {isEdit
          ? t("products.form.title.edit")
          : t("products.form.title.create")}
      </h2>

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          {t("products.form.sections.basicInfo")}
        </h3>

        <div
          className={`grid grid-cols-1 ${
            isEdit ? "md:grid-cols-2" : "md:grid-cols-1"
          } gap-4`}
        >
          <div>
            <label className="block mb-1 text-sm font-medium">
              {t("products.form.fields.productName")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.productName}
              onChange={(e) => setField("productName", e.target.value)}
              placeholder={t("products.form.placeholders.productName")}
              maxLength={100}
            />
          </div>

          {/* Chỉ hiển thị trạng thái khi edit */}
          {isEdit && (
            <div>
              <label className="block mb-1 text-sm font-medium">
                {t("products.form.fields.status")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full p-2 border rounded"
                value={form.status}
                onChange={(e) =>
                  setField("status", e.target.value as ProductStatus)
                }
              >
                {Object.values(ProductStatus)
                  .filter(
                    (status) =>
                      status !== ProductStatus.Draft &&
                      status !== ProductStatus.InStock
                  )
                  .map((s) => (
                    <option key={s} value={s}>
                      {getProductStatusLabel(s, t)}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">
            {t("products.form.fields.description")}
          </label>
          <Textarea
            placeholder={t("products.form.placeholders.description")}
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            maxLength={500}
            rows={3}
          />
        </div>
      </div>

      {/* References - Moved up to prioritize inventory selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          {t("products.form.sections.references")}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium">
              {t("products.form.fields.inventoryId")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full p-2 border rounded"
              value={form.inventoryId}
              onChange={(e) => {
                const inventoryId = e.target.value;
                setField("inventoryId", inventoryId);
                handleInventoryChange(inventoryId);
              }}
              disabled={loadingOptions}
            >
              <option value="">
                {t("products.form.selectOptions.selectInventory")}
              </option>
              {inventoryOptions.map((inventory) => (
                <option
                  key={inventory.inventoryId}
                  value={inventory.inventoryId}
                >
                  {inventory.inventoryCode} - {inventory.warehouseName}
                  {inventory.batchCode && ` (${inventory.batchCode})`}
                  {inventory.coffeeTypeName && ` - ${inventory.coffeeTypeName}`}
                  {inventory.quantity !== undefined &&
                    ` - ${inventory.quantity} ${inventory.unit || "kg"}`}
                </option>
              ))}
            </select>

            {/* Thông báo về inventory available */}
            {!isEdit && (
              <div className="text-xs text-gray-500 mt-1">
                💡 Chỉ hiển thị những kho chưa được tạo sản phẩm
              </div>
            )}

            {/* Debug info */}
            {/* {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-500 mt-1">
                Có {inventoryOptions.length} kho, loading: {loadingOptions ? 'true' : 'false'}
                <br />
                Selected: {form.inventoryId || 'none'}
                <br />
                Options: {inventoryOptions.map(inv => `${inv.inventoryCode}(${inv.inventoryId})`).join(', ')}
              </div>
            )} */}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">
              {t("products.form.fields.batchId")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full p-2 border rounded disabled:cursor-not-allowed disabled:text-gray-500"
              value={form.batchId}
              onChange={(e) => setField("batchId", e.target.value)}
              disabled={loadingOptions || !canEditBatch()}
            >
              <option value="">
                {t("products.form.selectOptions.selectBatch")}
              </option>
              {batchOptions.map((batch) => (
                <option key={batch.batchId} value={batch.batchId}>
                  {batch.batchCode}
                </option>
              ))}
            </select>
            {!form.inventoryId ? (
              <div className="text-xs text-gray-500 mt-1">
                {t("products.form.messages.selectInventoryFirst")}
              </div>
            ) : !canEditBatch() ? (
              <div className="text-xs text-gray-500 mt-1">
                Đã tự động điền từ kho
              </div>
            ) : (
              <div className="text-xs text-green-600 mt-1">
                {t("products.form.messages.canEdit")}
              </div>
            )}
            {/* Debug info */}
            {/* {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-500 mt-1">
                Có {batchOptions.length} batch, Selected: {form.batchId || 'none'}
              </div>
            )} */}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">
              {t("products.form.fields.coffeeTypeId")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full p-2 border rounded disabled:cursor-not-allowed disabled:text-gray-500"
              value={form.coffeeTypeId}
              onChange={(e) => setField("coffeeTypeId", e.target.value)}
              disabled={loadingOptions || !canEditCoffeeType()}
            >
              <option value="">
                {t("products.form.selectOptions.selectCoffeeType")}
              </option>
              {coffeeTypes.map((type) => (
                <option key={type.coffeeTypeId} value={type.coffeeTypeId}>
                  {type.typeName}
                </option>
              ))}
            </select>
            {!form.inventoryId ? (
              <div className="text-xs text-gray-500 mt-1">
                {t("products.form.messages.selectInventoryFirst")}
              </div>
            ) : !canEditCoffeeType() ? (
              <div className="text-xs text-gray-500 mt-1">
                Đã tự động điền từ kho
              </div>
            ) : (
              <div className="text-xs text-green-600 mt-1">
                {t("products.form.messages.canEdit")}
              </div>
            )}
            {/* Debug info
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-500 mt-1">
                Có {coffeeTypes.length} loại cà phê, Selected: {form.coffeeTypeId || 'none'}
              </div>
            )} */}
          </div>
        </div>
      </div>

      {/* Pricing & Quantity */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          {t("products.form.sections.pricingQuantity")}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium">
              {t("products.form.fields.unitPrice")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min={0}
              step={1000}
              value={form.unitPrice}
              onChange={(e) => {
                const value = e.target.value;
                // Chỉ cho phép nhập số nguyên dương
                if (value === "" || /^\d+$/.test(value)) {
                  setField("unitPrice", value === "" ? "" : Number(value));
                }
              }}
              onKeyDown={(e) => {
                // Chặn các ký tự không phải số
                if (!/[\d\b\Delete\ArrowLeft\ArrowRight\Tab]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              placeholder={t("products.form.placeholders.unitPrice")}
              className="no-spinner"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">
              {t("products.form.fields.quantityAvailable")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min={0}
              max={getMaxQuantity()}
              step={0.1}
              value={form.quantityAvailable}
              onChange={(e) => {
                const value = e.target.value;
                // Chỉ cho phép nhập số thập phân dương
                if (value === "" || /^\d*\.?\d*$/.test(value)) {
                  setField(
                    "quantityAvailable",
                    value === "" ? "" : Number(value)
                  );
                }
              }}
              onKeyDown={(e) => {
                // Chặn các ký tự không phải số, dấu chấm, và phím điều hướng
                if (!/[\d\b\Delete\ArrowLeft\ArrowRight\Tab\.]/.test(e.key)) {
                  e.preventDefault();
                }
                // Chặn dấu chấm nếu đã có dấu chấm
                if (e.key === "." && e.currentTarget.value.includes(".")) {
                  e.preventDefault();
                }
              }}
              placeholder={t("products.form.placeholders.quantityAvailable")}
              className="no-spinner"
            />
            {form.inventoryId && getMaxQuantity() !== undefined && (
              <div className="text-xs text-gray-500 mt-1">
                {t("products.form.messages.availableInWarehouse", {
                  quantity: getMaxQuantity(),
                  unit: form.unit,
                })}
                {Number(form.quantityAvailable) > (getMaxQuantity() || 0) && (
                  <span className="text-red-600 ml-2">
                    {t("products.form.messages.quantityExceedsWarning")}
                  </span>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">
              {t("products.form.fields.unit")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full p-2 border rounded disabled:cursor-not-allowed disabled:text-gray-500"
              value={form.unit}
              onChange={(e) => setField("unit", e.target.value as ProductUnit)}
              disabled={loadingOptions || !canEditUnit()}
            >
              {Object.values(ProductUnit).map((unit) => (
                <option key={unit} value={unit}>
                  {ProductUnitLabel[unit]}
                </option>
              ))}
            </select>
            {!form.inventoryId ? (
              <div className="text-xs text-gray-500 mt-1">
                {t("products.form.messages.selectInventoryFirst")}
              </div>
            ) : !canEditUnit() ? (
              <div className="text-xs text-gray-500 mt-1">
                Đã tự động điền từ kho
              </div>
            ) : (
              <div className="text-xs text-green-600 mt-1">
                {t("products.form.messages.canEdit")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Origin Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          {t("products.form.sections.originInfo")}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium">
              {t("products.form.fields.originRegion")}
            </label>
            <Input
              value={form.originRegion}
              onChange={(e) => setField("originRegion", e.target.value)}
              placeholder={t("products.form.placeholders.originRegion")}
              maxLength={100}
              readOnly
              className="bg-gray-50 cursor-not-allowed"
            />
            <div className="text-xs text-gray-500 mt-1">
              {!form.inventoryId
                ? "Vui lòng chọn kho trước"
                : "Đã tự động điền từ kho"}
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">
              Nông dân đã thực hiện
            </label>
            <Input
              value={form.farmerName || ""}
              onChange={(e) => setField("farmerName", e.target.value)}
              placeholder="Tên nông dân đã thực hiện"
              maxLength={100}
              readOnly
              className="bg-gray-50 cursor-not-allowed"
            />
            <div className="text-xs text-gray-500 mt-1">
              {!form.inventoryId
                ? "Vui lòng chọn kho trước"
                : "Đã tự động điền từ kho"}
            </div>
          </div>
        </div>
      </div>

      {/* Quality Assessment */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          {t("products.form.sections.qualityAssessment")}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium">
              {t("products.form.fields.evaluatedQuality")}
            </label>
            <Input
              value={form.evaluatedQuality}
              onChange={(e) => setField("evaluatedQuality", e.target.value)}
              placeholder={t("products.form.placeholders.evaluatedQuality")}
              maxLength={50}
              readOnly
              className="bg-gray-50 cursor-not-allowed"
            />
            <div className="text-xs text-gray-500 mt-1">
              {!form.inventoryId
                ? "Vui lòng chọn kho trước"
                : "Đã tự động điền từ kho"}
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">
              {t("products.form.fields.evaluationScore")}
            </label>
            <Input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={form.evaluationScore}
              onChange={(e) =>
                setField(
                  "evaluationScore",
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              placeholder={t("products.form.placeholders.evaluationScore")}
              className="no-spinner bg-gray-50 cursor-not-allowed"
              readOnly
            />
            <div className="text-xs text-gray-500 mt-1">
              {!form.inventoryId
                ? "Vui lòng chọn kho trước"
                : "Đã tự động điền từ kho"}
            </div>
          </div>
        </div>
      </div>

      {/* Approval - Only show when editing */}
      {isEdit && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            {t("products.form.sections.approval")}
          </h3>

          <div>
            <label className="block mb-1 text-sm font-medium">
              {t("products.form.fields.approvalNote")}
            </label>
            <Textarea
              placeholder={t("products.form.placeholders.approvalNote")}
              value={form.approvalNote}
              onChange={(e) => setField("approvalNote", e.target.value)}
              maxLength={50}
              rows={2}
            />
          </div>
        </div>
      )}

      <DialogFooter className="flex justify-between pt-4">
        <Button type="submit" onClick={handleSubmit} disabled={saving}>
          {isEdit
            ? t("products.form.actions.update")
            : t("products.form.actions.create")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {t("products.form.actions.back")}
        </Button>
      </DialogFooter>
    </form>
  );
}
