"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Lock, Eye, EyeOff, User, Phone, Building, FileText, Loader2, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";
import { resendVerificationEmail, signUp } from "@/lib/api/auth";
import { getBusinessAndFarmerRole, Role } from "@/lib/api/role";
import { getErrorMessage } from "@/lib/utils";
import { AppToast } from "@/components/ui/AppToast";

export default function RegisterPage() {
  const [showResendBox, setShowResendBox] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    roleId: 0, // Sẽ được set từ API
    companyName: "",
    taxId: "",
    businessLicenseURl: "",
    acceptTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  // Function để chuyển đổi tên role sang tiếng Việt
  const getRoleDisplayName = (roleName: string) => {
    const lowerRoleName = roleName.toLowerCase();
    if (lowerRoleName.includes('farmer')) {
      return 'Nông hộ';
    } else if (lowerRoleName.includes('business') || lowerRoleName.includes('manager')) {
      return 'Doanh nghiệp';
    }
    return roleName; // Fallback về tên gốc nếu không match
  };

  // Fetch roles khi component mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const rolesData = await getBusinessAndFarmerRole();
        setRoles(rolesData);
        // Set roleId mặc định là Farmer (tìm role có tên chứa "farmer" hoặc role đầu tiên)
        if (rolesData.length > 0) {
          const farmerRole = rolesData.find(role => 
            role.roleName.toLowerCase().includes('farmer')
          ) || rolesData[0];
          setFormData(prev => ({ ...prev, roleId: farmerRole.roleId }));
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
        AppToast.error("Không thể tải danh sách vai trò. Vui lòng thử lại.");
      } finally {
        setRolesLoading(false);
      }
    };

    fetchRoles();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!formData.password) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    if (!formData.name) {
      newErrors.name = "Vui lòng nhập họ tên";
    }

    if (!formData.phone) {
      newErrors.phone = "Vui lòng nhập số điện thoại";
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }

    if (!formData.roleId || formData.roleId === 0) {
      newErrors.roleId = "Vui lòng chọn vai trò";
    }

    // Kiểm tra nếu role là Doanh nghiệp
    const selectedRole = roles.find(role => role.roleId === formData.roleId);
    const isBusinessRole = selectedRole?.roleName.toLowerCase().includes('business') || 
                          selectedRole?.roleName.toLowerCase().includes('manager');
    
    if (isBusinessRole) {
      if (!formData.companyName) {
        newErrors.companyName = "Vui lòng nhập tên công ty";
      }
      if (!formData.taxId) {
        newErrors.taxId = "Vui lòng nhập mã số thuế";
      } else if (!/^\d{10,14}$/.test(formData.taxId)) {
        newErrors.taxId = "Mã số thuế phải từ 10 đến 14 chữ số";
      }
      if (!formData.businessLicenseURl) {
        newErrors.businessLicenseURl = "Vui lòng nhập đường dẫn giấy phép kinh doanh";
      }
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "Bạn phải đồng ý với các điều khoản của nền tảng";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Xác định role có phải là Business không
    const selectedRole = roles.find(role => role.roleId === formData.roleId);
    const isBusinessRole = selectedRole?.roleName.toLowerCase().includes('business') || 
                          selectedRole?.roleName.toLowerCase().includes('manager');

    const payload = {
      email: formData.email,
      password: formData.password,
      name: formData.name,
      roleId: formData.roleId,
      phone: formData.phone,
      companyName: isBusinessRole ? formData.companyName : "",
      taxId: isBusinessRole ? formData.taxId : "",
      businessLicenseURl: isBusinessRole ? formData.businessLicenseURl : "",
    };

    setLoading(true);
    try {
      await signUp(payload);
      setTimeout(() => setShowResendBox(true), 10000);
      AppToast.success("Bạn hãy kiểm tra email đã được đăng ký để xác thực.");
    } catch (err) {
      AppToast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "roleId" ? parseInt(value) : value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-600"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 text-center w-full">
          {/* Logo */}
          <div className="w-48 h-48 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-10 shadow-2xl overflow-hidden">
            <Image
              src="/logo.jpg"
              alt="DakLak SupplyChain Logo"
              width={120}
              height={120}
              className="rounded-full object-cover"
            />
          </div>

          <h1 className="text-5xl font-bold mb-6">
            Tham gia cùng chúng tôi
          </h1>
          <p className="text-xl text-orange-100 mb-10 max-w-md leading-relaxed">
            Kết nối với hệ sinh thái cà phê Đắk Lắk và tối ưu hóa chuỗi cung ứng của bạn
          </p>

          {/* Feature Points */}
          <div className="space-y-4 text-sm text-orange-100">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="font-medium">Quản lý mùa vụ hiệu quả</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="font-medium">Kết nối trực tiếp với đối tác</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="font-medium">Theo dõi tiến độ thời gian thực</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Register Card */}
          <Card className="border-orange-100 shadow-xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-gray-800">
                Đăng ký tài khoản
              </CardTitle>
              <p className="text-gray-600 text-sm mt-2">
                Tạo tài khoản để tham gia nền tảng chuỗi cung ứng cà phê Đắk Lắk
              </p>
            </CardHeader>

            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* General Error Message */}
                {generalError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-red-700">{generalError}</span>
                  </div>
                )}

                {/* Role Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Vai trò</Label>
                  <Select
                    value={formData.roleId > 0 ? formData.roleId.toString() : ""}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, roleId: parseInt(value) }))}
                    disabled={rolesLoading}
                  >
                    <SelectTrigger className="border-gray-200 focus:border-orange-500 focus:ring-orange-500">
                      <SelectValue placeholder={rolesLoading ? "Đang tải vai trò..." : "Chọn vai trò của bạn"} />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.roleId} value={role.roleId.toString()}>
                          {role.roleName.toLowerCase().includes('farmer') ? '🌾 ' : '🏢 '}
                          {getRoleDisplayName(role.roleName)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {rolesLoading && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Đang tải danh sách vai trò...
                    </p>
                  )}
                  {errors.roleId && <p className="text-red-500 text-xs">{errors.roleId}</p>}
                </div>

                {/* Email Field */}
                <InputField
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  icon={<Mail className="w-4 h-4 text-gray-400" />}
                  placeholder="Nhập email của bạn"
                />

                {/* Password Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Mật khẩu</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        className="pl-10 pr-10 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                        placeholder="Nhập mật khẩu"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Xác nhận mật khẩu</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="pl-10 pr-10 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                        placeholder="Xác nhận mật khẩu"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword}</p>}
                  </div>
                </div>

                {/* Personal Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Tên người đại diện"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    icon={<User className="w-4 h-4 text-gray-400" />}
                    placeholder="Nhập họ tên"
                  />

                  <InputField
                    label="Số điện thoại"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    error={errors.phone}
                    icon={<Phone className="w-4 h-4 text-gray-400" />}
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                {/* Business Info (if role is Doanh nghiệp) */}
                {(() => {
                  const selectedRole = roles.find(role => role.roleId === formData.roleId);
                  const isBusinessRole = selectedRole?.roleName.toLowerCase().includes('business') || 
                                        selectedRole?.roleName.toLowerCase().includes('manager');
                  return isBusinessRole;
                })() && (
                  <div className="space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
                    <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <Building className="w-4 h-4 text-orange-600" />
                      Thông tin doanh nghiệp
                    </h3>

                    <InputField
                      label="Tên công ty"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      error={errors.companyName}
                      icon={<Building className="w-4 h-4 text-gray-400" />}
                      placeholder="Nhập tên công ty"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField
                        label="Mã số thuế"
                        name="taxId"
                        value={formData.taxId}
                        onChange={handleChange}
                        error={errors.taxId}
                        icon={<FileText className="w-4 h-4 text-gray-400" />}
                        placeholder="Nhập mã số thuế"
                      />

                      <InputField
                        label="Link giấy phép kinh doanh"
                        name="businessLicenseURl"
                        value={formData.businessLicenseURl}
                        onChange={handleChange}
                        error={errors.businessLicenseURl}
                        icon={<FileText className="w-4 h-4 text-gray-400" />}
                        placeholder="Nhập link giấy phép"
                      />
                    </div>
                  </div>
                )}

                {/* Terms & Conditions */}
                <div className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          acceptTerms: e.target.checked,
                        }))
                      }
                      className="mt-1 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <Label htmlFor="acceptTerms" className="text-sm text-gray-700">
                      Tôi đồng ý với các{" "}
                      <Link
                        href="/terms-of-service"
                        target="_blank"
                        className="text-orange-600 hover:text-orange-700 underline font-medium"
                      >
                        điều khoản của nền tảng
                      </Link>
                    </Label>
                  </div>
                  {errors.acceptTerms && (
                    <p className="text-red-500 text-xs ml-7">{errors.acceptTerms}</p>
                  )}
                </div>

                {/* Resend Email Box */}
                {showResendBox && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>Không nhận được email?</span>
                      <button
                        type="button"
                        onClick={async () => {
                          const email = localStorage.getItem("pending_email");
                          if (email) {
                            try {
                              await resendVerificationEmail(email);
                              setGeneralError("");
                            } catch (err) {
                              setGeneralError("Không thể gửi lại email xác thực. Vui lòng thử lại.");
                            }
                          } else {
                            setGeneralError("Không tìm thấy email đã đăng ký.");
                          }
                        }}
                        className="text-green-700 font-semibold underline hover:text-green-900 inline-flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Gửi lại
                      </button>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Đăng ký tài khoản'
                  )}
                </Button>

                {/* Login Link */}
                <div className="text-center">
                  <span className="text-sm text-gray-600">Đã có tài khoản? </span>
                  <Link
                    href="/auth/login"
                    className="text-sm font-semibold text-orange-600 hover:text-orange-700 hover:underline transition-colors"
                  >
                    Đăng nhập ngay
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-gray-500">
            <p>© 2025 DakLak SupplyChain Platform. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

type InputFieldProps = {
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  error?: string;
  icon?: React.ReactNode;
  placeholder?: string;
};

function InputField({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  icon,
  placeholder,
}: InputFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
      </Label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            {icon}
          </div>
        )}
        <Input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          className={`${icon ? "pl-10" : ""} border-gray-200 focus:border-orange-500 focus:ring-orange-500`}
          placeholder={placeholder}
        />
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}
