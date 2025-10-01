"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import {
  getPaymentConfigurations,
  getPaymentConfigurationById,
  createPaymentConfiguration,
  updatePaymentConfiguration,
  deletePaymentConfiguration,
  softDeletePaymentConfiguration,
  PaymentConfigurationViewAllDto,
  PaymentConfigurationViewDetailsDto,
  PaymentConfigurationCreateDto,
  PaymentConfigurationUpdateDto,
} from "@/lib/api/systemConfiguration";
import { AppToast } from "@/components/ui/AppToast";
import { useTranslation } from "react-i18next";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiRefreshCw,
  FiDollarSign,
  FiCalendar,
  FiUsers,
  FiToggleLeft,
  FiToggleRight,
} from "react-icons/fi";

export default function PaymentConfigurationsPage() {
  useAuthGuard(["admin"]);
  const { t } = useTranslation();

  const [configurations, setConfigurations] = useState<
    PaymentConfigurationViewAllDto[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [editingConfiguration, setEditingConfiguration] =
    useState<PaymentConfigurationViewDetailsDto | null>(null);
  const [viewingConfiguration, setViewingConfiguration] =
    useState<PaymentConfigurationViewDetailsDto | null>(null);

  // Filters and pagination states
  const [searchConfigName, setSearchConfigName] = useState<string>("");
  const [searchTonsMin, setSearchTonsMin] = useState<string>("");
  const [searchTonsMax, setSearchTonsMax] = useState<string>("");
  const [filterRoleId, setFilterRoleId] = useState<string>("all");
  const [filterFeeType, setFilterFeeType] = useState<string>("all");
  const [amountMin, setAmountMin] = useState<string>("");
  const [amountMax, setAmountMax] = useState<string>("");
  const [effectiveFromFilter, setEffectiveFromFilter] = useState<string>("");
  const [effectiveToFilter, setEffectiveToFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all"); // all | active | inactive
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 6;

  // Form states
  const [formData, setFormData] = useState<PaymentConfigurationCreateDto>({
    roleId: 0,
    feeType: "",
    amount: 0,
    description: "",
    effectiveFrom: new Date().toISOString().split("T")[0],
    effectiveTo: null,
    isActive: true,
  });

  // Role options - có thể lấy từ API hoặc hardcode
  const roleOptions = [
    { id: 1, name: "Nông dân" },
    { id: 2, name: "Quản lý doanh nghiệp" },
    { id: 3, name: "Chuyên gia" },
    { id: 4, name: "Nhân viên" },
    { id: 5, name: "Quản trị viên" },
  ];

  // Fee type options - mapping với enum FeeType từ backend
  const feeTypeOptions = [
    { value: "Registration", label: "Phí đăng ký" },
    { value: "MonthlyMaintenance", label: "Phí duy trì tháng" },
    { value: "QuarterlyMaintenance", label: "Phí duy trì quý" },
    { value: "YearlyMaintenance", label: "Phí duy trì năm" },
    { value: "PlanPosting", label: "Phí đăng kế hoạch thu mua" },
    { value: "PurchasePlanPosting", label: "Phí đăng kế hoạch thu mua" },
    { value: "Other", label: "Phí khác" },
  ];

  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPaymentConfigurations();
      setConfigurations(data);
    } catch (err: any) {
      console.error("❌ Lỗi fetchConfigurations:", err);
      setError(err.message || "Lỗi khi tải danh sách cấu hình phí");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigurations();
  }, []);

  // Helpers placed before memoized computations to avoid TDZ issues
  const getRoleName = (roleName: string) => {
    if (!roleName) return "Không xác định";
    // If already Vietnamese, return as is
    const vnLikely = [
      "Nông dân",
      "Quản lý doanh nghiệp",
      "Chuyên gia",
      "Nhân viên",
      "Quản trị viên",
    ];
    if (vnLikely.includes(roleName)) return roleName;

    // Normalize
    const key = roleName.trim().toLowerCase();
    const map: Record<string, string> = {
      farmer: "Nông dân",
      growers: "Nông dân",
      grower: "Nông dân",
      businessmanager: "Quản lý doanh nghiệp",
      manager: "Quản lý doanh nghiệp",
      enterprise_manager: "Quản lý doanh nghiệp",
      expert: "Chuyên gia",
      specialist: "Chuyên gia",
      staff: "Nhân viên",
      employee: "Nhân viên",
      admin: "Quản trị viên",
      administrator: "Quản trị viên",
      system_admin: "Quản trị viên",
    };
    return map[key] || roleName;
  };

  const getFeeTypeLabel = (feeType: string) => {
    const fee = feeTypeOptions.find((f) => f.value === feeType);
    return fee ? fee.label : feeType;
  };

  // Derived filtered list
  const filteredConfigurations = useMemo(() => {
    const minVal = amountMin ? Number(amountMin.replace(/[^\d]/g, "")) : null;
    const maxVal = amountMax ? Number(amountMax.replace(/[^\d]/g, "")) : null;

    const parseDate = (d?: string | null) => (d ? new Date(d) : null);
    const toDateOnly = (d: Date | null) =>
      d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : null;
    const filterFromDate = parseDate(effectiveFromFilter);
    const filterToDate = parseDate(effectiveToFilter);
    const filterFromOnly = toDateOnly(filterFromDate);
    const filterToOnly = toDateOnly(filterToDate);

    const selectedRoleNameVn =
      roleOptions.find((r) => r.id.toString() === filterRoleId)?.name || null;
    const selectedRoleNameVnLower = selectedRoleNameVn
      ? selectedRoleNameVn.toLowerCase()
      : null;

    return configurations.filter((cfg) => {
      const feeLabel = getFeeTypeLabel(cfg.feeType).toLowerCase();
      const roleLabelVn = getRoleName(cfg.roleName || "").toLowerCase();

      // Config name search
      const matchesConfigName =
        !searchConfigName ||
        (cfg.configName &&
          cfg.configName
            .toLowerCase()
            .includes(searchConfigName.toLowerCase()));

      // Tons range search
      const searchTonsMinVal = searchTonsMin ? Number(searchTonsMin) : null;
      const searchTonsMaxVal = searchTonsMax ? Number(searchTonsMax) : null;

      let matchesTonsRange = true;

      if (searchTonsMinVal !== null || searchTonsMaxVal !== null) {
        matchesTonsRange = false;

        // Nếu config có cả minTons và maxTons
        if (cfg.minTons != null && cfg.maxTons != null) {
          // Khoảng config: [cfg.minTons, cfg.maxTons]
          // Khoảng search: [searchTonsMinVal, searchTonsMaxVal]
          const configMin = cfg.minTons;
          const configMax = cfg.maxTons;
          const searchMin = searchTonsMinVal || 0;
          const searchMax = searchTonsMaxVal || Number.MAX_SAFE_INTEGER;

          // Có overlap nếu: configMin <= searchMax && configMax >= searchMin
          matchesTonsRange = configMin <= searchMax && configMax >= searchMin;
        }
        // Nếu config chỉ có minTons (không giới hạn trên)
        else if (cfg.minTons != null && cfg.maxTons == null) {
          const configMin = cfg.minTons;
          const searchMax = searchTonsMaxVal || Number.MAX_SAFE_INTEGER;
          matchesTonsRange =
            configMin <= searchMax &&
            (searchTonsMinVal == null || configMin >= searchTonsMinVal);
        }
        // Nếu config chỉ có maxTons (không giới hạn dưới)
        else if (cfg.minTons == null && cfg.maxTons != null) {
          const configMax = cfg.maxTons;
          const searchMin = searchTonsMinVal || 0;
          matchesTonsRange =
            configMax >= searchMin &&
            (searchTonsMaxVal == null || configMax <= searchTonsMaxVal);
        }
        // Nếu config không có giới hạn tấn nào
        else {
          matchesTonsRange = false; // Không giới hạn tấn thì không match với search tấn
        }
      }

      // Role filter
      const matchesRole =
        filterRoleId === "all" ||
        String((cfg as any).roleId ?? "") === filterRoleId ||
        (selectedRoleNameVnLower !== null &&
          roleLabelVn === selectedRoleNameVnLower);

      // Fee type filter
      const matchesFeeType =
        filterFeeType === "all" || cfg.feeType === filterFeeType;

      // Amount filter
      const matchesAmount =
        (minVal === null || cfg.amount >= minVal) &&
        (maxVal === null || cfg.amount <= maxVal);

      // Effective date filter (range applied to effectiveFrom only)
      const cfgFromOnly = toDateOnly(new Date(cfg.effectiveFrom));
      let matchesEffective = true;
      if (filterFromOnly) {
        matchesEffective =
          matchesEffective && !!cfgFromOnly && cfgFromOnly >= filterFromOnly;
      }
      if (filterToOnly) {
        matchesEffective =
          matchesEffective && !!cfgFromOnly && cfgFromOnly <= filterToOnly;
      }

      // Status filter
      const isActive = !!cfg.isActive;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isActive) ||
        (statusFilter === "inactive" && !isActive);

      return (
        matchesConfigName &&
        matchesTonsRange &&
        matchesRole &&
        matchesFeeType &&
        matchesAmount &&
        matchesEffective &&
        matchesStatus
      );
    });
  }, [
    configurations,
    searchConfigName,
    searchTonsMin,
    searchTonsMax,
    filterRoleId,
    filterFeeType,
    amountMin,
    amountMax,
    effectiveFromFilter,
    effectiveToFilter,
    statusFilter,
  ]);

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchConfigName,
    searchTonsMin,
    searchTonsMax,
    filterRoleId,
    filterFeeType,
    amountMin,
    amountMax,
    effectiveFromFilter,
    effectiveToFilter,
    statusFilter,
  ]);

  const totalItems = filteredConfigurations.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPageClamped = Math.min(currentPage, totalPages);
  const startIndex = (currentPageClamped - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedConfigurations = filteredConfigurations.slice(
    startIndex,
    endIndex
  );

  const clearFilters = () => {
    setSearchConfigName("");
    setSearchTonsMin("");
    setSearchTonsMax("");
    setFilterRoleId("all");
    setFilterFeeType("all");
    setAmountMin("");
    setAmountMax("");
    setEffectiveFromFilter("");
    setEffectiveToFilter("");
    setStatusFilter("all");
  };

  const handleCreate = async () => {
    try {
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

      const createData = {
        ...formData,
        isActive: isActive,
      };

      await createPaymentConfiguration(createData);
      AppToast.success("Tạo cấu hình phí thành công");
      setShowCreateDialog(false);
      setFormData({
        roleId: 0,
        feeType: "",
        amount: 0,
        description: "",
        effectiveFrom: new Date().toISOString().split("T")[0],
        effectiveTo: null,
        isActive: true,
      });
      fetchConfigurations();
    } catch (err: any) {
      console.error("❌ Lỗi handleCreate:", err);
      AppToast.error(err.message || "Lỗi khi tạo cấu hình phí");
    }
  };

  const handleEdit = async () => {
    if (!editingConfiguration) return;

    try {
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

      const updateData: PaymentConfigurationUpdateDto = {
        configId: editingConfiguration.configId,
        roleId: formData.roleId,
        feeType: formData.feeType,
        amount: formData.amount,
        description: formData.description,
        effectiveFrom: formData.effectiveFrom,
        effectiveTo: formData.effectiveTo,
        isActive: isActive,
      };

      await updatePaymentConfiguration(
        editingConfiguration.configId,
        updateData
      );
      AppToast.success("Cập nhật cấu hình phí thành công");
      setShowEditDialog(false);
      setEditingConfiguration(null);
      fetchConfigurations();
    } catch (err: any) {
      console.error("❌ Lỗi handleEdit:", err);
      AppToast.error(err.message || "Lỗi khi cập nhật cấu hình phí");
    }
  };

  const handleDelete = async (configID: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa cấu hình phí này?")) return;

    try {
      await softDeletePaymentConfiguration(configID);
      AppToast.success("Xóa cấu hình phí thành công");
      fetchConfigurations();
    } catch (err: any) {
      console.error("❌ Lỗi handleDelete:", err);
      AppToast.error(err.message || "Lỗi khi xóa cấu hình phí");
    }
  };

  const handleToggleActive = async (
    config: PaymentConfigurationViewAllDto,
    isActive: boolean
  ) => {
    try {
      // Cần lấy chi tiết config trước để update
      const configDetails = await getPaymentConfigurationById(config.configId);
      if (!configDetails) {
        AppToast.error("Không tìm thấy cấu hình phí");
        return;
      }

      const updateData: PaymentConfigurationUpdateDto = {
        configId: config.configId,
        roleId: configDetails.roleId,
        feeType: configDetails.feeType,
        amount: configDetails.amount,
        description: configDetails.description,
        effectiveFrom: configDetails.effectiveFrom,
        effectiveTo: configDetails.effectiveTo,
        isActive: isActive,
      };

      await updatePaymentConfiguration(config.configId, updateData);
      AppToast.success(
        isActive
          ? "Kích hoạt cấu hình phí thành công"
          : "Vô hiệu hóa cấu hình phí thành công"
      );
      fetchConfigurations();
    } catch (err: any) {
      console.error("❌ Lỗi handleToggleActive:", err);
      AppToast.error(err.message || "Lỗi khi thay đổi trạng thái cấu hình phí");
    }
  };

  const openViewDialog = async (
    configuration: PaymentConfigurationViewAllDto
  ) => {
    try {
      const configDetails = await getPaymentConfigurationById(
        configuration.configId
      );
      if (!configDetails) {
        AppToast.error("Không tìm thấy chi tiết cấu hình phí");
        return;
      }

      setViewingConfiguration(configDetails);
      setShowViewDialog(true);
    } catch (err: any) {
      console.error("❌ Lỗi openViewDialog:", err);
      AppToast.error(err.message || "Lỗi khi tải chi tiết cấu hình phí");
    }
  };

  const openEditDialog = async (
    configuration: PaymentConfigurationViewAllDto
  ) => {
    try {
      const configDetails = await getPaymentConfigurationById(
        configuration.configId
      );
      if (!configDetails) {
        AppToast.error("Không tìm thấy chi tiết cấu hình phí");
        return;
      }

      setEditingConfiguration(configDetails);
      setFormData({
        roleId: configDetails.roleId,
        feeType: configDetails.feeType,
        amount: configDetails.amount,
        description: configDetails.description || "",
        effectiveFrom: configDetails.effectiveFrom.split("T")[0],
        effectiveTo: configDetails.effectiveTo
          ? configDetails.effectiveTo.split("T")[0]
          : null,
        isActive: configDetails.isActive ?? true,
      });
      setShowEditDialog(true);
    } catch (err: any) {
      console.error("❌ Lỗi openEditDialog:", err);
      AppToast.error(err.message || "Lỗi khi tải chi tiết cấu hình phí");
    }
  };

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat("vi-VN", {
      style: "decimal",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(amount);
    return `${formatted} VND`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FiRefreshCw className="animate-spin text-orange-500 text-4xl mx-auto mb-4" />
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FiAlertTriangle className="text-red-500 text-4xl mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchConfigurations} variant="outline">
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Cấu hình phí
              </h1>
              <p className="text-gray-600">
                Quản lý các loại phí và cấu hình thanh toán cho từng vai trò
              </p>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <FiPlus />
                  Tạo cấu hình phí mới
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Tạo cấu hình phí mới</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>
                        Vai trò <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={
                          formData.roleId > 0 ? formData.roleId.toString() : ""
                        }
                        onValueChange={(value) =>
                          setFormData({ ...formData, roleId: Number(value) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn vai trò" />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((role) => (
                            <SelectItem
                              key={role.id}
                              value={role.id.toString()}
                            >
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>
                        Loại phí <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.feeType}
                        onValueChange={(value) =>
                          setFormData({ ...formData, feeType: value })
                        }
                      >
                        <SelectTrigger>
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
                    </div>
                  </div>

                  <div>
                    <Label>
                      Số tiền (VND) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      value={
                        formData.amount
                          ? formData.amount.toLocaleString("vi-VN")
                          : ""
                      }
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d]/g, "");
                        setFormData({
                          ...formData,
                          amount: value ? Number(value) : 0,
                        });
                      }}
                      placeholder="0"
                    />
                    {formData.amount > 0 && (
                      <p className="text-sm text-blue-600 font-medium mt-1">
                        {numberToVietnameseWords(formData.amount)} VND
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Mô tả</Label>
                    <Textarea
                      value={formData.description || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Mô tả chi tiết về loại phí này..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>
                        Hiệu lực từ ngày <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        value={formData.effectiveFrom}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            effectiveFrom: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Hết hiệu lực</Label>
                      <Input
                        type="date"
                        value={formData.effectiveTo || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            effectiveTo: e.target.value || null,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateDialog(false)}
                    >
                      Hủy
                    </Button>
                    <Button onClick={handleCreate}>Tạo cấu hình</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">Bộ lọc và tìm kiếm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label>Tìm kiếm tên cấu hình</Label>
                <Input
                  placeholder="Nhập tên cấu hình..."
                  value={searchConfigName}
                  onChange={(e) => setSearchConfigName(e.target.value)}
                />
              </div>
              <div>
                <Label>Tấn tối thiểu</Label>
                <Input
                  placeholder="Nhập số tấn..."
                  value={searchTonsMin}
                  onChange={(e) =>
                    setSearchTonsMin(e.target.value.replace(/[^\d]/g, ""))
                  }
                />
              </div>
              <div>
                <Label>Tấn tối đa</Label>
                <Input
                  placeholder="Nhập số tấn..."
                  value={searchTonsMax}
                  onChange={(e) =>
                    setSearchTonsMax(e.target.value.replace(/[^\d]/g, ""))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label>Vai trò</Label>
                <Select value={filterRoleId} onValueChange={setFilterRoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Loại phí</Label>
                <Select value={filterFeeType} onValueChange={setFilterFeeType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại phí" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {feeTypeOptions.map((fee) => (
                      <SelectItem key={fee.value} value={fee.value}>
                        {fee.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Số tiền từ</Label>
                <Input
                  placeholder="0"
                  value={amountMin}
                  onChange={(e) =>
                    setAmountMin(e.target.value.replace(/[^\d]/g, ""))
                  }
                />
              </div>
              <div>
                <Label>Đến</Label>
                <Input
                  placeholder="0"
                  value={amountMax}
                  onChange={(e) =>
                    setAmountMax(e.target.value.replace(/[^\d]/g, ""))
                  }
                />
              </div>
              <div>
                <Label>Trạng thái</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="active">Đang hoạt động</SelectItem>
                    <SelectItem value="inactive">Không hoạt động</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <div>
                <Label>Hiệu lực từ</Label>
                <Input
                  type="date"
                  value={effectiveFromFilter}
                  onChange={(e) => setEffectiveFromFilter(e.target.value)}
                />
              </div>
              <div>
                <Label>Đến</Label>
                <Input
                  type="date"
                  value={effectiveToFilter}
                  onChange={(e) => setEffectiveToFilter(e.target.value)}
                />
              </div>
              <div className="md:col-span-2 flex items-end justify-end">
                <Button variant="outline" onClick={clearFilters}>
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurations Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiDollarSign />
              Danh sách cấu hình phí ({paginatedConfigurations.length}/
              {filteredConfigurations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredConfigurations.length === 0 ? (
              <div className="text-center py-8">
                <FiDollarSign className="text-gray-400 text-4xl mx-auto mb-4" />
                <p className="text-gray-500">Chưa có cấu hình phí nào</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên cấu hình</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Loại phí</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Khoảng tấn</TableHead>
                    <TableHead>Hiệu lực</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedConfigurations.map((config) => (
                    <TableRow key={config.configId}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FiDollarSign className="text-blue-500" />
                          {config.configName && config.configName.trim() !== ""
                            ? config.configName
                            : "Không có tên"}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FiUsers className="text-orange-500" />
                          {getRoleName(config.roleName)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getFeeTypeLabel(config.feeType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(config.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {config.minTons != null || config.maxTons != null ? (
                            <div>
                              {config.minTons != null && (
                                <div>Từ: {config.minTons} tấn</div>
                              )}
                              {config.maxTons != null && (
                                <div>Đến: {config.maxTons} tấn</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">
                              Không giới hạn
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <FiCalendar className="text-gray-400" />
                          <div>
                            <div>Từ: {formatDate(config.effectiveFrom)}</div>
                            {config.effectiveTo && (
                              <div>Đến: {formatDate(config.effectiveTo)}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {config.isActive ? (
                            <FiCheckCircle className="text-green-500" />
                          ) : (
                            <FiXCircle className="text-red-500" />
                          )}
                          <span
                            className={
                              config.isActive
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {config.isActive
                              ? "Đang hoạt động"
                              : "Không hoạt động"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openViewDialog(config)}
                            title="Xem chi tiết"
                          >
                            <FiEye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(config)}
                            title="Chỉnh sửa"
                          >
                            <FiEdit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleToggleActive(
                                config,
                                !(config.isActive ?? false)
                              )
                            }
                            title={
                              config.isActive ? "Vô hiệu hóa" : "Kích hoạt"
                            }
                            className={
                              config.isActive
                                ? "text-orange-600 hover:text-orange-700"
                                : "text-green-600 hover:text-green-700"
                            }
                          >
                            {config.isActive ? (
                              <FiToggleRight className="w-4 h-4" />
                            ) : (
                              <FiToggleLeft className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(config.configId)}
                            className="text-red-600 hover:text-red-700"
                            title="Xóa"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {/* Pagination */}
            {filteredConfigurations.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Hiển thị{" "}
                  {Math.min(filteredConfigurations.length, startIndex + 1)}-
                  {Math.min(filteredConfigurations.length, endIndex)} trong{" "}
                  {filteredConfigurations.length}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={currentPageClamped === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Trang trước
                  </Button>
                  <span className="text-sm text-gray-700">
                    {currentPageClamped}/{totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={currentPageClamped === totalPages}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa cấu hình phí</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>
                    Vai trò <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={
                      formData.roleId > 0 ? formData.roleId.toString() : ""
                    }
                    onValueChange={(value) =>
                      setFormData({ ...formData, roleId: Number(value) })
                    }
                  >
                    <SelectTrigger>
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
                </div>
                <div>
                  <Label>
                    Loại phí <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.feeType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, feeType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {feeTypeOptions.map((fee) => (
                        <SelectItem key={fee.value} value={fee.value}>
                          {fee.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>
                  Số tiền (VND) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  value={
                    formData.amount
                      ? formData.amount.toLocaleString("vi-VN")
                      : ""
                  }
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d]/g, "");
                    setFormData({
                      ...formData,
                      amount: value ? Number(value) : 0,
                    });
                  }}
                  placeholder="0"
                />
                {formData.amount > 0 && (
                  <p className="text-sm text-blue-600 font-medium mt-1">
                    {numberToVietnameseWords(formData.amount)} VND
                  </p>
                )}
              </div>

              <div>
                <Label>Mô tả</Label>
                <Textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>
                    Hiệu lực từ ngày <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formData.effectiveFrom}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        effectiveFrom: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Hết hiệu lực</Label>
                  <Input
                    type="date"
                    value={formData.effectiveTo || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        effectiveTo: e.target.value || null,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={formData.isActive ?? true}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                />
                <Label htmlFor="editIsActive">Đang hoạt động</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                >
                  Hủy
                </Button>
                <Button onClick={handleEdit}>Cập nhật</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Chi tiết cấu hình phí</DialogTitle>
            </DialogHeader>
            {viewingConfiguration && (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-lg">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <FiDollarSign className="text-orange-600 text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {getFeeTypeLabel(viewingConfiguration.feeType)}
                    </h3>
                    <p className="text-gray-600">
                      {getRoleName(viewingConfiguration.roleName)}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <Badge
                      variant={
                        viewingConfiguration.isActive ? "default" : "secondary"
                      }
                      className={
                        viewingConfiguration.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }
                    >
                      {viewingConfiguration.isActive
                        ? "Đang hoạt động"
                        : "Không hoạt động"}
                    </Badge>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Số tiền
                      </Label>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(viewingConfiguration.amount)}
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Vai trò
                      </Label>
                      <p className="text-lg font-medium text-gray-900">
                        {getRoleName(viewingConfiguration.roleName)}
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Loại phí
                      </Label>
                      <p className="text-lg font-medium text-gray-900">
                        {getFeeTypeLabel(viewingConfiguration.feeType)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Hiệu lực từ
                      </Label>
                      <p className="text-lg font-medium text-gray-900">
                        {formatDate(viewingConfiguration.effectiveFrom)}
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Hết hiệu lực
                      </Label>
                      <p className="text-lg font-medium text-gray-900">
                        {viewingConfiguration.effectiveTo
                          ? formatDate(viewingConfiguration.effectiveTo)
                          : "Không giới hạn"}
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Trạng thái
                      </Label>
                      <div className="flex items-center gap-2">
                        {viewingConfiguration.isActive ? (
                          <FiCheckCircle className="text-green-500" />
                        ) : (
                          <FiXCircle className="text-red-500" />
                        )}
                        <span
                          className={
                            viewingConfiguration.isActive
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {viewingConfiguration.isActive
                            ? "Đang hoạt động"
                            : "Không hoạt động"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {viewingConfiguration.description && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Mô tả
                    </Label>
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-700 leading-relaxed">
                        {viewingConfiguration.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Ngày tạo
                    </Label>
                    <p className="text-sm text-gray-600">
                      {new Date(viewingConfiguration.createdAt).toLocaleString(
                        "vi-VN"
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Cập nhật lần cuối
                    </Label>
                    <p className="text-sm text-gray-600">
                      {new Date(viewingConfiguration.updatedAt).toLocaleString(
                        "vi-VN"
                      )}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowViewDialog(false)}
                  >
                    Đóng
                  </Button>
                  <Button
                    onClick={() => {
                      setShowViewDialog(false);
                      openEditDialog({
                        configId: viewingConfiguration.configId,
                        roleName: viewingConfiguration.roleName,
                        feeType: viewingConfiguration.feeType,
                        amount: viewingConfiguration.amount,
                        isActive: viewingConfiguration.isActive,
                        effectiveFrom: viewingConfiguration.effectiveFrom,
                        effectiveTo: viewingConfiguration.effectiveTo,
                      });
                    }}
                  >
                    <FiEdit className="w-4 h-4 mr-2" />
                    Chỉnh sửa
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
