"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/DatePicker";
import { DialogFooter } from "@/components/ui/dialog";
import { ContractStatus } from "@/lib/constants/contractStatus";
import {
  ContractCreateDto,
  ContractUpdateDto,
  createContract,
  updateContract,
} from "@/lib/api/contracts";
import {
  getAllBusinessBuyers,
  BusinessBuyerDto,
} from "@/lib/api/businessBuyers";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getCoffeeTypes, CoffeeType } from "@/lib/api/coffeeType";
import {
  ContractItemCreateDto,
  ContractItemUpdateDto,
} from "@/lib/api/contractItems";
import { getErrorMessage } from "@/lib/utils";

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
  const [formData, setFormData] = useState<
    ContractCreateDto | ContractUpdateDto | null
  >(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [businessErrors, setBusinessErrors] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const router = useRouter();

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "NotStarted":
        return {
          label: "Chưa bắt đầu",
          className: "bg-gray-100 text-gray-600",
        };
      case "PreparingDelivery":
        return {
          label: "Chuẩn bị giao",
          className: "bg-purple-100 text-purple-700",
        };
      case "InProgress":
        return {
          label: "Đang thực hiện",
          className: "bg-green-100 text-green-700",
        };
      case "PartialCompleted":
        return {
          label: "Hoàn thành một phần",
          className: "bg-yellow-100 text-yellow-700",
        };
      case "Completed":
        return { label: "Hoàn thành", className: "bg-blue-100 text-blue-700" };
      case "Cancelled":
        return { label: "Đã huỷ", className: "bg-red-100 text-red-700" };
      case "Expired":
        return { label: "Quá hạn", className: "bg-orange-100 text-orange-700" };
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

      // Log để debug
      console.log("InitialData gốc:", initialData);
      console.log("InitialData đã format:", formattedData);
      console.log("signedAt gốc:", initialData.signedAt);
      console.log("signedAt đã format:", formattedData.signedAt);
    } else {
      setFormData({
        contractNumber: "",
        contractTitle: "",
        contractFileUrl: "",
        buyerId: "" as any,
        deliveryRounds: 1,
        totalQuantity: 0,
        totalValue: 0,
        startDate: undefined,
        endDate: undefined,
        signedAt: undefined,
        status: ContractStatus.NotStarted,
        cancelReason: "",
        contractItems: [],
      });
      // Reset file preview khi tạo mới
      setFilePreviewUrl(null);
      setSelectedFile(null);
    }
  }, [initialData]);

  // Clear errors when form data changes
  useEffect(() => {
    setFieldErrors({});
    setBusinessErrors([]);
  }, [formData]);

  // Cleanup file preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  // Guard for null formData
  if (!formData) {
    return (
      <div className="text-gray-500 text-center py-10">
        Đang khởi tạo biểu mẫu hợp đồng...
      </div>
    );
  }

  // Type assertion để TypeScript biết formData không null từ đây
  const data = formData;

  function handleChange(field: string, value: any) {
    setFormData((prev) => {
      const newData = {
        ...prev!,
        [field]: value,
      };

      // Tự động cập nhật trạng thái dựa trên ngày bắt đầu hoặc ngày kết thúc
      if ((field === "startDate" || field === "endDate") && value) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset giờ về 00:00:00 để so sánh ngày

        const startDate = new Date(newData.startDate || value);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(newData.endDate || value);
        endDate.setHours(0, 0, 0, 0);

        // Chỉ tự động cập nhật nếu trạng thái hiện tại không phải là "Hoàn thành" hoặc "Đã hủy"
        if (
          newData.status !== ContractStatus.Completed &&
          newData.status !== ContractStatus.Cancelled
        ) {
          // Kiểm tra ngày kết thúc trước
          if (newData.endDate) {
            const endDateNormalized = new Date(newData.endDate);
            endDateNormalized.setHours(0, 0, 0, 0);

            if (endDateNormalized < today) {
              // Nếu ngày kết thúc trong quá khứ, chuyển thành "Quá hạn"
              newData.status = ContractStatus.Expired;
              if (field === "endDate") {
                toast.info(
                  "Ngày kết thúc trong quá khứ, trạng thái đã tự động cập nhật thành 'Quá hạn'"
                );
              } else {
                toast.info(
                  "Trạng thái đã tự động cập nhật thành 'Quá hạn' (ngày kết thúc trong quá khứ)"
                );
              }
            } else if (startDate <= today) {
              // Nếu ngày bắt đầu là hôm nay hoặc quá khứ, chuyển thành "Đang thực hiện"
              newData.status = ContractStatus.InProgress;
              toast.info(
                "Trạng thái đã tự động cập nhật thành 'Đang thực hiện'"
              );
            } else {
              // Nếu ngày bắt đầu trong tương lai, chuyển thành "Chưa bắt đầu"
              newData.status = ContractStatus.NotStarted;
              toast.info("Trạng thái đã tự động cập nhật thành 'Chưa bắt đầu'");
            }
          } else {
            // Không có ngày kết thúc, chỉ kiểm tra ngày bắt đầu
            if (startDate <= today) {
              // Nếu ngày bắt đầu là hôm nay hoặc quá khứ, chuyển thành "Đang thực hiện"
              newData.status = ContractStatus.InProgress;
              toast.info(
                "Trạng thái đã tự động cập nhật thành 'Đang thực hiện'"
              );
            } else {
              // Nếu ngày bắt đầu trong tương lai, chuyển thành "Chưa bắt đầu"
              newData.status = ContractStatus.NotStarted;
              toast.info("Trạng thái đã tự động cập nhật thành 'Chưa bắt đầu'");
            }
          }
        }
      }

      return newData;
    });

    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }

  // Client-side validation for numeric fields
  const validateNumericField = (field: string, value: any): string | null => {
    if (
      field === "deliveryRounds" &&
      (value <= 0 || !Number.isInteger(value))
    ) {
      return "Số đợt giao hàng phải là số nguyên dương";
    }
    if (field === "totalQuantity" && value < 0) {
      return "Tổng khối lượng không được âm";
    }
    if (field === "totalValue" && value < 0) {
      return "Tổng giá trị không được âm";
    }
    return null;
  };

  const handleNumericChange = (field: string, value: any) => {
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

  function updateContractItem(index: number, field: string, value: any) {
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
    if (field === "quantity" && value <= 0) {
      setFieldErrors((prev) => ({
        ...prev,
        [`contractItems.${index}.quantity`]: "Số lượng phải lớn hơn 0",
      }));
    } else if (field === "unitPrice" && value <= 0) {
      setFieldErrors((prev) => ({
        ...prev,
        [`contractItems.${index}.unitPrice`]: "Đơn giá phải lớn hơn 0",
      }));
    } else if (field === "discountAmount" && value < 0) {
      setFieldErrors((prev) => ({
        ...prev,
        [`contractItems.${index}.discountAmount`]: "Chiết khấu không được âm",
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

    // Clear previous errors
    setFieldErrors({});
    setBusinessErrors([]);

    // Basic client-side validation
    const clientErrors: Record<string, string> = {};

    if (!data.contractNumber?.trim()) {
      clientErrors.contractNumber = "Số hợp đồng là bắt buộc";
    }

    if (!data.contractTitle?.trim()) {
      clientErrors.contractTitle = "Tiêu đề hợp đồng là bắt buộc";
    }

    if (!data.buyerId) {
      clientErrors.buyerId = "Vui lòng chọn đối tác";
    }

    if (!data.startDate) {
      clientErrors.startDate = "Ngày bắt đầu là bắt buộc";
    }

    if (!data.endDate) {
      clientErrors.endDate = "Ngày kết thúc là bắt buộc";
    }

    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      clientErrors.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
    }

    if (data.signedAt && data.startDate && data.signedAt > data.startDate) {
      clientErrors.signedAt = "Ngày ký hợp đồng không được sau ngày bắt đầu";
    }

    // Validate file upload (nếu có)
    if (selectedFile) {
      const maxSize = 30 * 1024 * 1024; // 30MB
      if (selectedFile.size > maxSize) {
        clientErrors.contractFile = "File không được lớn hơn 30MB";
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
        clientErrors.contractFile =
          "Chỉ hỗ trợ file ảnh (JPG, PNG, GIF, WebP), PDF, Word (DOC, DOCX)";
      }
    }

    // Validate tổng khối lượng và giá trị không được âm (phù hợp với backend)
    if (data.totalQuantity !== undefined && data.totalQuantity < 0) {
      clientErrors.totalQuantity = "Tổng khối lượng không được âm";
    }

    if (data.totalValue !== undefined && data.totalValue < 0) {
      clientErrors.totalValue = "Tổng giá trị không được âm";
    }

    // Validate lý do hủy khi trạng thái = "Đã hủy"
    if (
      data.status === ContractStatus.Cancelled &&
      !data.cancelReason?.trim()
    ) {
      clientErrors.cancelReason =
        "Lý do hủy là bắt buộc khi trạng thái là 'Đã hủy'";
    }

    // Validate contract items
    if (!data.contractItems || data.contractItems.length === 0) {
      clientErrors.contractItems =
        "Vui lòng thêm ít nhất 1 mặt hàng vào hợp đồng";
    } else {
      data.contractItems.forEach((item, index) => {
        if (!item.coffeeTypeId) {
          clientErrors[`contractItems.${index}.coffeeTypeId`] =
            "Vui lòng chọn loại cà phê";
        }
        if (!item.quantity || item.quantity <= 0) {
          clientErrors[`contractItems.${index}.quantity`] =
            "Số lượng phải lớn hơn 0";
        }
        if (!item.unitPrice || item.unitPrice <= 0) {
          clientErrors[`contractItems.${index}.unitPrice`] =
            "Đơn giá phải lớn hơn 0";
        }
        if (item.discountAmount && item.discountAmount < 0) {
          clientErrors[`contractItems.${index}.discountAmount`] =
            "Chiết khấu không được âm";
        }
      });
    }

    // If there are client-side errors, display them and stop
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      toast.error("Vui lòng kiểm tra và sửa các lỗi trong biểu mẫu");
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
              "Hợp đồng đã quá hạn, trạng thái sẽ được cập nhật thành 'Quá hạn'"
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
          (updateData as any).contractFile = selectedFile;
        }

        await updateContract(dto.contractId, updateData);

        toast.success("Cập nhật hợp đồng thành công!");
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
              "Hợp đồng đã quá hạn, trạng thái sẽ được cập nhật thành 'Quá hạn'"
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
          contractItems: normalizedItems,
        });

        toast.success("Tạo hợp đồng thành công!");
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
            toast.error("Lỗi ngày tháng: Ngày ký hợp đồng phải ≤ Ngày bắt đầu");
          } else {
            toast.error("Vui lòng kiểm tra và sửa các lỗi trong biểu mẫu");
          }
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

  // Helper function to get display name for a field
  const getFieldDisplayName = (fieldName: string): string => {
    if (fieldName.startsWith("contractItems.")) {
      const match = fieldName.match(/contractItems\.(\d+)\.(.*)/);
      if (match) {
        const index = parseInt(match[1]) + 1;
        const itemField = match[2];
        const fieldMap: Record<string, string> = {
          coffeetypeid: "Loại cà phê",
          quantity: "Số lượng",
          unitprice: "Đơn giá",
          discountamount: "Chiết khấu",
          note: "Ghi chú",
        };
        return `Mặt hàng ${index} - ${fieldMap[itemField] || itemField}`;
      }
    }

    // Map cho các field chính
    const fieldMap: Record<string, string> = {
      buyerid: "Đối tác",
      contractnumber: "Số hợp đồng",
      contracttitle: "Tiêu đề hợp đồng",
      contractfileurl: "File hợp đồng",
      deliveryrounds: "Số đợt giao hàng",
      totalquantity: "Tổng khối lượng",
      totalvalue: "Tổng giá trị",
      startdate: "Ngày bắt đầu",
      enddate: "Ngày kết thúc",
      signedat: "Ngày ký",
      status: "Trạng thái",
      cancelreason: "Lý do hủy",
      contractitems: "Danh sách mặt hàng",
    };

    return (
      fieldMap[fieldName.toLowerCase()] ||
      fieldName.replace(/([A-Z])/g, " $1").trim()
    );
  };

  return (
    <>
      {/* Modal xem ảnh zoom */}
      {showImageModal && modalImageUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 overflow-auto"
          onClick={() => setShowImageModal(false)}
        >
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              {/* Nút đóng */}
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 z-10"
              >
                ✕
              </button>

              {/* Ảnh zoom */}
              <img
                src={modalImageUrl}
                alt="Preview zoom"
                className="max-w-none rounded-lg shadow-2xl"
                style={{ maxHeight: "90vh" }}
              />
            </div>
          </div>
        </div>
      )}

      <form className="max-w-4xl mx-auto bg-white border rounded-2xl shadow p-8 space-y-6">
        <h2 className="text-2xl font-semibold text-center mb-6">
          {isEdit ? "Chỉnh sửa hợp đồng" : "Tạo hợp đồng mới"}
        </h2>

        {/* Hiển thị lỗi nghiệp vụ */}
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

            {/* Tóm tắt nhanh */}
            <div className="mb-3 p-2 bg-orange-100 rounded text-orange-800 text-sm">
              <strong>📋 Tóm tắt:</strong>
              {businessErrors.some((err) => err.includes("vượt quá")) &&
                " Cần điều chỉnh tổng khối lượng/giá trị hợp đồng"}
              {businessErrors.some((err) => err.includes("cùng loại")) &&
                " Cần loại bỏ mặt hàng trùng loại"}
              {businessErrors.some((err) => err.includes("đã tồn tại")) &&
                " Cần đổi số hợp đồng"}
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
                    <li>
                      • Kiểm tra lại tổng khối lượng và giá trị của các mặt hàng
                    </li>
                    <li>
                      • Đảm bảo tổng từ các mặt hàng không vượt quá tổng đã khai
                      báo
                    </li>
                    <li>• Hoặc tăng tổng khối lượng/giá trị hợp đồng lên</li>
                    {(() => {
                      const { totalQuantity, totalValue } = calculateTotals();
                      return (
                        <>
                          <li>
                            • Tổng từ mặt hàng: {totalQuantity.toFixed(1)} kg,{" "}
                            {totalValue.toLocaleString()} VND
                          </li>
                          <li>
                            • Tổng hợp đồng hiện tại: {data.totalQuantity || 0}{" "}
                            kg, {data.totalValue || 0} VND
                          </li>
                          <li className="mt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const { totalQuantity, totalValue } =
                                  calculateTotals();
                                handleChange("totalQuantity", totalQuantity);
                                handleChange("totalValue", totalValue);
                                toast.success("Đã cập nhật tổng từ mặt hàng");
                              }}
                              className="text-xs h-6 px-2"
                            >
                              Tự động cập nhật tổng
                            </Button>
                          </li>
                        </>
                      );
                    })()}
                  </>
                )}
                {businessErrors.some((err) => err.includes("cùng loại")) && (
                  <li>• Không được có 2 dòng hợp đồng cùng loại cà phê</li>
                )}
                {businessErrors.some((err) => err.includes("đã tồn tại")) && (
                  <li>• Số hợp đồng đã tồn tại, hãy đổi số khác</li>
                )}
                {businessErrors.some((err) =>
                  err.includes("không có quyền")
                ) && <li>• Liên hệ admin để được cấp quyền phù hợp</li>}
                {businessErrors.some((err) =>
                  err.includes("không được âm")
                ) && <li>• Kiểm tra các giá trị số không được âm</li>}
                {businessErrors.some(
                  (err) =>
                    err.includes("phải lớn hơn") || err.includes("phải nhỏ hơn")
                ) && <li>• Kiểm tra các điều kiện về giá trị min/max</li>}
              </ul>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium">
              Số hợp đồng
            </label>
            <Input
              placeholder="VD: CT001"
              value={data.contractNumber}
              onChange={(e) => handleChange("contractNumber", e.target.value)}
              required
              className={
                hasFieldError("contractNumber") ? "border-red-500" : ""
              }
            />
            {hasFieldError("contractNumber") && (
              <p className="text-red-500 text-xs mt-1">
                {getFieldError("contractNumber")}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Tiêu đề</label>
            <Input
              placeholder="Tiêu đề hợp đồng"
              value={data.contractTitle}
              onChange={(e) => handleChange("contractTitle", e.target.value)}
              required
              className={hasFieldError("contractTitle") ? "border-red-500" : ""}
            />
            {hasFieldError("contractTitle") && (
              <p className="text-red-500 text-xs mt-1">
                {getFieldError("contractTitle")}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">
            File hợp đồng
          </label>
          <div className="flex items-center gap-3">
            <Input
              placeholder="URL file hoặc chọn file từ máy"
              value={data.contractFileUrl || ""}
              onChange={(e) => handleChange("contractFileUrl", e.target.value)}
              className={
                hasFieldError("contractFileUrl") ? "border-red-500" : ""
              }
            />
            <Button
              type="button"
              variant="outline"
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
                    toast.success(`Đã chọn file mới: ${file.name}`);
                  }
                };
                input.click();
              }}
              className="whitespace-nowrap"
            >
              📁 Chọn file
            </Button>
            {data.contractFileUrl && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  // Nếu là URL, mở trong tab mới
                  if (data.contractFileUrl?.startsWith("http")) {
                    window.open(data.contractFileUrl, "_blank");
                  } else {
                    // Nếu là tên file local, hiển thị thông tin
                    toast.info(
                      `File: ${data.contractFileUrl}\nĐể xem nội dung, hãy upload file lên server hoặc cung cấp URL.`
                    );
                  }
                }}
                className="whitespace-nowrap"
              >
                👁️ Xem file
              </Button>
            )}
          </div>
          {hasFieldError("contractFileUrl") && (
            <p className="text-red-500 text-xs mt-1">
              {getFieldError("contractFileUrl")}
            </p>
          )}
          {hasFieldError("contractFile") && (
            <p className="text-red-500 text-xs mt-1">
              {getFieldError("contractFile")}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            💡 Hỗ trợ: Ảnh (JPG, PNG, GIF, WebP), PDF, Word (DOC, DOCX), Video
            (MP4, AVI, MOV) - Tối đa 30MB
          </p>

          {/* Preview file đã chọn hoặc file hiện tại */}
          {(data.contractFileUrl || selectedFile) && (
            <div className="mt-3 p-3 bg-gray-50 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {selectedFile ? "File mới được chọn:" : "File hiện tại:"}
                </span>
                <span className="text-xs text-gray-500">
                  {selectedFile ? selectedFile.name : data.contractFileUrl}
                </span>
              </div>

              {/* Thông báo trạng thái */}
              {selectedFile && (
                <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-700 text-xs">
                  ℹ️ File mới sẽ thay thế file hiện tại khi cập nhật
                </div>
              )}

              {/* Preview cho ảnh */}
              {(data.contractFileUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
                selectedFile?.type.startsWith("image/")) && (
                  <div className="mt-2">
                    {filePreviewUrl ? (
                      <img
                        src={filePreviewUrl}
                        alt="Preview"
                        className="max-w-full h-32 object-contain border rounded cursor-pointer hover:opacity-80 transition-opacity"
                        onError={() => toast.error("Không thể tải ảnh preview")}
                        onClick={() => {
                          if (filePreviewUrl) {
                            setModalImageUrl(filePreviewUrl);
                            setShowImageModal(true);
                          }
                        }}
                        title="Click để xem ảnh rõ hơn"
                      />
                    ) : data.contractFileUrl?.startsWith("http") ? (
                      <img
                        src={data.contractFileUrl}
                        alt="Preview"
                        className="max-w-full h-32 object-contain border rounded cursor-pointer hover:opacity-80 transition-opacity"
                        onError={() => toast.error("Không thể tải ảnh preview")}
                        onClick={() => {
                          if (data.contractFileUrl) {
                            setModalImageUrl(data.contractFileUrl);
                            setShowImageModal(true);
                          }
                        }}
                        title="Click để xem ảnh rõ hơn"
                      />
                    ) : (
                      <div className="h-32 bg-gray-100 border rounded flex items-center justify-center">
                        <span className="text-gray-500 text-sm">
                          📷{" "}
                          {selectedFile
                            ? selectedFile.name
                            : data.contractFileUrl}
                        </span>
                      </div>
                    )}
                  </div>
                )}

              {/* Preview cho PDF */}
              {(data.contractFileUrl?.match(/\.pdf$/i) ||
                selectedFile?.name?.match(/\.pdf$/i)) && (
                  <div className="mt-2">
                    {data.contractFileUrl?.startsWith("http") ? (
                      <div className="h-32 bg-red-50 border border-red-200 rounded flex items-center justify-center">
                        <a
                          href={data.contractFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          📄 Xem PDF: {data.contractFileUrl.split("/").pop()}
                        </a>
                      </div>
                    ) : (
                      <div className="h-32 bg-gray-100 border rounded flex items-center justify-center">
                        <span className="text-gray-500 text-sm">
                          📄{" "}
                          {selectedFile
                            ? selectedFile.name
                            : data.contractFileUrl}
                        </span>
                      </div>
                    )}
                  </div>
                )}

              {/* Preview cho Word */}
              {(data.contractFileUrl?.match(/\.(doc|docx)$/i) ||
                selectedFile?.name?.match(/\.(doc|docx)$/i)) && (
                  <div className="mt-2">
                    <div className="h-32 bg-blue-50 border border-blue-200 rounded flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-medium">
                        📝{" "}
                        {selectedFile ? selectedFile.name : data.contractFileUrl}
                      </span>
                    </div>
                  </div>
                )}

              {/* Remove file buttons */}
              <div className="mt-3 flex gap-2">
                {selectedFile && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreviewUrl(null);
                      handleChange("contractFileUrl", "");
                      toast.info("Đã xóa file mới được chọn");
                    }}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    🗑️ Xóa file mới
                  </Button>
                )}

                {data.contractFileUrl && !selectedFile && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleChange("contractFileUrl", "");
                      setFilePreviewUrl(null);
                      toast.info("Đã xóa file hiện tại");
                    }}
                    className="text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    🗑️ Xóa file hiện tại
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">Đối tác</label>
          <select
            value={data.buyerId}
            onChange={(e) => handleChange("buyerId", e.target.value)}
            className={`w-full p-2 border rounded ${hasFieldError("buyerId") ? "border-red-500" : ""
              }`}
            required
          >
            <option value="">-- Chọn đối tác --</option>
            {buyers.map((buyer) => (
              <option key={buyer.buyerId} value={buyer.buyerId}>
                {buyer.companyName}
              </option>
            ))}
          </select>
          {hasFieldError("buyerId") && (
            <p className="text-red-500 text-xs mt-1">
              {getFieldError("buyerId")}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Số đợt</label>
            <Input
              type="number"
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
              <p className="text-red-500 text-xs mt-1">
                {getFieldError("deliveryRounds")}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">
              Tổng KL (kg)
            </label>
            <Input
              type="number"
              step={0.1}
              min={0}
              value={data.totalQuantity || ""}
              onChange={(e) =>
                handleNumericChange("totalQuantity", Number(e.target.value))
              }
              className={hasFieldError("totalQuantity") ? "border-red-500" : ""}
            />
            {hasFieldError("totalQuantity") && (
              <p className="text-red-500 text-xs mt-1">
                {getFieldError("totalQuantity")}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">
              Tổng GT (VND)
            </label>
            <Input
              type="number"
              min={0}
              value={data.totalValue || ""}
              onChange={(e) =>
                handleNumericChange("totalValue", Number(e.target.value))
              }
              className={hasFieldError("totalValue") ? "border-red-500" : ""}
            />
            {hasFieldError("totalValue") && (
              <p className="text-red-500 text-xs mt-1">
                {getFieldError("totalValue")}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DatePicker
            label="Ngày bắt đầu"
            value={data.startDate as any}
            onChange={(date) => handleChange("startDate", date)}
            required
            error={hasFieldError("startDate")}
            errorMessage={getFieldError("startDate")}
          />
          <DatePicker
            label="Ngày kết thúc"
            value={data.endDate as any}
            onChange={(date) => handleChange("endDate", date)}
            required
            error={hasFieldError("endDate")}
            errorMessage={getFieldError("endDate")}
          />
          <DatePicker
            label="Ngày ký"
            value={data.signedAt as any}
            onChange={(date) => {
              handleChange("signedAt", date);
            }}
            error={hasFieldError("signedAt")}
            errorMessage={getFieldError("signedAt")}
          />
        </div>

        {/* Chỉ hiển thị trạng thái khi edit */}
        {isEdit && (
          <div>
            <label className="block mb-1 text-sm font-medium">Trạng thái</label>
            <select
              className={`w-full p-2 border rounded ${hasFieldError("status") ? "border-red-500" : ""
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
              <p className="text-red-500 text-xs mt-1">
                {getFieldError("status")}
              </p>
            )}
          </div>
        )}

        {/* Hiển thị trạng thái hiện tại khi create */}
        {!isEdit && (
          <div>
            <label className="block mb-1 text-sm font-medium">Trạng thái</label>
            <div className="p-2 border rounded bg-gray-50">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusDisplay(data.status).className
                  }`}
              >
                {getStatusDisplay(data.status).label}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Trạng thái sẽ tự động cập nhật: "Chưa bắt đầu" nếu ngày bắt đầu
              trong tương lai, "Đang thực hiện" nếu ngày bắt đầu là hôm nay hoặc
              quá khứ
            </p>
          </div>
        )}

        {/* Chỉ hiển thị lý do hủy khi edit và trạng thái = "Đã hủy" */}
        {isEdit && data.status === ContractStatus.Cancelled && (
          <div>
            <label className="block mb-1 text-sm font-medium">
              Lý do huỷ <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Vui lòng ghi lý do hủy hợp đồng..."
              value={data.cancelReason}
              onChange={(e) => handleChange("cancelReason", e.target.value)}
              className={hasFieldError("cancelReason") ? "border-red-500" : ""}
              required
            />
            {hasFieldError("cancelReason") && (
              <p className="text-red-500 text-xs mt-1">
                {getFieldError("cancelReason")}
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block mb-1 text-sm font-medium">
            Danh sách mặt hàng
          </label>

          {/* Hiển thị lỗi tổng quát cho contract items */}
          {hasFieldError("contractItems") && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm font-medium">
                {getFieldError("contractItems")}
              </p>
            </div>
          )}

          {data.contractItems.length > 0 && (
            <>
              {/* Header */}
              <div className="hidden md:grid md:grid-cols-6 gap-2 mb-1 text-xs font-medium text-muted-foreground">
                <span>Loại cà phê</span>
                <span>Số lượng (kg)</span>
                <span>Đơn giá (VND/Kg)</span>
                <span>Chiết khấu (%)</span>
                <span>Ghi chú</span>
                <span></span>
              </div>

              {/* Body */}
              {data.contractItems.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-2"
                >
                  {/* Loại cà phê */}
                  <select
                    value={item.coffeeTypeId}
                    onChange={(e) =>
                      updateContractItem(index, "coffeeTypeId", e.target.value)
                    }
                    className={`p-2 border rounded ${hasFieldError(`contractItems.${index}.coffeeTypeId`)
                        ? "border-red-500"
                        : ""
                      }`}
                  >
                    <option value="">-- Chọn loại cà phê --</option>
                    {coffeeTypes.map((type) => (
                      <option key={type.coffeeTypeId} value={type.coffeeTypeId}>
                        {type.typeName}
                      </option>
                    ))}
                  </select>
                  {hasFieldError(`contractItems.${index}.coffeeTypeId`) && (
                    <p className="text-red-500 text-xs mt-1">
                      {getFieldError(`contractItems.${index}.coffeeTypeId`)}
                    </p>
                  )}

                  {/* Số lượng */}
                  <Input
                    type="number"
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
                    <p className="text-red-500 text-xs mt-1">
                      {getFieldError(`contractItems.${index}.quantity`)}
                    </p>
                  )}

                  {/* Đơn giá */}
                  <Input
                    type="number"
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
                    <p className="text-red-500 text-xs mt-1">
                      {getFieldError(`contractItems.${index}.unitPrice`)}
                    </p>
                  )}

                  {/* Chiết khấu */}
                  <Input
                    type="number"
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
                    <p className="text-red-500 text-xs mt-1">
                      {getFieldError(`contractItems.${index}.discountAmount`)}
                    </p>
                  )}

                  {/* Ghi chú */}
                  <Input
                    placeholder="Ghi chú"
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
                    <p className="text-red-500 text-xs mt-1">
                      {getFieldError(`contractItems.${index}.note`)}
                    </p>
                  )}

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => removeContractItem(index)}
                  >
                    Xoá
                  </Button>
                </div>
              ))}
            </>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={addContractItem}
            className="mt-2"
          >
            + Thêm mặt hàng
          </Button>
        </div>

        <DialogFooter className="flex justify-between pt-4">
          <Button type="submit" onClick={handleSubmit}>
            <h2>Lưu hợp đồng</h2>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/manager/contracts")}
          >
            Quay lại
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
