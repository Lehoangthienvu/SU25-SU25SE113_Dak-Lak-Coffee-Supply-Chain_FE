"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Edit, Trash2, CheckCircle, XCircle, Building2, Globe, Phone, Mail, MapPin, FileText, Calendar } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { getManagerById, deleteManager } from "@/lib/api/businessManager";
import { verifyBusinessManagerAccount } from "@/lib/api/auth";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { useTranslation } from "react-i18next";

interface BusinessManager {
    managerId: string;
    managerCode: string;
    companyName: string;
    companyAddress: string;
    taxId: number;
    website: string;
    department: string;
    contactEmail: string;
    businessLicenseUrl: string;
    isCompanyVerified: boolean;
    fullName: string;
    email: string;
    phoneNumber: string;
    position: string;
    createdAt: string;
    updatedAt: string;
}

export default function ManagerDetailPage() {
    // Kiểm tra quyền admin
    useAuthGuard(["admin"]);
    
    // Sử dụng translation
    const { t } = useTranslation();

    const router = useRouter();
    const params = useParams();
    const managerId = params.id as string;

    const [manager, setManager] = useState<BusinessManager | null>(null);
    const [loading, setLoading] = useState(true);

    // Load data từ API
    const loadManager = async () => {
        try {
            setLoading(true);
            const data = await getManagerById(managerId);
            
            // Map dữ liệu từ API response
            const managerData: BusinessManager = {
                managerId: data.managerId || '',
                managerCode: data.managerCode || '',
                companyName: data.companyName || '',
                companyAddress: data.companyAddress || '',
                taxId: data.taxId || 0,
                website: data.website || '',
                department: data.department || '',
                contactEmail: data.contactEmail || '',
                businessLicenseUrl: data.businessLicenseUrl || '',
                isCompanyVerified: data.isCompanyVerified || false,
                fullName: data.fullName || '',
                email: data.email || '',
                phoneNumber: data.phoneNumber || '',
                position: (data as any).position || '',
                createdAt: (data as any).createdAt || new Date().toISOString(),
                updatedAt: (data as any).updatedAt || new Date().toISOString()
            };
            
            setManager(managerData);
        } catch (error) {
            console.error("Lỗi khi tải thông tin doanh nghiệp:", error);
            toast.error(t("messages.loadError"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (managerId) {
            loadManager();
        }
    }, [managerId]);

    const handleVerify = async () => {
        if (manager) {
            try {
                const verifyData = {
                    action: !manager.isCompanyVerified,
                    reason: manager.isCompanyVerified ? "Bỏ xác thực doanh nghiệp" : "Xác thực doanh nghiệp"
                };

                await verifyBusinessManagerAccount(managerId, verifyData);

                // Cập nhật local state
                setManager(prev => prev ? { ...prev, isCompanyVerified: !prev.isCompanyVerified } : null);
                toast.success(t("messages.verifySuccess"));
            } catch (error) {
                console.error("Lỗi khi cập nhật trạng thái xác thực:", error);
                toast.error(t("messages.verifyError"));
            }
        }
    };

    const handleSoftDelete = async () => {
        if (confirm(t("messages.deleteConfirm"))) {
            try {
                await deleteManager(managerId);
                toast.success(t("messages.deleteSuccess"));
                router.push("/dashboard/admin/managers");
            } catch (error) {
                console.error("Lỗi khi xóa doanh nghiệp:", error);
                toast.error(t("messages.deleteError"));
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                <span className="ml-3 text-gray-600">{t("messages.loading")}</span>
            </div>
        );
    }

    if (!manager) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">{t("detail.notFound")}</h2>
                <p className="text-gray-600 mb-4">{t("detail.notFoundDesc")}</p>
                <Button onClick={() => router.push("/dashboard/admin/managers")}>
                    {t("detail.backToList")}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t("detail.back")}
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{manager.companyName}</h1>
                        <p className="text-gray-600 mt-2">{t("detail.subtitle")}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleVerify}
                        className={manager.isCompanyVerified ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                    >
                        {manager.isCompanyVerified ? (
                            <>
                                <XCircle className="w-4 h-4 mr-2" />
                                {t("actions.unverify")}
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                {t("actions.verify")}
                            </>
                        )}
                    </Button>

                    <Button variant="outline" asChild>
                        <Link href={`/dashboard/admin/managers/${managerId}/edit`}>
                            <Edit className="w-4 h-4 mr-2" />
                            {t("actions.edit")}
                        </Link>
                    </Button>

                    <Button variant="outline" onClick={handleSoftDelete} className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t("actions.delete")}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Thông tin chính */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Thông tin doanh nghiệp */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="w-5 h-5" />
                                {t("detail.personalInfo")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">{t("detail.fields.managerCode")}</label>
                                    <div className="mt-1">
                                        <Badge variant="outline" className="font-mono text-base">
                                            {manager.managerCode}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">{t("detail.fields.status")}</label>
                                    <div className="mt-1">
                                        {manager.isCompanyVerified ? (
                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                {t("status.verified")}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-orange-600 border-orange-200">
                                                <XCircle className="w-3 h-3 mr-1" />
                                                {t("status.unverified")}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">{t("detail.fields.companyName")}</label>
                                <p className="mt-1 text-lg font-medium">{manager.companyName}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">{t("detail.fields.position")}</label>
                                    <p className="mt-1">
                                        <Badge variant="secondary">{manager.position}</Badge>
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">{t("detail.fields.department")}</label>
                                    <p className="mt-1">
                                        <Badge variant="outline">{manager.department}</Badge>
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Thông tin công ty */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="w-5 h-5" />
                                {t("detail.companyInfo")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">{t("detail.fields.companyAddress")}</label>
                                <p className="mt-1 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    {manager.companyAddress || "N/A"}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">{t("detail.fields.taxId")}</label>
                                    <p className="mt-1 font-mono">{manager.taxId || "N/A"}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">{t("detail.fields.website")}</label>
                                    <p className="mt-1 flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-gray-400" />
                                        {manager.website ? (
                                            <a 
                                                href={manager.website.startsWith('http') ? manager.website : `https://${manager.website}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 underline"
                                            >
                                                {manager.website}
                                            </a>
                                        ) : (
                                            "N/A"
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">{t("detail.fields.businessLicense")}</label>
                                <p className="mt-1 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                    {manager.businessLicenseUrl ? (
                                        <a 
                                            href={manager.businessLicenseUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 underline"
                                        >
                                            Xem giấy phép
                                        </a>
                                    ) : (
                                        "N/A"
                                    )}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Thông tin liên hệ */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Phone className="w-5 h-5" />
                                {t("detail.contactInfo")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">{t("detail.fields.contactEmail")}</label>
                                    <p className="mt-1 flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        {manager.contactEmail || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">{t("detail.fields.phoneNumber")}</label>
                                    <p className="mt-1 flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        {manager.phoneNumber || "N/A"}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Email đăng nhập</label>
                                <p className="mt-1 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    {manager.email || "N/A"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Thống kê */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("detail.statistics")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-orange-600">
                                    {manager.isCompanyVerified ? "✓" : "✗"}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {manager.isCompanyVerified ? t("status.verified") : t("status.unverified")}
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600">
                                    {manager.department ? "1" : "0"}
                                </div>
                                <div className="text-sm text-gray-500">Phòng ban</div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Thông tin hệ thống */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("detail.systemInfo")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-gray-500">{t("detail.fields.createdAt")}</label>
                                <p className="mt-1 text-sm flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    {new Date(manager.createdAt).toLocaleDateString("vi-VN")}
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">{t("detail.fields.updatedAt")}</label>
                                <p className="mt-1 text-sm flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    {new Date(manager.updatedAt).toLocaleDateString("vi-VN")}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
