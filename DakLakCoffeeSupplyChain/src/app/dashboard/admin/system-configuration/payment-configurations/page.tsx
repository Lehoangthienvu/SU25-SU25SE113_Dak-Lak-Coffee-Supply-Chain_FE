"use client";

import React, { useState, useEffect } from "react";
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

  const getRoleName = (roleName: string) => {
    return roleName || "Không xác định";
  };

  const getFeeTypeLabel = (feeType: string) => {
    const fee = feeTypeOptions.find((f) => f.value === feeType);
    return fee ? fee.label : feeType;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
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
                        {numberToVietnameseWords(formData.amount)} đồng
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

        {/* Configurations Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiDollarSign />
              Danh sách cấu hình phí ({configurations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {configurations.length === 0 ? (
              <div className="text-center py-8">
                <FiDollarSign className="text-gray-400 text-4xl mx-auto mb-4" />
                <p className="text-gray-500">Chưa có cấu hình phí nào</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Loại phí</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Hiệu lực</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configurations.map((config) => (
                    <TableRow key={config.configId}>
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
                          >
                            {config.isActive ? (
                              <FiEyeOff className="w-4 h-4" />
                            ) : (
                              <FiCheckCircle className="w-4 h-4" />
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
                    {numberToVietnameseWords(formData.amount)} đồng
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
