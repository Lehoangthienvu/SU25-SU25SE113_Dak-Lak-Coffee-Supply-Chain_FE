"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// LoadingButton component sẽ được tạo inline
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/DatePicker";
import { DialogFooter } from "@/components/ui/dialog";
import { ContractStatus } from "@/lib/constants/contractStatus";
import {
  ContractCreateDto,
  ContractUpdateDto,
  createContract,
  updateContract,
  SettlementFilesWrapper,
  SettlementRound,
} from "@/lib/api/contracts";
import {
  getAllBusinessBuyers,
  BusinessBuyerDto,
} from "@/lib/api/businessBuyers";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getCoffeeTypes, CoffeeType } from "@/lib/api/coffeeType";
import { getAllContracts, ContractViewAllDto } from "@/lib/api/contracts";
import {
  ContractItemCreateDto,
  ContractItemUpdateDto,
} from "@/lib/api/contractItems";
import { getErrorMessage } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { LoadingButton } from "../ui/loadingProgress";

// Sử dụng useRef thay vì biến global để tránh vấn đề HMR

function parseDateLocal(d?: string | Date | null) {
  if (!d) return null;
  if (d instanceof Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }
  // string "yyyy-MM-dd"
  const x = new Date(`${d}T00:00:00`); // ép local midnight
  if (isNaN(x.getTime())) return null;
  x.setHours(0, 0, 0, 0);
  return x;
}

// Helper: input có suffix đơn vị bên phải
// function InputWithSuffix({
//   unit,
//   className,
//   ...props
// }: React.ComponentProps<typeof Input> & { unit?: string }) {
//   return (
//     <div className="relative">
//       <Input {...props} className={`pr-14 ${className ?? ""}`} />
//       {unit ? (
//         <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
//           {unit}
//         </span>
//       ) : null}
//     </div>
//   );
// }

type Props = {
  initialData?: ContractUpdateDto;
  onSuccess: () => void;
  buyerOptions?: BusinessBuyerDto[];
};

export default function ContractForm({
  initialData,
  onSuccess,
  buyerOptions,
}: Props) {
  const isEdit = !!initialData;
  const [buyers, setBuyers] = useState<BusinessBuyerDto[]>([]);
  const [coffeeTypes, setCoffeeTypes] = useState<CoffeeType[]>([]);
  const [contracts, setContracts] = useState<ContractViewAllDto[]>([]);
  const [formData, setFormData] = useState<
    ContractCreateDto | ContractUpdateDto | null
  >(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [businessErrors, setBusinessErrors] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  // Settlement files state
  const [settlementFiles, setSettlementFiles] = useState<SettlementFilesWrapper>({
    settlementRounds: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const lastStatusRef = useRef<ContractStatus | null>(null);
  const { t } = useTranslation();

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "NotStarted":
        return {
          label: t("contracts.contractStatus.NotStarted"),
          className: "bg-gray-100 text-gray-600",
        };
      case "PreparingDelivery":
        return {
          label: t("contracts.contractStatus.PreparingDelivery"),
          className: "bg-purple-100 text-purple-700",
        };
      case "InProgress":
        return {
          label: t("contracts.contractStatus.InProgress"),
          className: "bg-green-100 text-green-700",
        };
      case "PartialCompleted":
        return {
          label: t("contracts.contractStatus.PartialCompleted"),
          className: "bg-yellow-100 text-yellow-700",
        };
      case "Completed":
        return {
          label: t("contracts.contractStatus.Completed"),
          className: "bg-blue-100 text-blue-700",
        };
      case "Cancelled":
        return {
          label: t("contracts.contractStatus.Cancelled"),
          className: "bg-red-100 text-red-700",
        };
      case "Expired":
        return {
          label: t("contracts.contractStatus.Expired"),
          className: "bg-orange-100 text-orange-700",
        };
      default:
        return { label: status, className: "bg-gray-100 text-gray-600" };
    }
  };

  // Fetch buyers list
  useEffect(() => {
    if (buyerOptions) {
      setBuyers(buyerOptions);
    } else {
      getAllBusinessBuyers().then(setBuyers);
    }
  }, [buyerOptions]);

  useEffect(() => {
    getCoffeeTypes().then(setCoffeeTypes);
    getAllContracts().then(setContracts);
  }, []);

  // Helper function để format date cho DatePicker (yyyy-MM-dd)
  const formatDateForDatePicker = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn("Invalid date string:", dateString);
        return "";
      }

      // Format: yyyy-MM-dd (đúng format DatePicker mong đợi)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  // Sync formData based on initialData
  useEffect(() => {
    if (initialData) {
      // Format signedAt từ ISO string sang yyyy-MM-dd
      const formattedData = {
        ...initialData,
        signedAt: initialData.signedAt
          ? formatDateForDatePicker(initialData.signedAt)
          : undefined,
      };

      setFormData(formattedData);

      // Khi edit, khởi tạo filePreviewUrl từ contractFileUrl hiện tại
      if (initialData.contractFileUrl) {
        setFilePreviewUrl(initialData.contractFileUrl);
      }

      // Khởi tạo settlement files từ settlementFilesJson nếu có
      if (initialData.settlementFilesJson) {
        try {
          const settlementData = JSON.parse(initialData.settlementFilesJson);
          if (
            settlementData.settlementRounds &&
            Array.isArray(settlementData.settlementRounds)
          ) {
            const settlementRounds: SettlementRound[] = settlementData.settlementRounds.map(
              (round: { roundName: number; settlementFileURL: string; roundPrice: number }) => ({
                roundName: round.roundName,
                settlementFileURL: round.settlementFileURL,
                roundPrice: round.roundPrice || 0
              })
            );

            setSettlementFiles({
              settlementRounds: settlementRounds
            });
            console.log(
              "Loaded settlement files:",
              settlementRounds
            );
          }
        } catch (error) {
          console.error("Error parsing settlementFilesJson:", error);
        }
      }

      // Khởi tạo settlement files từ apiSettlementFiles nếu có (từ API response)
      const extendedInitialData = initialData as ContractUpdateDto & {
        apiSettlementFiles?: { roundName: number; settlementFileURL: string; roundPrice?: number }[];
      };
      if (
        extendedInitialData.apiSettlementFiles &&
        Array.isArray(extendedInitialData.apiSettlementFiles)
      ) {
        const apiSettlementRounds: SettlementRound[] = extendedInitialData.apiSettlementFiles.map(
          (round: { roundName: number; settlementFileURL: string; roundPrice?: number }) => ({
            roundName: round.roundName,
            settlementFileURL: round.settlementFileURL,
            roundPrice: round.roundPrice || 0
          })
        );

        // Merge với settlement files đã có từ settlementFilesJson
        setSettlementFiles((prev) => {
          const existingRounds = prev.settlementRounds || [];
          const mergedRounds = [...existingRounds];
          
          // Thêm hoặc cập nhật rounds từ API
          apiSettlementRounds.forEach(apiRound => {
            const existingIndex = mergedRounds.findIndex(
              round => round.roundName === apiRound.roundName
            );
            
            if (existingIndex >= 0) {
              // Cập nhật round đã có
              mergedRounds[existingIndex] = {
                ...mergedRounds[existingIndex],
                settlementFileURL: apiRound.settlementFileURL,
                roundPrice: apiRound.roundPrice
              };
            } else {
              // Thêm round mới
              mergedRounds.push(apiRound);
            }
          });
          
          return { settlementRounds: mergedRounds };
        });

        console.log(
          "Loaded settlement file URLs from API:",
          apiSettlementRounds
        );
      }

      // Log để debug
      console.log("InitialData gốc:", initialData);
      console.log("InitialData đã format:", formattedData);
      console.log("signedAt gốc:", initialData.signedAt);
      console.log("signedAt đã format:", formattedData.signedAt);
      // console.log("contractType:", initialData.contractType);
      // console.log("parentContractId:", initialData.parentContractId);
      console.log("paymentRounds:", initialData.paymentRounds);
      console.log("settlementFilesJson:", initialData.settlementFilesJson);
    } else {
      setFormData({
        contractNumber: "",
        contractTitle: "",
        contractFileUrl: "",
        buyerId: "",
        deliveryRounds: 1,
        totalQuantity: 0,
        totalValue: 0,
        startDate: undefined,
        endDate: undefined,
        signedAt: undefined,
        status: ContractStatus.NotStarted,
        cancelReason: "",
        contractType: "",
        parentContractId: "",
        paymentRounds: 1,
        settlementFileURL: "",
        settlementFilesJson: "",
        settlementNote: "",
        contractItems: [],
      } as ContractCreateDto);
      // Reset file preview khi tạo mới
      setFilePreviewUrl(null);
      setSelectedFile(null);
      // Reset settlement files khi tạo mới
      setSettlementFiles({ settlementRounds: [] });
              // No longer needed - using settlementFiles state
    }
  }, [initialData]);

  // Clear errors when form data changes
  useEffect(() => {
    setFieldErrors({});
    setBusinessErrors([]);
  }, [formData]);

  // Auto-update paymentRounds when settlement files are loaded from API
  useEffect(() => {
    if (isEdit && settlementFiles.settlementRounds.length > 0) {
      const maxRoundNumber = Math.max(
        ...settlementFiles.settlementRounds.map(round => round.roundName)
      );
      if (
        maxRoundNumber > 0 &&
        formData &&
        (!formData.paymentRounds || formData.paymentRounds < maxRoundNumber)
      ) {
        setFormData((prev) => {
          if (!prev) return prev;
          return { ...prev, paymentRounds: maxRoundNumber };
        });
        console.log(
          "Auto-updated paymentRounds to:",
          maxRoundNumber,
          "based on settlement files"
        );
      }
    }
  }, [settlementFiles, isEdit]);

  useEffect(() => {
    if (!formData) return;
    const s = formData.status;

    // không toast cho Completed/Cancelled
    if (s === ContractStatus.Completed || s === ContractStatus.Cancelled) {
      lastStatusRef.current = s;
      return;
    }

    // chặn trùng cả khi StrictMode remount
    if (lastStatusRef.current === s) return;

    // Chỉ toast khi trạng thái thay đổi từ lần trước (không phải lần đầu khởi tạo)
    if (lastStatusRef.current !== null) {
      const m =
        s === ContractStatus.Expired
          ? "Ngày kết thúc trong quá khứ, trạng thái đã tự động cập nhật thành 'Quá hạn'"
          : s === ContractStatus.InProgress
          ? "Trạng thái đã tự động cập nhật thành 'Đang thực hiện'"
          : s === ContractStatus.NotStarted
          ? "Trạng thái đã tự động cập nhật thành 'Chưa bắt đầu'"
          : "";

      if (m) toast.info(m, { id: "status-auto" });
    }

    lastStatusRef.current = s;
  }, [formData?.status]);

  // Cleanup file preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }

      // Cleanup is handled by settlementFiles state
    };
  }, [filePreviewUrl]);

  // Guard for null formData
  if (!formData) {
    return (
      <div className='text-gray-500 text-center py-10'>
        {t("contracts.messages.loading")}
      </div>
    );
  }

  // Type assertion để TypeScript biết formData không null từ đây
  const data = formData;

  // Định nghĩa type rõ ràng
  type ContractFormData = ContractCreateDto | ContractUpdateDto;
  type ContractFormDataNN = NonNullable<ContractFormData>; // thực ra đã non-null

  // deriveStatus chỉ nhận data không-null
  function deriveStatus(data: ContractFormDataNN): ContractStatus {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = parseDateLocal(data.startDate);
    const endDate = parseDateLocal(data.endDate);

    if (
      data.status === ContractStatus.Completed ||
      data.status === ContractStatus.Cancelled
    ) {
      return data.status;
    }
    if (endDate && endDate < today) return ContractStatus.Expired;
    if (startDate && startDate <= today) return ContractStatus.InProgress;
    if (startDate && startDate > today) return ContractStatus.NotStarted;
    return data.status;
  }

  function handleChange(field: string, value: string | number | undefined) {
    setFormData((prev) => {
      if (!prev) return prev;

      const newData = { ...prev, [field]: value };

      if (field === "startDate" || field === "endDate") {
        const nextStatus = deriveStatus(newData as ContractFormDataNN);
        if (nextStatus !== newData.status) newData.status = nextStatus;
      }
      return newData;
    });

    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }
  }

  // Client-side validation for numeric fields
  const validateNumericField = (
    field: string,
    value: number
  ): string | null => {
    if (
      field === "deliveryRounds" &&
      (value <= 0 || !Number.isInteger(value))
    ) {
      return t("contracts.validation.deliveryRoundsPositiveInteger");
    }
    if (field === "paymentRounds" && (value <= 0 || !Number.isInteger(value))) {
      return t(
        "contract.components.form.validation.paymentRoundsPositiveInteger"
      );
    }
    if (field === "totalQuantity" && value < 0) {
      return t("contracts.validation.totalQuantityNonNegative");
    }
    if (field === "totalValue" && value < 0) {
      return t("contracts.validation.totalValueNonNegative");
    }
    return null;
  };

  const handleNumericChange = (field: string, value: number) => {
    // Special handling for paymentRounds - prevent 0 or negative values
    if (field === "paymentRounds" && (value <= 0 || isNaN(value))) {
      setFieldErrors((prev) => ({ 
        ...prev, 
        [field]: t("contract.components.form.validation.paymentRoundsPositiveInteger")
      }));
      return; // Don't update the value if it's invalid
    }

    // Validate before updating
    const error = validateNumericField(field, value);
    if (error) {
      setFieldErrors((prev) => ({ ...prev, [field]: error }));
    } else {
      // Clear error if validation passes
      if (fieldErrors[field]) {
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    }

    handleChange(field, value);
  };

  function addContractItem() {
    setFormData((prev) => {
      if (!prev) throw new Error("Form chưa khởi tạo");

      const isUpdate = "contractId" in prev && "contractItems" in prev;

      return {
        ...prev,
        contractItems: [
          ...prev.contractItems,
          {
            contractId: isUpdate ? (prev as ContractUpdateDto).contractId : "",
            coffeeTypeId: "",
            quantity: 0,
            unitPrice: 0,
            discountAmount: 0,
            note: "",
            ...(isUpdate && { contractItemId: crypto.randomUUID() }),
          },
        ],
      };
    });
  }

  function updateContractItem(
    index: number,
    field: string,
    value: string | number
  ) {
    setFormData((prev) => {
      const updatedItems = [...prev!.contractItems];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      return {
        ...prev!,
        contractItems: updatedItems,
      };
    });

    // Clear field error when user starts typing
    const fieldKey = `contractItems.${index}.${field}`;
    if (fieldErrors[fieldKey]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }

    // Client-side validation for contract item fields
    if (field === "quantity" && typeof value === "number" && value <= 0) {
      setFieldErrors((prev) => ({
        ...prev,
        [`contractItems.${index}.quantity`]: t(
          "contracts.validation.quantityGreaterThanZero"
        ),
      }));
    } else if (
      field === "unitPrice" &&
      typeof value === "number" &&
      value <= 0
    ) {
      setFieldErrors((prev) => ({
        ...prev,
        [`contractItems.${index}.unitPrice`]: t(
          "contracts.validation.unitPriceGreaterThanZero"
        ),
      }));
    } else if (
      field === "discountAmount" &&
      typeof value === "number" &&
      value < 0
    ) {
      setFieldErrors((prev) => ({
        ...prev,
        [`contractItems.${index}.discountAmount`]: t(
          "contracts.validation.discountAmountNonNegative"
        ),
      }));
    }
  }

  function removeContractItem(index: number) {
    setFormData((prev) => {
      const updatedItems = [...prev!.contractItems];
      updatedItems.splice(index, 1);
      return {
        ...prev!,
        contractItems: updatedItems,
      };
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    // Set submitting state
    setIsSubmitting(true);

    // Clear previous errors
    setFieldErrors({});
    setBusinessErrors([]);

    // Basic client-side validation
    const clientErrors: Record<string, string> = {};

    if (!data.contractNumber?.trim()) {
      clientErrors.contractNumber = t(
        "contracts.validation.contractNumberRequired"
      );
    } else if (data.contractNumber.trim().length < 3) {
      clientErrors.contractNumber = t(
        "contracts.validation.contractNumberMinLength"
      );
    }

    if (!data.contractTitle?.trim()) {
      clientErrors.contractTitle = t(
        "contracts.validation.contractTitleRequired"
      );
    } else if (data.contractTitle.trim().length < 10) {
      clientErrors.contractTitle = t(
        "contracts.validation.contractTitleMinLength"
      );
    } else if (data.contractTitle.trim().length > 200) {
      clientErrors.contractTitle = t(
        "contracts.validation.contractTitleMaxLength"
      );
    }

    if (!data.buyerId) {
      clientErrors.buyerId = t("contracts.validation.buyerIdRequired");
    }

    // if (!data.contractType?.trim()) {
    //   clientErrors.contractType = t(
    //     "contract.components.form.validation.contractTypeRequired"
    //   );
    // }

    // if (data.contractType === "amendment" && !data.parentContractId?.trim()) {
    //   clientErrors.parentContractId = t(
    //     "contract.components.form.validation.parentContractIdRequired"
    //   );
    // }

    if (!data.startDate) {
      clientErrors.startDate = t("contracts.validation.startDateRequired");
    }

    if (!data.endDate) {
      clientErrors.endDate = t("contracts.validation.endDateRequired");
    }

    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      clientErrors.endDate = t("contracts.validation.endDateAfterStartDate");
    }

    if (data.signedAt && data.startDate && data.signedAt > data.startDate) {
      clientErrors.signedAt = t("contracts.validation.signedAtBeforeStartDate");
    }

    // Validate file upload (nếu có)
    if (selectedFile) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (selectedFile.size > maxSize) {
        clientErrors.contractFile = t("contracts.validation.contractFileSize");
      }

      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        clientErrors.contractFile = t("contracts.validation.contractFileType");
      }
    }

    // Validate settlement files (nếu có)
    settlementFiles.settlementRounds.forEach((round) => {
      if (round.settlementFile) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (round.settlementFile.size > maxSize) {
          clientErrors[`settlementFile_${round.roundName}`] = t(
            "contract.components.form.validation.settlementFileSize",
            { round: round.roundName }
          );
        }

        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        if (!allowedTypes.includes(round.settlementFile.type)) {
          clientErrors[`settlementFile_${round.roundName}`] = t(
            "contracts.validation.settlementFileType",
            { round: round.roundName }
          );
        }
      }
    });

    // Validate roundPrice - bắt buộc khi có file hoặc URL
    settlementFiles.settlementRounds.forEach((round) => {
      if ((round.settlementFile || round.settlementFileURL) && (!round.roundPrice || round.roundPrice <= 0)) {
        clientErrors[`roundPrice_${round.roundName}`] = t(
          "contract.components.form.validation.roundPriceRequired",
          { round: round.roundName }
        );
      }
    });

    // Validate tổng khối lượng và giá trị không được âm (phù hợp với backend)
    if (data.totalQuantity !== undefined && data.totalQuantity < 0) {
      clientErrors.totalQuantity = t(
        "contracts.validation.totalQuantityNonNegative"
      );
    }

    if (data.totalValue !== undefined && data.totalValue < 0) {
      clientErrors.totalValue = t("contracts.validation.totalValueNonNegative");
    }

    // Validate paymentRounds - must be at least 1
    if (!data.paymentRounds || data.paymentRounds <= 0 || !Number.isInteger(data.paymentRounds)) {
      clientErrors.paymentRounds = t(
        "contract.components.form.validation.paymentRoundsPositiveInteger"
      );
    }

    // Validate lý do hủy khi trạng thái = "Đã hủy"
    if (
      data.status === ContractStatus.Cancelled &&
      !data.cancelReason?.trim()
    ) {
      clientErrors.cancelReason = t(
        "contracts.validation.cancelReasonRequired"
      );
    }

    // Validate contract items
    if (!data.contractItems || data.contractItems.length === 0) {
      clientErrors.contractItems = t(
        "contracts.validation.contractItemsRequired"
      );
    } else {
      data.contractItems.forEach((item, index) => {
        if (!item.coffeeTypeId) {
          clientErrors[`contractItems.${index}.coffeeTypeId`] = t(
            "contracts.validation.coffeeTypeRequired"
          );
        }
        if (!item.quantity || item.quantity <= 0) {
          clientErrors[`contractItems.${index}.quantity`] = t(
            "contracts.validation.quantityGreaterThanZero"
          );
        }
        if (!item.unitPrice || item.unitPrice <= 0) {
          clientErrors[`contractItems.${index}.unitPrice`] = t(
            "contracts.validation.unitPriceGreaterThanZero"
          );
        }
        if (item.discountAmount && item.discountAmount < 0) {
          clientErrors[`contractItems.${index}.discountAmount`] = t(
            "contracts.validation.discountAmountNonNegative"
          );
        }
      });
    }

    // If there are client-side errors, display them and stop
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      toast.error(t("contracts.validation.checkFormErrors"));
      setIsSubmitting(false); // Reset submitting state
      return;
    }

    try {
      if (isEdit) {
        const dto = data as ContractUpdateDto;

        // Tự động cập nhật trạng thái nếu ngày kết thúc trong quá khứ và không phải "Hoàn thành"
        let finalStatus = dto.status;
        if (dto.endDate && dto.status !== ContractStatus.Completed) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const endDate = new Date(dto.endDate);
          endDate.setHours(0, 0, 0, 0);

          if (endDate < today) {
            // Ngày kết thúc trong quá khứ và không phải "Hoàn thành" → tự động chuyển thành "Quá hạn"
            finalStatus = ContractStatus.Expired;
            toast.info(
              "Ngày kết thúc trong quá khứ, trạng thái đã tự động cập nhật thành 'Quá hạn'"
            );
          }
        }

        const normalizedItems: ContractItemUpdateDto[] = dto.contractItems.map(
          (item) => ({
            contractItemId: item.contractItemId,
            contractId: item.contractId, // BẮT BUỘC
            coffeeTypeId: item.coffeeTypeId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountAmount: item.discountAmount ?? 0,
            note: item.note ?? "",
          })
        );

        // Chuẩn bị data cho update, bao gồm file mới nếu có
        const updateData: ContractUpdateDto = {
          ...dto,
          status: finalStatus, // Sử dụng trạng thái đã được cập nhật
          contractFileUrl:
            dto.contractFileUrl?.trim() === ""
              ? undefined
              : dto.contractFileUrl,
          contractItems: normalizedItems,
        };

        // Nếu có file mới được chọn, thêm vào data
        if (selectedFile) {
          (
            updateData as ContractUpdateDto & { contractFile?: File }
          ).contractFile = selectedFile;
        }

        // Thêm settlement files nếu có
        if (settlementFiles.settlementRounds.length > 0) {
          updateData.settlementFiles = settlementFiles;
        }

        await updateContract(dto.contractId, updateData);

        toast.success(t("contract.components.form.messages.success"));
      } else {
        const dto = data as ContractCreateDto;

        // Tự động cập nhật trạng thái nếu ngày kết thúc trong quá khứ và không phải "Hoàn thành"
        let finalStatus = dto.status;
        if (dto.endDate && dto.status !== ContractStatus.Completed) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const endDate = new Date(dto.endDate);
          endDate.setHours(0, 0, 0, 0);

          if (endDate < today) {
            // Ngày kết thúc trong quá khứ và không phải "Hoàn thành" → tự động chuyển thành "Quá hạn"
            finalStatus = ContractStatus.Expired;
            toast.info(
              "Ngày kết thúc trong quá khứ, trạng thái đã tự động cập nhật thành 'Quá hạn'"
            );
          }
        }

        const normalizedItems: ContractItemCreateDto[] = dto.contractItems.map(
          (item) => ({
            coffeeTypeId: item.coffeeTypeId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountAmount: item.discountAmount ?? 0,
            note: item.note ?? "",
          })
        );

        await createContract({
          ...dto,
          status: finalStatus, // Sử dụng trạng thái đã được cập nhật
          contractFileUrl:
            dto.contractFileUrl?.trim() === ""
              ? undefined
              : dto.contractFileUrl,
          contractFile: selectedFile || undefined, // Thêm file đã chọn
          settlementFiles:
            settlementFiles.settlementRounds.length > 0
              ? settlementFiles
              : undefined, // Thêm settlement files
          contractItems: normalizedItems,
        } as ContractCreateDto);

        toast.success(t("contracts.messages.createSuccess"));
      }

      onSuccess();
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
            // 1. Message dài (>50 ký tự)
            // 2. Chứa từ khóa nghiệp vụ
            // 3. Lỗi về quy tắc nghiệp vụ tổng thể
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
              // Thêm các từ khóa cụ thể cho lỗi nghiệp vụ
              message.includes("dòng hợp đồng") ||
              message.includes("hợp đồng đã khai báo") ||
              message.includes("kg) vượt quá") ||
              message.includes("VND) vượt quá") ||
              message.includes("từ các dòng") ||
              message.includes("đã khai báo") ||
              // Thêm các pattern cụ thể hơn
              message.includes("kg) vượt quá") ||
              message.includes("VND) vượt quá") ||
              message.includes("vượt quá tổng khối lượng") ||
              message.includes("vượt quá tổng giá trị") ||
              message.includes("vượt quá tổng trị giá") ||
              message.includes("các dòng hợp đồng") ||
              message.includes("hợp đồng đã khai báo") ||
              message.includes("đã khai báo (") ||
              message.includes(") vượt quá") ||
              // Thêm các từ khóa mới từ backend
              message.includes("quản lý doanh nghiệp") ||
              message.includes("thông tin bên mua") ||
              message.includes("Số hợp đồng") ||
              message.includes("đã tồn tại trong hệ thống") ||
              message.includes("khối lượng từ các dòng") ||
              message.includes("trị giá từ các dòng") ||
              message.includes("vượt quá tổng khối lượng") ||
              message.includes("vượt quá tổng giá trị") ||
              message.includes("vượt quá tổng trị giá") ||
              // Thêm các từ khóa cụ thể hơn cho lỗi tổng khối lượng
              message.includes("kg) vượt quá") ||
              message.includes("VND) vượt quá") ||
              message.includes("hiện có") ||
              message.includes("thêm") ||
              message.includes("từ các dòng hợp đồng") ||
              message.includes("hợp đồng đã khai báo") ||
              // Thêm các pattern cụ thể hơn
              message.includes("Tổng khối lượng từ các dòng") ||
              message.includes("Tổng trị giá từ các dòng") ||
              message.includes("vượt quá tổng khối lượng hợp đồng") ||
              message.includes("vượt quá tổng giá trị hợp đồng") ||
              message.includes("vượt quá tổng trị giá hợp đồng") ||
              // Thêm các pattern cụ thể hơn nữa
              message.includes("Tổng khối lượng từ các dòng hợp đồng") ||
              message.includes("Tổng trị giá từ các dòng hợp đồng") ||
              message.includes(
                "vượt quá tổng khối lượng hợp đồng đã khai báo"
              ) ||
              message.includes("vượt quá tổng giá trị hợp đồng đã khai báo") ||
              message.includes("vượt quá tổng trị giá hợp đồng đã khai báo") ||
              // Thêm các từ khóa cụ thể hơn
              message.includes("kg) vượt quá") ||
              message.includes("VND) vượt quá") ||
              message.includes("hiện có") ||
              message.includes("thêm") ||
              // Thêm các từ khóa cụ thể hơn nữa
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
              // Thêm các từ khóa cụ thể hơn nữa
              message.includes("kg) vượt quá tổng khối lượng") ||
              message.includes("VND) vượt quá tổng giá trị") ||
              message.includes(
                "vượt quá tổng khối lượng hợp đồng đã khai báo"
              ) ||
              message.includes("vượt quá tổng giá trị hợp đồng đã khai báo") ||
              message.includes("vượt quá tổng trị giá hợp đồng đã khai báo") ||
              // Thêm các từ khóa cụ thể hơn nữa
              message.includes("Tổng khối lượng từ các dòng hợp đồng") ||
              message.includes("Tổng trị giá từ các dòng hợp đồng") ||
              message.includes(
                "vượt quá tổng khối lượng hợp đồng đã khai báo"
              ) ||
              message.includes("vượt quá tổng giá trị hợp đồng đã khai báo") ||
              message.includes("vượt quá tổng trị giá hợp đồng đã khai báo") ||
              // Thêm các từ khóa cụ thể hơn nữa
              message.includes("kg) vượt quá") ||
              message.includes("VND) vượt quá") ||
              message.includes("hiện có") ||
              message.includes("thêm") ||
              // Thêm các từ khóa cụ thể hơn nữa
              message.includes("từ các dòng hợp đồng") ||
              message.includes("hợp đồng đã khai báo") ||
              message.includes("vượt quá tổng khối lượng") ||
              message.includes("vượt quá tổng giá trị") ||
              message.includes("vượt quá tổng trị giá");

            // Xử lý đặc biệt cho một số trường hợp
            if (field === "SignedAt" || field === "StartDate") {
              // Đây là lỗi validation ngày tháng (signedAt ≤ startDate)
              newFieldErrors[field.toLowerCase()] = message;
            } else if (
              field === "ContractItems" &&
              message.includes("cùng loại")
            ) {
              // Lỗi trùng loại cà phê - đây là lỗi nghiệp vụ
              newBusinessErrors.push(message);
            } else if (isBusinessError) {
              newBusinessErrors.push(message);
            } else {
              // Xử lý lỗi cho contract items (dạng: ContractItems[0].CoffeeTypeId)
              if (field.startsWith("ContractItems[") && field.includes("].")) {
                const match = field.match(/ContractItems\[(\d+)\]\.(\w+)/);
                if (match) {
                  const index = match[1];
                  const itemField = match[2];
                  newFieldErrors[
                    `contractItems.${index}.${itemField.toLowerCase()}`
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
          // Không hiển thị toast cho lỗi nghiệp vụ, chỉ hiển thị trong form
        }

        // Hiển thị toast với thông tin cụ thể hơn
        if (
          Object.keys(newFieldErrors).length > 0 ||
          newBusinessErrors.length > 0
        ) {
          // Kiểm tra có lỗi ngày tháng không
          const hasDateError =
            newFieldErrors.signedat || newFieldErrors.startdate;

          if (hasDateError) {
            toast.error(t("contracts.validation.dateError"));
          } else {
            toast.error(t("contracts.validation.checkFormErrors"));
          }
        }

        // Nếu chỉ có lỗi field validation
        if (
          Object.keys(newFieldErrors).length > 0 &&
          newBusinessErrors.length === 0
        ) {
          toast.error(t("contracts.validation.checkFormErrors"));
        }
      } else {
        // Xử lý lỗi khác (bao gồm lỗi nghiệp vụ chỉ trả về message)
        let errorMessage = "";
        let isBusinessError = false;

        if (err && typeof err === "object" && "message" in err && err.message) {
          errorMessage = err.message as string;

          // Kiểm tra xem có phải lỗi nghiệp vụ không
          // Lỗi nghiệp vụ thường có đặc điểm:
          // 1. Message dài (>50 ký tự)
          // 2. Chứa từ khóa nghiệp vụ cụ thể
          // 3. Mô tả quy tắc nghiệp vụ tổng thể
          isBusinessError =
            errorMessage.length > 50 ||
            errorMessage.includes("vượt quá") ||
            errorMessage.includes("đã tồn tại") ||
            errorMessage.includes("không được") ||
            errorMessage.includes("phải") ||
            errorMessage.includes("cùng loại") ||
            errorMessage.includes("tổng khối lượng") ||
            errorMessage.includes("tổng giá trị") ||
            errorMessage.includes("tổng trị giá") ||
            errorMessage.includes("đã tồn tại trong hệ thống") ||
            errorMessage.includes("không có quyền") ||
            errorMessage.includes("không tìm thấy") ||
            errorMessage.includes("vượt quá tổng") ||
            errorMessage.includes("không được có 2 dòng") ||
            errorMessage.includes("không được âm") ||
            errorMessage.includes("phải lớn hơn") ||
            errorMessage.includes("phải nhỏ hơn") ||
            // Thêm các từ khóa cụ thể cho lỗi nghiệp vụ
            errorMessage.includes("dòng hợp đồng") ||
            errorMessage.includes("hợp đồng đã khai báo") ||
            errorMessage.includes("kg) vượt quá") ||
            errorMessage.includes("VND) vượt quá") ||
            errorMessage.includes("từ các dòng") ||
            errorMessage.includes("đã khai báo") ||
            // Thêm các pattern cụ thể hơn
            errorMessage.includes("kg) vượt quá") ||
            errorMessage.includes("VND) vượt quá") ||
            errorMessage.includes("vượt quá tổng khối lượng") ||
            errorMessage.includes("vượt quá tổng giá trị") ||
            errorMessage.includes("vượt quá tổng trị giá") ||
            errorMessage.includes("các dòng hợp đồng") ||
            errorMessage.includes("hợp đồng đã khai báo") ||
            errorMessage.includes("đã khai báo (") ||
            errorMessage.includes(") vượt quá") ||
            // Thêm các từ khóa mới từ backend
            errorMessage.includes("quản lý doanh nghiệp") ||
            errorMessage.includes("thông tin bên mua") ||
            errorMessage.includes("Số hợp đồng") ||
            errorMessage.includes("đã tồn tại trong hệ thống") ||
            errorMessage.includes("khối lượng từ các dòng") ||
            errorMessage.includes("trị giá từ các dòng") ||
            errorMessage.includes("vượt quá tổng khối lượng") ||
            errorMessage.includes("vượt quá tổng giá trị") ||
            errorMessage.includes("vượt quá tổng trị giá") ||
            // Thêm các từ khóa cụ thể hơn cho lỗi tổng khối lượng
            errorMessage.includes("kg) vượt quá") ||
            errorMessage.includes("VND) vượt quá") ||
            errorMessage.includes("hiện có") ||
            errorMessage.includes("thêm") ||
            errorMessage.includes("từ các dòng hợp đồng") ||
            errorMessage.includes("hợp đồng đã khai báo") ||
            // Thêm các pattern cụ thể hơn
            errorMessage.includes("Tổng khối lượng từ các dòng") ||
            errorMessage.includes("Tổng trị giá từ các dòng") ||
            errorMessage.includes("vượt quá tổng khối lượng hợp đồng") ||
            errorMessage.includes("vượt quá tổng giá trị hợp đồng") ||
            errorMessage.includes("vượt quá tổng trị giá hợp đồng") ||
            // Thêm các pattern cụ thể hơn nữa
            errorMessage.includes("Tổng khối lượng từ các dòng hợp đồng") ||
            errorMessage.includes("Tổng trị giá từ các dòng hợp đồng") ||
            errorMessage.includes(
              "vượt quá tổng khối lượng hợp đồng đã khai báo"
            ) ||
            errorMessage.includes(
              "vượt quá tổng giá trị hợp đồng đã khai báo"
            ) ||
            errorMessage.includes(
              "vượt quá tổng trị giá hợp đồng đã khai báo"
            ) ||
            // Thêm các từ khóa cụ thể hơn
            errorMessage.includes("kg) vượt quá") ||
            errorMessage.includes("VND) vượt quá") ||
            errorMessage.includes("hiện có") ||
            errorMessage.includes("thêm") ||
            // Thêm các từ khóa cụ thể hơn nữa
            errorMessage.includes("Tổng khối lượng từ các dòng hợp đồng (") ||
            errorMessage.includes("Tổng trị giá từ các dòng hợp đồng (") ||
            errorMessage.includes(
              "vượt quá tổng khối lượng hợp đồng đã khai báo ("
            ) ||
            errorMessage.includes(
              "vượt quá tổng giá trị hợp đồng đã khai báo ("
            ) ||
            errorMessage.includes(
              "vượt quá tổng trị giá hợp đồng đã khai báo ("
            ) ||
            // Thêm các từ khóa cụ thể hơn nữa
            errorMessage.includes("kg) vượt quá tổng khối lượng") ||
            errorMessage.includes("VND) vượt quá tổng giá trị") ||
            errorMessage.includes(
              "vượt quá tổng khối lượng hợp đồng đã khai báo"
            ) ||
            errorMessage.includes(
              "vượt quá tổng giá trị hợp đồng đã khai báo"
            ) ||
            errorMessage.includes(
              "vượt quá tổng trị giá hợp đồng đã khai báo"
            ) ||
            // Thêm các từ khóa cụ thể hơn nữa
            errorMessage.includes("Tổng khối lượng từ các dòng hợp đồng") ||
            errorMessage.includes("Tổng trị giá từ các dòng hợp đồng") ||
            errorMessage.includes(
              "vượt quá tổng khối lượng hợp đồng đã khai báo"
            ) ||
            errorMessage.includes(
              "vượt quá tổng giá trị hợp đồng đã khai báo"
            ) ||
            errorMessage.includes(
              "vượt quá tổng trị giá hợp đồng đã khai báo"
            ) ||
            // Thêm các từ khóa cụ thể hơn nữa
            errorMessage.includes("kg) vượt quá") ||
            errorMessage.includes("VND) vượt quá") ||
            errorMessage.includes("hiện có") ||
            errorMessage.includes("thêm") ||
            // Thêm các từ khóa cụ thể hơn nữa
            errorMessage.includes("từ các dòng hợp đồng") ||
            errorMessage.includes("hợp đồng đã khai báo") ||
            errorMessage.includes("vượt quá tổng khối lượng") ||
            errorMessage.includes("vượt quá tổng giá trị") ||
            errorMessage.includes("vượt quá tổng trị giá") ||
            // Thêm các từ khóa cụ thể hơn nữa
            errorMessage.includes("Tổng khối lượng từ các dòng hợp đồng (") ||
            errorMessage.includes("Tổng trị giá từ các dòng hợp đồng (") ||
            errorMessage.includes(
              "vượt quá tổng khối lượng hợp đồng đã khai báo ("
            ) ||
            errorMessage.includes(
              "vượt quá tổng giá trị hợp đồng đã khai báo ("
            ) ||
            errorMessage.includes(
              "vượt quá tổng trị giá hợp đồng đã khai báo ("
            ) ||
            // Thêm các từ khóa cụ thể hơn nữa
            errorMessage.includes("kg) vượt quá tổng khối lượng") ||
            errorMessage.includes("VND) vượt quá tổng giá trị") ||
            errorMessage.includes(
              "vượt quá tổng khối lượng hợp đồng đã khai báo"
            ) ||
            errorMessage.includes(
              "vượt quá tổng giá trị hợp đồng đã khai báo"
            ) ||
            errorMessage.includes(
              "vượt quá tổng trị giá hợp đồng đã khai báo"
            ) ||
            // Thêm các từ khóa cụ thể hơn nữa
            errorMessage.includes("Tổng khối lượng từ các dòng hợp đồng") ||
            errorMessage.includes("Tổng trị giá từ các dòng hợp đồng") ||
            errorMessage.includes(
              "vượt quá tổng khối lượng hợp đồng đã khai báo"
            ) ||
            errorMessage.includes(
              "vượt quá tổng giá trị hợp đồng đã khai báo"
            ) ||
            errorMessage.includes(
              "vượt quá tổng trị giá hợp đồng đã khai báo"
            ) ||
            // Thêm các từ khóa cụ thể hơn nữa
            errorMessage.includes("kg) vượt quá") ||
            errorMessage.includes("VND) vượt quá") ||
            errorMessage.includes("hiện có") ||
            errorMessage.includes("thêm") ||
            // Thêm các từ khóa cụ thể hơn nữa
            errorMessage.includes("từ các dòng hợp đồng") ||
            errorMessage.includes("hợp đồng đã khai báo") ||
            errorMessage.includes("vượt quá tổng khối lượng") ||
            errorMessage.includes("vượt quá tổng giá trị") ||
            errorMessage.includes("vượt quá tổng trị giá") ||
            // Thêm các từ khóa cụ thể hơn nữa
            errorMessage.includes("Tổng khối lượng từ các dòng hợp đồng (") ||
            errorMessage.includes("Tổng trị giá từ các dòng hợp đồng (") ||
            errorMessage.includes(
              "vượt quá tổng khối lượng hợp đồng đã khai báo ("
            ) ||
            errorMessage.includes(
              "vượt quá tổng giá trị hợp đồng đã khai báo ("
            ) ||
            errorMessage.includes(
              "vượt quá tổng trị giá hợp đồng đã khai báo ("
            ) ||
            // Thêm các từ khóa cụ thể hơn nữa
            errorMessage.includes("kg) vượt quá tổng khối lượng") ||
            errorMessage.includes("VND) vượt quá tổng giá trị") ||
            errorMessage.includes(
              "vượt quá tổng khối lượng hợp đồng đã khai báo"
            ) ||
            errorMessage.includes(
              "vượt quá tổng giá trị hợp đồng đã khai báo"
            ) ||
            errorMessage.includes("vượt quá tổng trị giá hợp đồng đã khai báo");

          if (isBusinessError) {
            // Đây là lỗi nghiệp vụ, hiển thị trong business errors
            setBusinessErrors([errorMessage]);
            // Không hiển thị toast cho lỗi nghiệp vụ, chỉ hiển thị trong form
          } else {
            // Đây là lỗi khác, sử dụng getErrorMessage
            const finalErrorMessage = getErrorMessage(err);
            toast.error(finalErrorMessage);
          }
        } else {
          // Sử dụng getErrorMessage để xử lý lỗi khác
          errorMessage = getErrorMessage(err);
          toast.error(errorMessage);
        }
      }
    } finally {
      // Reset submitting state
      setIsSubmitting(false);
    }
  }

  // Helper function to calculate totals from contract items
  const calculateTotals = () => {
    if (!data.contractItems || data.contractItems.length === 0) {
      return { totalQuantity: 0, totalValue: 0 };
    }

    const totalQuantity = data.contractItems.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );
    const totalValue = data.contractItems.reduce((sum, item) => {
      const itemValue =
        (item.quantity || 0) * (item.unitPrice || 0) -
        (item.discountAmount || 0);
      return sum + itemValue;
    }, 0);

    return { totalQuantity, totalValue };
  };

  // Helper function to get error for a specific field
  const getFieldError = (fieldName: string): string | undefined => {
    return fieldErrors[fieldName];
  };

  // Helper function to check if field has error
  const hasFieldError = (fieldName: string): boolean => {
    return !!fieldErrors[fieldName];
  };

  // Settlement files helper functions
  const handleSettlementFileSelect = (roundNumber: number, file: File) => {
    setSettlementFiles((prev) => {
      const existingRoundIndex = prev.settlementRounds.findIndex(
        (round) => round.roundName === roundNumber
      );
      
      if (existingRoundIndex >= 0) {
        // Update existing round
        const updatedRounds = [...prev.settlementRounds];
        updatedRounds[existingRoundIndex] = {
          ...updatedRounds[existingRoundIndex],
          settlementFile: file
        };
        return { settlementRounds: updatedRounds };
      } else {
        // Add new round
        return {
          settlementRounds: [
            ...prev.settlementRounds,
            {
              roundName: roundNumber,
              settlementFile: file,
              roundPrice: 0
            }
          ]
        };
      }
    });
  };

  const handleSettlementRoundPriceChange = (roundNumber: number, price: number) => {
    setSettlementFiles((prev) => {
      const existingRoundIndex = prev.settlementRounds.findIndex(
        (round) => round.roundName === roundNumber
      );
      
      if (existingRoundIndex >= 0) {
        // Update existing round
        const updatedRounds = [...prev.settlementRounds];
        updatedRounds[existingRoundIndex] = {
          ...updatedRounds[existingRoundIndex],
          roundPrice: price
        };
        return { settlementRounds: updatedRounds };
      } else {
        // Add new round
        return {
          settlementRounds: [
            ...prev.settlementRounds,
            {
              roundName: roundNumber,
              roundPrice: price
            }
          ]
        };
      }
    });
  };

  const getSettlementRound = (roundNumber: number): SettlementRound | undefined => {
    return settlementFiles.settlementRounds.find(
      (round) => round.roundName === roundNumber
    );
  };

  const removeSettlementFile = (roundNumber: number) => {
    setSettlementFiles((prev) => ({
      settlementRounds: prev.settlementRounds.filter(
        (round) => round.roundName !== roundNumber
      )
    }));
  };

  // Helper function to get display name for a field
  // const getFieldDisplayName = (fieldName: string): string => {
  //   if (fieldName.startsWith("contractItems.")) {
  //     const match = fieldName.match(/contractItems\.(\d+)\.(.*)/);
  //     if (match) {
  //       const index = parseInt(match[1]) + 1;
  //       const itemField = match[2];
  //       const fieldMap: Record<string, string> = {
  //         coffeetypeid: t("contracts.contractItems.coffeeTypeId"),
  //         quantity: t("contracts.contractItems.quantity"),
  //         unitprice: t("contracts.contractItems.unitPrice"),
  //         discountamount: t("contracts.contractItems.discountAmount"),
  //         note: t("contracts.contractItems.note"),
  //       };
  //       return `${t("contracts.contractItems.item", { index })} - ${
  //         fieldMap[itemField] || itemField
  //       }`;
  //     }
  //   }

  //   // Map cho các field chính
  //   const fieldMap: Record<string, string> = {
  //     buyerid: t("contracts.contract.buyerId"),
  //     contractnumber: t("contracts.contract.contractNumber"),
  //     contracttitle: t("contracts.contract.contractTitle"),
  //     contractfileurl: t("contracts.contract.contractFileUrl"),
  //     deliveryrounds: t("contracts.contract.deliveryRounds"),
  //     totalquantity: t("contracts.contract.totalQuantity"),
  //     totalvalue: t("contracts.contract.totalValue"),
  //     startdate: t("contracts.contract.startDate"),
  //     enddate: t("contracts.contract.endDate"),
  //     signedat: t("contracts.contract.signedAt"),
  //     status: t("contracts.contract.status"),
  //     cancelreason: t("contracts.contract.cancelReason"),
  //     contractitems: t("contracts.contract.contractItems"),
  //   };

  //   return (
  //     fieldMap[fieldName.toLowerCase()] ||
  //     fieldName.replace(/([A-Z])/g, " $1").trim()
  //   );
  // };

  return (
    <>
      {/* Modal xem ảnh zoom */}
      {showImageModal && modalImageUrl && (
        <div
          className='fixed inset-0 bg-black bg-opacity-75 z-50 overflow-auto'
          onClick={() => setShowImageModal(false)}
        >
          <div className='min-h-full flex items-center justify-center p-4'>
            <div className='relative' onClick={(e) => e.stopPropagation()}>
              {/* Nút đóng */}
              <button
                onClick={() => setShowImageModal(false)}
                className='absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 z-10'
              >
                ✕
              </button>

              <img
                src={modalImageUrl}
                alt='Preview zoom'
                className='max-w-none rounded-lg shadow-2xl'
                style={{ maxHeight: "90vh", width: "auto", height: "auto" }}
              />
            </div>
          </div>
        </div>
      )}

      <form className='max-w-4xl mx-auto bg-white border rounded-2xl shadow p-8 space-y-6'>
        <h2 className='text-2xl font-semibold text-center mb-6'>
          {isEdit ? t("contracts.contract.edit") : t("contracts.contract.new")}
        </h2>

        {/* Hiển thị lỗi nghiệp vụ */}
        {businessErrors.length > 0 && (
          <div className='p-4 bg-orange-50 border border-orange-200 rounded-lg'>
            <div className='flex items-center justify-between mb-2'>
              <h3 className='text-orange-800 font-medium'>
                {t("contracts.contract.businessRules")}:
              </h3>
              <span className='bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full'>
                {businessErrors.length} {t("contracts.contract.rules")}
              </span>
            </div>

            {/* Tóm tắt nhanh */}
            <div className='mb-3 p-2 bg-orange-100 rounded text-orange-800 text-sm'>
              <strong>{t("contracts.contract.summary")}:</strong>
              {businessErrors.some((err) => err.includes("vượt quá")) &&
                t("contracts.contract.adjustTotal")}
              {businessErrors.some((err) => err.includes("cùng loại")) &&
                t("contracts.contract.removeDuplicate")}
              {businessErrors.some((err) => err.includes("đã tồn tại")) &&
                t("contracts.contract.changeNumber")}
              {businessErrors.some((err) => err.includes("không có quyền")) &&
                t("contracts.contract.contactAdmin")}
            </div>

            {/* Hướng dẫn giải quyết */}
            <div className='mt-3 pt-3 border-t border-orange-200'>
              <p className='text-orange-600 text-sm font-medium mb-2'>
                {t("contracts.contract.instructions")}:
              </p>
              <ul className='text-orange-600 text-xs space-y-1'>
                {businessErrors.some((err) => err.includes("vượt quá")) && (
                  <>
                    <li>• {t("contracts.contract.checkTotal")}</li>
                    <li>• {t("contracts.contract.ensureTotal")}</li>
                    <li>{t("contracts.contract.orIncrease")}</li>
                    {(() => {
                      const { totalQuantity, totalValue } = calculateTotals();
                      return (
                        <>
                          <li>
                            •{" "}
                            {t("contracts.contract.totalFromItems", {
                              totalQuantity: totalQuantity.toFixed(1),
                              totalValue: totalValue.toLocaleString(),
                            })}
                          </li>
                          <li>
                            •{" "}
                            {t("contracts.contract.currentContract", {
                              totalQuantity: data.totalQuantity || 0,
                              totalValue: data.totalValue || 0,
                            })}
                          </li>
                          <li className='mt-2'>
                            <Button
                              type='button'
                              variant='outline'
                              size='sm'
                              onClick={() => {
                                const { totalQuantity, totalValue } =
                                  calculateTotals();
                                handleChange("totalQuantity", totalQuantity);
                                handleChange("totalValue", totalValue);
                                toast.success(
                                  t("contracts.messages.updateTotal")
                                );
                              }}
                              className='text-xs h-6 px-2'
                            >
                              {t("contracts.contract.autoUpdateTotal")}
                            </Button>
                          </li>
                        </>
                      );
                    })()}
                  </>
                )}
                {businessErrors.some((err) => err.includes("cùng loại")) && (
                  <li>• {t("contracts.contract.noDuplicate")}</li>
                )}
                {businessErrors.some((err) => err.includes("đã tồn tại")) && (
                  <li>• {t("contracts.contract.numberExists")}</li>
                )}
                {businessErrors.some((err) =>
                  err.includes("không có quyền")
                ) && (
                  <li>{t("contracts.contract.contactAdminForPermission")}</li>
                )}
                {businessErrors.some((err) =>
                  err.includes("không được âm")
                ) && <li>{t("contracts.contract.checkNonNegativeValues")}</li>}
                {businessErrors.some(
                  (err) =>
                    err.includes("phải lớn hơn") || err.includes("phải nhỏ hơn")
                ) && <li>{t("contracts.contract.checkMinMaxValues")}</li>}
              </ul>
            </div>
          </div>
        )}

        {/* <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block mb-1 text-sm font-medium'>
              {t("contract.components.form.fields.contractType")}{" "}
              <span className='text-red-500'>*</span>
            </label>
            <select
              value={data.contractType || ""}
              onChange={(e) => {
                handleChange("contractType", e.target.value);
                // Reset parentContractId khi thay đổi contract type
                if (e.target.value !== "amendment") {
                  handleChange("parentContractId", "");
                }
              }}
              className={`w-full p-2 border rounded ${
                hasFieldError("contractType") ? "border-red-500" : ""
              }`}
              required
            >
              <option value=''>
                -- {t("contract.components.form.fields.contractType")} --
              </option>
              <option value='contract'>
                {t("contract.components.form.fields.contractTypes.contract")}
              </option>
              <option value='amendment'>
                {t(
                  "contract.components.form.fields.contractTypes.parentContract"
                )}
              </option>
            </select>
            {hasFieldError("contractType") && (
              <p className='text-red-500 text-xs mt-1'>
                {getFieldError("contractType")}
              </p>
            )}
          </div>

          {data.contractType === "amendment" && (
            <div>
              <label className='block mb-1 text-sm font-medium'>
                {t("contract.components.form.fields.parentContractId")}{" "}
                <span className='text-red-500'>*</span>
              </label>
              <select
                value={data.parentContractId || ""}
                onChange={(e) =>
                  handleChange("parentContractId", e.target.value)
                }
                className={`w-full p-2 border rounded ${
                  hasFieldError("parentContractId") ? "border-red-500" : ""
                }`}
                required
              >
                <option value=''>
                  -- {t("contract.components.form.fields.parentContractId")} --
                </option>
                {contracts
                  .filter((contract) =>
                    // Loại trừ contract hiện tại khi edit
                    isEdit
                      ? contract.contractId !==
                        (initialData as ContractUpdateDto)?.contractId
                      : true
                  )
                  .map((contract) => (
                    <option
                      key={contract.contractId}
                      value={contract.contractId}
                    >
                      {contract.contractNumber} - {contract.contractTitle}
                    </option>
                  ))}
              </select>
              {hasFieldError("parentContractId") && (
                <p className='text-red-500 text-xs mt-1'>
                  {getFieldError("parentContractId")}
                </p>
              )}
            </div>
          )}
        </div> */}

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block mb-1 text-sm font-medium'>
              {t("contracts.contract.contractNumber")}{" "}
              <span className='text-red-500'>*</span>
            </label>
            <Input
              placeholder='VD: CT001-2024, HD001, CONTRACT-001'
              value={data.contractNumber}
              onChange={(e) => handleChange("contractNumber", e.target.value)}
              required
              className={
                hasFieldError("contractNumber") ? "border-red-500" : ""
              }
            />
            {hasFieldError("contractNumber") && (
              <p className='text-red-500 text-xs mt-1'>
                {getFieldError("contractNumber")}
              </p>
            )}
            <p className='text-xs text-gray-500 mt-1'>
              {t("contracts.contract.format")}:{" "}
              {t("contracts.contract.formatText")}
            </p>
          </div>

          <div>
            <label className='block mb-1 text-sm font-medium'>
              {t("contracts.contract.contractTitle")}{" "}
              <span className='text-red-500'>*</span>
            </label>
            <Input
              placeholder='VD: Hợp đồng cung cấp cà phê Robusta 2024'
              value={data.contractTitle}
              onChange={(e) => handleChange("contractTitle", e.target.value)}
              required
              className={hasFieldError("contractTitle") ? "border-red-500" : ""}
            />
            {hasFieldError("contractTitle") && (
              <p className='text-red-500 text-xs mt-1'>
                {getFieldError("contractTitle")}
              </p>
            )}
            <p className='text-xs text-gray-500 mt-1'>
              {t("contracts.contract.example")}:{" "}
              {t("contracts.contract.exampleText")}
            </p>
          </div>
        </div>

        <div>
          <label className='block mb-1 text-sm font-medium'>
            {t("contracts.contract.contractFile")}
          </label>
          <div className='flex items-center gap-3'>
            <Input
              placeholder='URL file hoặc chọn file từ máy'
              value={data.contractFileUrl || ""}
              onChange={(e) => handleChange("contractFileUrl", e.target.value)}
              className={
                hasFieldError("contractFileUrl") ? "border-red-500" : ""
              }
            />
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                // Tạo input file ẩn
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*,.pdf,.doc,.docx";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    // Lưu file object để tạo preview
                    setSelectedFile(file);

                    // Tạo URL để preview ảnh
                    if (file.type.startsWith("image/")) {
                      const url = URL.createObjectURL(file);
                      setFilePreviewUrl(url);
                    } else {
                      setFilePreviewUrl(null);
                    }

                    // Khi chọn file mới, xóa URL cũ và hiển thị tên file
                    handleChange("contractFileUrl", "");
                    toast.success(
                      t("contract.components.form.messages.fileSelected", {
                        fileName: file.name,
                      })
                    );
                  }
                };
                input.click();
              }}
              className='whitespace-nowrap'
            >
              {t("contracts.contract.selectFile")}
            </Button>
            {data.contractFileUrl && (
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  // Nếu là URL, mở trong tab mới
                  if (data.contractFileUrl?.startsWith("http")) {
                    window.open(data.contractFileUrl, "_blank");
                  } else {
                    // Nếu là tên file local, hiển thị thông tin
                    toast.info(
                      t("contracts.messages.fileInfo", {
                        fileName: data.contractFileUrl,
                      })
                    );
                  }
                }}
                className='whitespace-nowrap'
              >
                {t("contracts.contract.viewFile")}
              </Button>
            )}
          </div>
          {hasFieldError("contractFileUrl") && (
            <p className='text-red-500 text-xs mt-1'>
              {getFieldError("contractFileUrl")}
            </p>
          )}
          {hasFieldError("contractFile") && (
            <p className='text-red-500 text-xs mt-1'>
              {getFieldError("contractFile")}
            </p>
          )}
          <p className='text-xs text-gray-500 mt-1'>
            {t("contracts.contract.support")}: Ảnh (JPG, PNG, GIF, WebP), Word
            (DOC, DOCX)
          </p>
          <p className='text-xs text-orange-600 mt-1 font-medium'>
            ⚠️ {t("contract.components.form.fields.uploadFileLimit")}: 10MB
          </p>

          {/* Preview file đã chọn hoặc file hiện tại */}
          {(data.contractFileUrl || selectedFile) && (
            <div className='mt-3 p-3 bg-gray-50 border rounded-lg'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-medium text-gray-700'>
                  {selectedFile
                    ? t("contracts.contract.newFile")
                    : t("contracts.contract.currentFile")}
                  :
                </span>
                <span className='text-xs text-gray-500'>
                  {selectedFile ? selectedFile.name : data.contractFileUrl}
                </span>
              </div>

              {/* Thông báo trạng thái */}
              {selectedFile && (
                <div className='mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-700 text-xs'>
                  ℹ️ {t("contracts.contract.newFileWillReplace")}
                </div>
              )}

              {/* Preview cho ảnh */}
              {(data.contractFileUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
                selectedFile?.type.startsWith("image/")) && (
                <div className='mt-2'>
                  {filePreviewUrl ? (
                    <img
                      src={filePreviewUrl}
                      alt='Preview'
                      width={200}
                      height={150}
                      className='max-w-full h-32 object-contain border rounded cursor-pointer hover:opacity-80 transition-opacity'
                      onError={() => toast.error("Không thể tải ảnh preview")}
                      onClick={() => {
                        if (filePreviewUrl) {
                          setModalImageUrl(filePreviewUrl);
                          setShowImageModal(true);
                        }
                      }}
                      title={t("contracts.contract.clickToViewFull")}
                    />
                  ) : data.contractFileUrl?.startsWith("http") ? (
                    <img
                      src={data.contractFileUrl}
                      alt='Preview'
                      width={200}
                      height={150}
                      className='max-w-full h-32 object-contain border rounded cursor-pointer hover:opacity-80 transition-opacity'
                      onError={() => toast.error("Không thể tải ảnh preview")}
                      onClick={() => {
                        if (data.contractFileUrl) {
                          setModalImageUrl(data.contractFileUrl);
                          setShowImageModal(true);
                        }
                      }}
                      title={t("contracts.contract.clickToViewFull")}
                    />
                  ) : (
                    <div className='h-32 bg-gray-100 border rounded flex items-center justify-center'>
                      <span className='text-gray-500 text-sm'>
                        {t("contracts.contract.imagePreview", {
                          name: selectedFile
                            ? selectedFile.name
                            : data.contractFileUrl,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Preview cho PDF */}
              {(data.contractFileUrl?.match(/\.pdf$/i) ||
                selectedFile?.name?.match(/\.pdf$/i)) && (
                <div className='mt-2'>
                  {data.contractFileUrl?.startsWith("http") ? (
                    <div className='h-32 bg-red-50 border border-red-200 rounded flex items-center justify-center'>
                      <a
                        href={data.contractFileUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-red-600 hover:text-red-800 text-sm font-medium'
                      >
                        {t("contracts.contract.viewPdf", {
                          fileName: data.contractFileUrl.split("/").pop(),
                        })}
                      </a>
                    </div>
                  ) : (
                    <div className='h-32 bg-gray-100 border rounded flex items-center justify-center'>
                      <span className='text-gray-500 text-sm'>
                        {t("contracts.contract.pdfPreview", {
                          name: selectedFile
                            ? selectedFile.name
                            : data.contractFileUrl,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Preview cho Word */}
              {(data.contractFileUrl?.match(/\.(doc|docx)$/i) ||
                selectedFile?.name?.match(/\.(doc|docx)$/i)) && (
                <div className='mt-2'>
                  <div className='h-32 bg-blue-50 border border-blue-200 rounded flex items-center justify-center'>
                    <span className='text-blue-600 text-sm font-medium'>
                      {t("contracts.contract.wordPreview", {
                        name: selectedFile
                          ? selectedFile.name
                          : data.contractFileUrl,
                      })}
                    </span>
                  </div>
                </div>
              )}

              {/* Remove file buttons */}
              <div className='mt-3 flex gap-2'>
                {selectedFile && (
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreviewUrl(null);
                      handleChange("contractFileUrl", "");
                      toast.info(t("contracts.messages.deleteNewFile"));
                    }}
                    className='text-red-600 border-red-200 hover:bg-red-50'
                  >
                    {t("contracts.contract.deleteNewFile")}
                  </Button>
                )}

                {data.contractFileUrl && !selectedFile && (
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      handleChange("contractFileUrl", "");
                      setFilePreviewUrl(null);
                      toast.info(t("contracts.messages.deleteCurrentFile"));
                    }}
                    className='text-orange-600 border-orange-200 hover:bg-orange-50'
                  >
                    {t("contracts.contract.deleteCurrentFile")}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className='block mb-1 text-sm font-medium'>
            {t("contracts.contract.buyer")}{" "}
            <span className='text-red-500'>*</span>
          </label>
          <select
            value={data.buyerId}
            onChange={(e) => handleChange("buyerId", e.target.value)}
            className={`w-full p-2 border rounded ${
              hasFieldError("buyerId") ? "border-red-500" : ""
            }`}
            required
          >
            <option value=''>
              -- {t("contracts.contract.selectBuyer")} --
            </option>
            {buyers.map((buyer) => (
              <option key={buyer.buyerId} value={buyer.buyerId}>
                {buyer.companyName}
              </option>
            ))}
          </select>
          {hasFieldError("buyerId") && (
            <p className='text-red-500 text-xs mt-1'>
              {getFieldError("buyerId")}
            </p>
          )}
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <label className='block mb-1 text-sm font-medium'>
              {t("contracts.contract.deliveryRounds")}{" "}
              <span className='text-red-500'>*</span>
            </label>
            <Input
              type='number'
              min={1}
              value={data.deliveryRounds || ""}
              onChange={(e) =>
                handleNumericChange("deliveryRounds", Number(e.target.value))
              }
              className={
                hasFieldError("deliveryRounds") ? "border-red-500" : ""
              }
            />
            {hasFieldError("deliveryRounds") && (
              <p className='text-red-500 text-xs mt-1'>
                {getFieldError("deliveryRounds")}
              </p>
            )}
          </div>

          <div>
            <label className='block mb-1 text-sm font-medium'>
              {t("contracts.contract.totalQuantity")}{" "}
              <span className='text-red-500'>*</span>
            </label>
            <Input
              type='number'
              step={0.1}
              min={0}
              value={data.totalQuantity || ""}
              onChange={(e) =>
                handleNumericChange("totalQuantity", Number(e.target.value))
              }
              className={hasFieldError("totalQuantity") ? "border-red-500" : ""}
            />
            {hasFieldError("totalQuantity") && (
              <p className='text-red-500 text-xs mt-1'>
                {getFieldError("totalQuantity")}
              </p>
            )}
          </div>

          <div>
            <label className='block mb-1 text-sm font-medium'>
              {t("contracts.contract.totalValue")}{" "}
              <span className='text-red-500'>*</span>
            </label>
            <Input
              type='number'
              min={0}
              value={data.totalValue || ""}
              onChange={(e) =>
                handleNumericChange("totalValue", Number(e.target.value))
              }
              className={hasFieldError("totalValue") ? "border-red-500" : ""}
            />
            {hasFieldError("totalValue") && (
              <p className='text-red-500 text-xs mt-1'>
                {getFieldError("totalValue")}
              </p>
            )}
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <label className='block mb-1 text-sm font-medium'>
              {t("contract.components.form.fields.paymentRounds")}{" "}
              <span className='text-red-500'>*</span>
            </label>
            <Input
              type='number'
              min={1}
              step={1}
              value={data.paymentRounds || ""}
              onChange={(e) => {
                const value = Number(e.target.value);
                // Prevent negative values and 0
                if (value <= 0 && e.target.value !== "") {
                  return; // Don't update if value is 0 or negative
                }
                handleNumericChange("paymentRounds", value);
              }}
              onKeyDown={(e) => {
                // Prevent typing negative sign or 0 as first character
                if (e.key === '-' || (e.key === '0' && e.currentTarget.value === '')) {
                  e.preventDefault();
                }
              }}
              className={hasFieldError("paymentRounds") ? "border-red-500" : ""}
            />
            {hasFieldError("paymentRounds") && (
              <p className='text-red-500 text-xs mt-1'>
                {getFieldError("paymentRounds")}
              </p>
            )}
          </div>

          <div className='md:col-span-2'>
            <label className='block mb-1 text-sm font-medium'>
              {t("contract.components.form.fields.settlementNote")}
            </label>
            <Textarea
              placeholder={t("contract.components.form.fields.settlementNotePlaceholder")}
              value={data.settlementNote || ""}
              onChange={(e) => handleChange("settlementNote", e.target.value)}
              className={hasFieldError("settlementNote") ? "border-red-500" : ""}
              rows={3}
            />
            {hasFieldError("settlementNote") && (
              <p className='text-red-500 text-xs mt-1'>
                {getFieldError("settlementNote")}
              </p>
            )}
          </div>
        </div>

        {/* Settlement Files Section */}
        {data.paymentRounds && data.paymentRounds > 0 && (
          <div>
            <label className='block mb-3 text-sm font-medium'>
              {t("contract.components.form.fields.settlementFile")}
            </label>
            <p className='text-xs text-orange-600 mb-3 font-medium'>
              ⚠️ {t("contract.components.form.fields.uploadEachFileLimit")}: 10MB
            </p>
            <div className='space-y-4'>
              {Array.from({ length: data.paymentRounds }, (_, index) => {
                const roundNumber = index + 1;
                const settlementRound = getSettlementRound(roundNumber);
                const hasFile = settlementRound?.settlementFile;
                const previewUrl = settlementRound?.settlementFileURL;

                return (
                  <div
                    key={roundNumber}
                    className='border rounded-lg p-4 bg-gray-50'
                  >
                    <div className='flex items-center justify-between mb-3'>
                      <h4 className='font-medium text-sm'>
                        {t(
                          "contract.components.form.fields.settlementFiles.round",
                          { round: roundNumber }
                        )}
                      </h4>
                      {/* {hasFile && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          {t("contracts.contract.fileSelected")}
                        </span>
                      )} */}
                    </div>

                    <div className='space-y-3'>
                      <div className='flex items-center gap-3'>
                        <Input
                          placeholder={t(
                            "contract.components.form.fields.settlementFiles.placeholder"
                          )}
                          value={previewUrl || ""} // Hiển thị URL từ API hoặc để trống
                          onChange={(e) => {
                            // Cập nhật URL khi người dùng chỉnh sửa
                            setSettlementFiles((prev) => {
                              const existingRoundIndex = prev.settlementRounds.findIndex(
                                (round) => round.roundName === roundNumber
                              );
                              
                              if (existingRoundIndex >= 0) {
                                const updatedRounds = [...prev.settlementRounds];
                                updatedRounds[existingRoundIndex] = {
                                  ...updatedRounds[existingRoundIndex],
                                  settlementFileURL: e.target.value.trim() || undefined
                                };
                                return { settlementRounds: updatedRounds };
                              } else {
                                return {
                                  settlementRounds: [
                                    ...prev.settlementRounds,
                                    {
                                      roundName: roundNumber,
                                      settlementFileURL: e.target.value.trim() || undefined,
                                      roundPrice: 0
                                    }
                                  ]
                                };
                              }
                            });
                          }}
                          className='flex-1'
                        />
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*,.pdf,.doc,.docx";
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement)
                              .files?.[0];
                            if (file) {
                              handleSettlementFileSelect(roundNumber, file);
                            }
                          };
                          input.click();
                        }}
                        className='whitespace-nowrap'
                      >
                        {t("contracts.contract.selectFile")}
                      </Button>
                      </div>
                      
                      {/* Settlement File Validation Error */}
                      {hasFieldError(`settlementFile_${roundNumber}`) && (
                        <p className='text-red-500 text-xs mt-1'>
                          {getFieldError(`settlementFile_${roundNumber}`)}
                        </p>
                      )}
                      
                      {/* Round Price Input */}
                      <div className='flex items-center gap-3'>
                        <label className='text-sm font-medium text-gray-700 whitespace-nowrap'>
                          {t("contract.components.form.fields.settlementFiles.roundPrice")}:
                          {(hasFile || previewUrl) && (
                            <span className='text-red-500 ml-1'>*</span>
                          )}
                        </label>
                        <Input
                          type='number'
                          placeholder={t("contract.components.form.fields.settlementFiles.roundPricePlaceholder")}
                          value={settlementRound?.roundPrice || ""}
                          onChange={(e) => {
                            const price = parseFloat(e.target.value) || 0;
                            handleSettlementRoundPriceChange(roundNumber, price);
                          }}
                          className={`flex-1 ${hasFieldError(`roundPrice_${roundNumber}`) ? "border-red-500" : ""}`}
                          min='0'
                          step='1000'
                        />
                        <span className='text-sm text-gray-500 whitespace-nowrap'>VND</span>
                      </div>
                      {hasFieldError(`roundPrice_${roundNumber}`) && (
                        <p className='text-red-500 text-xs mt-1'>
                          {getFieldError(`roundPrice_${roundNumber}`)}
                        </p>
                      )}
                    </div>

                    {/* File Preview */}
                    {(hasFile || previewUrl) && (
                      <div className='mt-3 p-3 bg-white border rounded-lg'>
                        <div className='flex items-center justify-between mb-2'>
                          <span className='text-sm font-medium text-gray-700'>
                            {hasFile
                              ? t(
                                  "contract.components.form.fields.settlementFiles.selectedFile"
                                )
                              : t(
                                  "contract.components.form.fields.settlementFiles.existingFile"
                                )}
                            :
                          </span>
                          <span className='text-xs text-gray-500'>
                            {hasFile
                              ? hasFile.name
                              : previewUrl}
                          </span>
                        </div>

                        {/* Preview cho ảnh từ file mới */}
                        {hasFile &&
                          hasFile.type.startsWith("image/") &&
                          previewUrl && (
                            <div className='mt-2'>
                              <img
                                src={previewUrl}
                                alt={`Settlement Round ${roundNumber} Preview`}
                                width={200}
                                height={150}
                                className='max-w-full h-32 object-contain border rounded cursor-pointer hover:opacity-80 transition-opacity'
                                onClick={() => {
                                  setModalImageUrl(previewUrl);
                                  setShowImageModal(true);
                                }}
                                title={t("contracts.contract.clickToViewFull")}
                              />
                            </div>
                          )}

                        {/* Preview cho URL từ API (ảnh) */}
                        {!hasFile &&
                          previewUrl &&
                          previewUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                            <div className='mt-2'>
                              <img
                                src={previewUrl}
                                alt={`Settlement Round ${roundNumber} Preview`}
                                width={200}
                                height={150}
                                className='max-w-full h-32 object-contain border rounded cursor-pointer hover:opacity-80 transition-opacity'
                                onClick={() => {
                                  setModalImageUrl(previewUrl);
                                  setShowImageModal(true);
                                }}
                                title={t("contracts.contract.clickToViewFull")}
                              />
                            </div>
                          )}

                        {/* Preview cho PDF từ file mới */}
                        {hasFile && hasFile.name?.match(/\.pdf$/i) && (
                          <div className='mt-2'>
                            <div className='h-20 bg-red-50 border border-red-200 rounded flex items-center justify-center'>
                              <span className='text-red-600 text-sm font-medium'>
                                📄 PDF: {hasFile.name}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Preview cho URL từ API (PDF) */}
                        {!hasFile &&
                          previewUrl &&
                          previewUrl?.match(/\.pdf$/i) && (
                            <div className='mt-2'>
                              <div className='h-20 bg-red-50 border border-red-200 rounded flex items-center justify-center'>
                                <a
                                  href={previewUrl}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='text-red-600 hover:text-red-800 text-sm font-medium'
                                >
                                  📄 PDF: {previewUrl.split("/").pop()}
                                </a>
                              </div>
                            </div>
                          )}

                        {/* Preview cho Word từ file mới */}
                        {hasFile && hasFile.name?.match(/\.(doc|docx)$/i) && (
                          <div className='mt-2'>
                            <div className='h-20 bg-blue-50 border border-blue-200 rounded flex items-center justify-center'>
                              <span className='text-blue-600 text-sm font-medium'>
                                📝 Word: {hasFile.name}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Preview cho URL từ API (Word) */}
                        {!hasFile &&
                          previewUrl &&
                          previewUrl?.match(/\.(doc|docx)$/i) && (
                            <div className='mt-2'>
                              <div className='h-20 bg-blue-50 border border-blue-200 rounded flex items-center justify-center'>
                                <a
                                  href={previewUrl}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='text-blue-600 hover:text-blue-800 text-sm font-medium'
                                >
                                  📝 Word: {previewUrl.split("/").pop()}
                                </a>
                              </div>
                            </div>
                          )}

                        {/* Remove button */}
                        <div className='mt-3 flex gap-2'>
                          {hasFile && (
                            <Button
                              type='button'
                              variant='outline'
                              size='sm'
                              onClick={() => removeSettlementFile(roundNumber)}
                              className='text-red-600 border-red-200 hover:bg-red-50'
                            >
                              {t(
                                "contract.components.form.fields.settlementFiles.removeFile"
                              )}
                            </Button>
                          )}
                          {!hasFile &&
                            previewUrl && (
                              <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                onClick={() => removeSettlementFile(roundNumber)}
                                className='text-orange-600 border-orange-200 hover:bg-orange-50'
                              >
                                {t(
                                  "contract.components.form.fields.settlementFiles.removeFile"
                                )}
                              </Button>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <label className='block mb-1 text-sm font-medium'>
              {t("contracts.contract.startDate")}{" "}
              <span className='text-red-500'>*</span>
            </label>
            <DatePicker
              value={data.startDate || undefined}
              onChange={(date) => handleChange("startDate", date)}
              required
              error={hasFieldError("startDate")}
              errorMessage={getFieldError("startDate")}
            />
          </div>
          <div>
            <label className='block mb-1 text-sm font-medium'>
              {t("contracts.contract.endDate")}{" "}
              <span className='text-red-500'>*</span>
            </label>
            <DatePicker
              value={data.endDate || undefined}
              onChange={(date) => handleChange("endDate", date)}
              required
              error={hasFieldError("endDate")}
              errorMessage={getFieldError("endDate")}
            />
          </div>
          <div>
            <label className='block mb-1 text-sm font-medium'>
              {t("contracts.contract.signedAt")}
            </label>
            <DatePicker
              value={data.signedAt || undefined}
              onChange={(date) => {
                handleChange("signedAt", date);
              }}
              error={hasFieldError("signedAt")}
              errorMessage={getFieldError("signedAt")}
            />
          </div>
        </div>

        {/* Chỉ hiển thị trạng thái khi edit */}
        {isEdit && (
          <div>
            <label className='block mb-1 text-sm font-medium'>
              {t("contracts.contract.status")}
            </label>
            <select
              className={`w-full p-2 border rounded ${
                hasFieldError("status") ? "border-red-500" : ""
              }`}
              value={data.status}
              onChange={(e) => handleChange("status", e.target.value)}
            >
              {/* Chỉ cho phép chọn các trạng thái hợp lý dựa trên ngày bắt đầu và ngày kết thúc */}
              {data.startDate && (
                <>
                  {(() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const startDate = new Date(data.startDate);
                    startDate.setHours(0, 0, 0, 0);
                    const endDate = data.endDate
                      ? new Date(data.endDate)
                      : null;
                    const endDateNormalized = endDate
                      ? new Date(endDate)
                      : null;
                    if (endDateNormalized) {
                      endDateNormalized.setHours(0, 0, 0, 0);
                    }

                    if (startDate > today) {
                      // Ngày bắt đầu trong tương lai - chỉ có thể chọn "Chưa bắt đầu" hoặc "Đã hủy"
                      return (
                        <>
                          <option value={ContractStatus.NotStarted}>
                            {getStatusDisplay(ContractStatus.NotStarted).label}
                          </option>
                          <option value={ContractStatus.Cancelled}>
                            {getStatusDisplay(ContractStatus.Cancelled).label}
                          </option>
                        </>
                      );
                    } else if (endDateNormalized && endDateNormalized < today) {
                      // Ngày kết thúc trong quá khứ - chỉ có thể chọn "Hoàn thành" hoặc "Quá hạn"
                      return (
                        <>
                          <option value={ContractStatus.Completed}>
                            {getStatusDisplay(ContractStatus.Completed).label}
                          </option>
                          <option value={ContractStatus.Expired}>
                            {getStatusDisplay(ContractStatus.Expired).label}
                          </option>
                        </>
                      );
                    } else {
                      // Ngày bắt đầu là hôm nay hoặc quá khứ, ngày kết thúc chưa đến - có thể chọn "Đang thực hiện", "Hoàn thành" hoặc "Đã hủy"
                      return (
                        <>
                          <option value={ContractStatus.InProgress}>
                            {getStatusDisplay(ContractStatus.InProgress).label}
                          </option>
                          <option value={ContractStatus.Completed}>
                            {getStatusDisplay(ContractStatus.Completed).label}
                          </option>
                          <option value={ContractStatus.Cancelled}>
                            {getStatusDisplay(ContractStatus.Cancelled).label}
                          </option>
                        </>
                      );
                    }
                  })()}
                </>
              )}
            </select>
            {hasFieldError("status") && (
              <p className='text-red-500 text-xs mt-1'>
                {getFieldError("status")}
              </p>
            )}
          </div>
        )}

        {/* Hiển thị trạng thái hiện tại khi create */}
        {!isEdit && (
          <div>
            <label className='block mb-1 text-sm font-medium'>
              {t("contracts.contract.status")}
            </label>
            <div className='p-2 border rounded bg-gray-50'>
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  getStatusDisplay(data.status).className
                }`}
              >
                {getStatusDisplay(data.status).label}
              </span>
            </div>
            <p className='text-xs text-gray-500 mt-2'>
              {t("contracts.contract.statusAutoUpdate")}
            </p>
          </div>
        )}

        {/* Chỉ hiển thị lý do hủy khi edit và trạng thái = "Đã hủy" */}
        {isEdit && data.status === ContractStatus.Cancelled && (
          <div>
            <label className='block mb-1 text-sm font-medium'>
              {t("contracts.contract.cancelReason")}{" "}
              <span className='text-red-500'>*</span>
            </label>
            <Textarea
              placeholder={t("contracts.contract.enterCancelReason")}
              value={data.cancelReason}
              onChange={(e) => handleChange("cancelReason", e.target.value)}
              className={hasFieldError("cancelReason") ? "border-red-500" : ""}
              required
            />
            {hasFieldError("cancelReason") && (
              <p className='text-red-500 text-xs mt-1'>
                {getFieldError("cancelReason")}
              </p>
            )}
          </div>
        )}

        <div>
          <label className='block mb-1 text-sm font-medium'>
            {t("contracts.contract.contractItems")}{" "}
            <span className='text-red-500'>*</span>
          </label>

          {/* Hiển thị lỗi tổng quát cho contract items */}
          {hasFieldError("contractItems") && (
            <div className='mb-3 p-3 bg-red-50 border border-red-200 rounded-md'>
              <p className='text-red-600 text-sm font-medium'>
                {getFieldError("contractItems")}
              </p>
            </div>
          )}

          {data.contractItems.length > 0 && (
            <>
              {/* Header */}
              <div className='hidden md:grid md:grid-cols-6 gap-2 mb-1 text-xs font-medium text-muted-foreground'>
                <span>{t("contracts.contractItems.coffeeTypeId")}</span>
                <span>{t("contracts.contractItems.quantity")}</span>
                <span>{t("contracts.contractItems.unitPrice")}</span>
                <span>{t("contracts.contractItems.discountAmount")}</span>
                <span>{t("contracts.contractItems.note")}</span>
                <span></span>
              </div>

              {/* Body */}
              {data.contractItems.map((item, index) => (
                <div
                  key={index}
                  className='grid grid-cols-1 md:grid-cols-6 gap-2 mb-2'
                >
                  {/* Loại cà phê */}
                  <select
                    value={item.coffeeTypeId}
                    onChange={(e) =>
                      updateContractItem(index, "coffeeTypeId", e.target.value)
                    }
                    className={`p-2 border rounded ${
                      hasFieldError(`contractItems.${index}.coffeeTypeId`)
                        ? "border-red-500"
                        : ""
                    }`}
                  >
                    <option value=''>
                      -- {t("contracts.contractItems.selectCoffeeType")} --
                    </option>
                    {coffeeTypes.map((type) => (
                      <option key={type.coffeeTypeId} value={type.coffeeTypeId}>
                        {type.typeName}
                      </option>
                    ))}
                  </select>
                  {hasFieldError(`contractItems.${index}.coffeeTypeId`) && (
                    <p className='text-red-500 text-xs mt-1'>
                      {getFieldError(`contractItems.${index}.coffeeTypeId`)}
                    </p>
                  )}

                  {/* Số lượng */}
                  <Input
                    type='number'
                    min={0}
                    step={0.1}
                    value={item.quantity}
                    onChange={(e) =>
                      updateContractItem(
                        index,
                        "quantity",
                        Number(e.target.value)
                      )
                    }
                    className={
                      hasFieldError(`contractItems.${index}.quantity`)
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {hasFieldError(`contractItems.${index}.quantity`) && (
                    <p className='text-red-500 text-xs mt-1'>
                      {getFieldError(`contractItems.${index}.quantity`)}
                    </p>
                  )}

                  {/* Đơn giá */}
                  <Input
                    type='number'
                    min={0}
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateContractItem(
                        index,
                        "unitPrice",
                        Number(e.target.value)
                      )
                    }
                    className={
                      hasFieldError(`contractItems.${index}.unitPrice`)
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {hasFieldError(`contractItems.${index}.unitPrice`) && (
                    <p className='text-red-500 text-xs mt-1'>
                      {getFieldError(`contractItems.${index}.unitPrice`)}
                    </p>
                  )}

                  {/* Chiết khấu */}
                  <Input
                    type='number'
                    step={0.1}
                    min={0}
                    value={item.discountAmount || ""}
                    onChange={(e) =>
                      updateContractItem(
                        index,
                        "discountAmount",
                        Number(e.target.value)
                      )
                    }
                    className={
                      hasFieldError(`contractItems.${index}.discountAmount`)
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {hasFieldError(`contractItems.${index}.discountAmount`) && (
                    <p className='text-red-500 text-xs mt-1'>
                      {getFieldError(`contractItems.${index}.discountAmount`)}
                    </p>
                  )}

                  {/* Ghi chú */}
                  <Input
                    placeholder={t("contracts.contractItems.notePlaceholder")}
                    value={item.note || ""}
                    onChange={(e) =>
                      updateContractItem(index, "note", e.target.value)
                    }
                    className={
                      hasFieldError(`contractItems.${index}.note`)
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {hasFieldError(`contractItems.${index}.note`) && (
                    <p className='text-red-500 text-xs mt-1'>
                      {getFieldError(`contractItems.${index}.note`)}
                    </p>
                  )}

                  <Button
                    type='button'
                    variant='destructive'
                    onClick={() => removeContractItem(index)}
                  >
                    {t("contracts.contract.delete")}
                  </Button>
                </div>
              ))}
            </>
          )}

          <Button
            type='button'
            variant='outline'
            onClick={addContractItem}
            className='mt-2'
          >
            + {t("contracts.contract.addItem")}
          </Button>
        </div>

        <DialogFooter className='flex justify-between pt-4'>
          <LoadingButton 
            type='submit' 
            onClick={handleSubmit}
            loading={isSubmitting}
            className="relative"
          >
            {isSubmitting && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              </div>
            )}
            <h2 className={isSubmitting ? "opacity-0" : ""}>{t("contracts.contract.save")}</h2>
          </LoadingButton>
          <Button
            type='button'
            variant='outline'
            onClick={() => router.push("/dashboard/manager/contracts")}
          >
            {t("contracts.contract.back")}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
