'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppToast } from '@/components/ui/AppToast';
import { ArrowLeft, FileText, AlertTriangle, Image, Video, Loader2 } from 'lucide-react';

import {
    GeneralFarmerReportCreateDto,
    createFarmerReport,
    getProcessingBatchProgressesForCurrentFarmer,
    ProcessingBatchProgressForReport
} from '@/lib/api/generalFarmerReports';
import { SeverityLevelEnum, SeverityLevelLabel } from '@/lib/constants/SeverityLevelEnum';
import { getCropProgressesByDetailId, getAllCropProgressesForCurrentUser, CropProgressViewAllDto } from '@/lib/api/cropProgress';

// Separate component that uses useSearchParams
function CreateReportForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const detailIdFromUrl = searchParams.get("detailId") ?? "";

    const [cropProgressOptions, setCropProgressOptions] = useState<CropProgressViewAllDto[]>([]);
    const [processingBatchOptions, setProcessingBatchOptions] = useState<ProcessingBatchProgressForReport[]>([]);

    // State để nhóm crop progress theo mùa vụ
    const [groupedCropProgress, setGroupedCropProgress] = useState<{ [key: string]: CropProgressViewAllDto[] }>({});
    const [selectedCropSeason, setSelectedCropSeason] = useState<string>('');

    const [form, setForm] = useState<GeneralFarmerReportCreateDto>({
        reportType: 'Crop',
        severityLevel: SeverityLevelEnum.Medium,
        title: '',
        description: '',
        cropProgressId: '',
        processingProgressId: '', // Sửa thành processingProgressId
        photoFiles: [],
        videoFiles: [],
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchProgressList = async () => {
            try {
                let data: CropProgressViewAllDto[] = [];

                if (detailIdFromUrl) {
                    data = await getCropProgressesByDetailId(detailIdFromUrl);
                } else {
                    data = await getAllCropProgressesForCurrentUser();
                }

                // Nhóm data theo mùa vụ
                const grouped = data.reduce((acc, item) => {
                    // Tạo key mùa vụ với thông tin có sẵn
                    let seasonKey = '';
                    if (item.cropSeasonName) {
                        seasonKey = item.cropSeasonName;
                        if (item.cropSeasonDetailName && item.cropSeasonDetailName !== '') {
                            seasonKey += ` - ${item.cropSeasonDetailName}`;
                        }
                    } else {
                        seasonKey = 'Mùa vụ không xác định';
                    }

                    if (!acc[seasonKey]) {
                        acc[seasonKey] = [];
                    }
                    acc[seasonKey].push(item);
                    return acc;
                }, {} as { [key: string]: CropProgressViewAllDto[] });

                setGroupedCropProgress(grouped);

                // Chọn mùa vụ đầu tiên làm mặc định
                const firstSeason = Object.keys(grouped)[0];
                if (firstSeason) {
                    setSelectedCropSeason(firstSeason);
                    setCropProgressOptions(grouped[firstSeason] || []);
                } else {
                    setCropProgressOptions(data || []);
                }
            } catch (error) {
                console.error("❌ Error fetching crop progress:", error);
                AppToast.error("Không thể tải danh sách tiến độ mùa vụ.");
            }
        };

        const fetchProcessingBatches = async () => {
            try {
                const data = await getProcessingBatchProgressesForCurrentFarmer();
                setProcessingBatchOptions(data || []);
            } catch (error) {
                console.error("❌ Error fetching processing batches:", error);
                AppToast.error("Không thể tải danh sách lô sơ chế.");
            }
        };

        fetchProgressList();
        fetchProcessingBatches();
    }, [detailIdFromUrl]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handlePhotoFilesChange = (files: File[]) => {
        setForm(prev => ({ ...prev, photoFiles: files }));
    };

    const handleVideoFilesChange = (files: File[]) => {
        setForm(prev => ({ ...prev, videoFiles: files }));
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;

        // Validation cho Crop report
        if (form.reportType === 'Crop') {
            if (!form.cropProgressId) {
                AppToast.error("Vui lòng chọn tiến độ mùa vụ.");
                return;
            }
        }

        const requiredFields = ['title', 'description', 'reportType'];
        for (const field of requiredFields) {
            if (!form[field as keyof typeof form]) {
                AppToast.error('Vui lòng điền đầy đủ thông tin bắt buộc.');
                return;
            }
        }

        if (
            (form.reportType === 'Crop' && !form.cropProgressId) ||
            (form.reportType === 'Processing' && !form.processingProgressId)
        ) {
            AppToast.error('Vui lòng chọn tiến độ phù hợp với loại báo cáo.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: GeneralFarmerReportCreateDto = {
                reportType: form.reportType,
                title: form.title,
                description: form.description,
                severityLevel: form.severityLevel,
                cropProgressId: form.reportType === "Crop" ? form.cropProgressId : undefined,
                processingProgressId: form.reportType === "Processing" ? form.processingProgressId : undefined,
                photoFiles: form.photoFiles?.length ? form.photoFiles : undefined,
                videoFiles: form.videoFiles?.length ? form.videoFiles : undefined,
            };

            // Gọi API tạo báo cáo (tự động xử lý media nếu có)
            const res = await createFarmerReport(payload);

            AppToast.success('Tạo báo cáo thành công!');
            router.push(`/dashboard/farmer/request-feedback/${res.reportId}`);
        } catch (err: unknown) {
            console.error("❌ Raw error:", err);
            const errorMessage = err instanceof Error && 'response' in err && typeof (err as Error & { response?: { data?: { message?: string } } }).response === 'object'
                ? (err as Error & { response?: { data?: { message?: string } } }).response?.data?.message
                : 'Tạo báo cáo thất bại';
            AppToast.error(errorMessage || "Tạo báo cáo thất bại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4">
            <div className="max-w-3xl mx-auto py-8">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-6 mb-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full"></div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">
                                    Tạo tư vấn kỹ thuật mới
                                </h1>
                                <p className="text-gray-600 text-sm">
                                    {form.reportType === 'Crop'
                                        ? 'Gửi yêu cầu hỗ trợ kỹ thuật cho các vấn đề gặp phải trong mùa vụ'
                                        : 'Gửi yêu cầu hỗ trợ kỹ thuật cho các vấn đề gặp phải trong quá trình sơ chế'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Form */}
                <Card className="border-orange-100 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
                            <FileText className="w-5 h-5 text-orange-500" />
                            Thông tin báo cáo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Report Type */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Loại báo cáo *</Label>
                            <Select
                                value={form.reportType}
                                onValueChange={(value: 'Crop' | 'Processing') => {
                                    setForm((prev) => ({
                                        ...prev,
                                        reportType: value,
                                        cropProgressId: '',
                                        processingProgressId: '',
                                    }));
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Crop">🌱 Mùa vụ</SelectItem>
                                    <SelectItem value="Processing">⚙️ Sơ chế</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Crop Progress Selection */}
                        {form.reportType === 'Crop' && (
                            <div className="space-y-4">
                                {/* Chọn mùa vụ trước */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Chọn mùa vụ *</Label>
                                    <Select
                                        value={selectedCropSeason}
                                        onValueChange={(value) => {
                                            setSelectedCropSeason(value);
                                            setCropProgressOptions(groupedCropProgress[value] || []);
                                            setForm(prev => ({ ...prev, cropProgressId: '' }));
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="-- Chọn mùa vụ --" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.keys(groupedCropProgress).map(seasonKey => (
                                                <SelectItem key={seasonKey} value={seasonKey}>
                                                    {seasonKey}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Chọn giai đoạn sau khi đã chọn mùa vụ */}
                                {selectedCropSeason && (
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">Chọn giai đoạn *</Label>
                                        <Select
                                            value={form.cropProgressId}
                                            onValueChange={(value) => {
                                                setForm((prev) => ({
                                                    ...prev,
                                                    cropProgressId: value,
                                                }));
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="-- Chọn giai đoạn --" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {cropProgressOptions.map(p => (
                                                    <SelectItem key={p.progressId} value={p.progressId}>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-medium text-gray-700">
                                                                {p.cropSeasonName && `${p.cropSeasonName}`}
                                                                {p.cropSeasonDetailName && ` • ${p.cropSeasonDetailName}`}
                                                                {p.stepIndex && ` • Bước ${p.stepIndex}`}
                                                                {p.progressDate ? ` • ${new Date(p.progressDate).toLocaleDateString("vi-VN")}` : ''}
                                                            </span>
                                                            <span className="text-sm text-gray-500">{p.stageName}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {Object.keys(groupedCropProgress).length === 0 && (
                                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                        <p className="text-sm text-gray-600 text-center">
                                            Không có mùa vụ nào để chọn.
                                            <br />
                                            <span className="text-xs text-gray-500">
                                                Vui lòng tạo mùa vụ trước khi gửi báo cáo.
                                            </span>
                                        </p>
                                    </div>
                                )}

                                {selectedCropSeason && cropProgressOptions.length === 0 && (
                                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                        <p className="text-sm text-gray-600 text-center">
                                            Mùa vụ này chưa có giai đoạn nào.
                                            <br />
                                            <span className="text-xs text-gray-500">
                                                Vui lòng tạo giai đoạn cho mùa vụ này.
                                            </span>
                                        </p>
                                    </div>
                                )}

                                {selectedCropSeason && cropProgressOptions.length > 0 && (
                                    <p className="text-xs text-gray-500">
                                        Chọn giai đoạn mùa vụ mà bạn gặp vấn đề để báo cáo
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Processing Progress ID */}
                        {form.reportType === 'Processing' && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">Tiến độ sơ chế *</Label>
                                <Select
                                    value={form.processingProgressId}
                                    onValueChange={(value) => {
                                        setForm((prev) => ({
                                            ...prev,
                                            processingProgressId: value,
                                        }));
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="-- Chọn tiến độ sơ chế --" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {processingBatchOptions.map(batch => (
                                            <SelectItem key={batch.progressId} value={batch.progressId}>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium text-gray-700">
                                                        {batch.batchCode && `${batch.batchCode}`}
                                                        {batch.progressDate ? ` • ${new Date(batch.progressDate).toLocaleDateString("vi-VN")}` : ''}
                                                    </span>
                                                    <span className="text-sm text-gray-500">{batch.stageName} - Bước {batch.stepIndex}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {processingBatchOptions.length === 0 && (
                                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                        <p className="text-sm text-gray-600 text-center">
                                            Không có tiến độ sơ chế nào để chọn.
                                            <br />
                                            <span className="text-xs text-gray-500">
                                                Vui lòng tạo tiến độ sơ chế trước khi gửi báo cáo.
                                            </span>
                                        </p>
                                    </div>
                                )}
                                {processingBatchOptions.length > 0 && (
                                    <p className="text-xs text-gray-500">
                                        Chọn tiến độ sơ chế mà bạn gặp vấn đề để báo cáo
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Title */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Tiêu đề *</Label>
                            <Input
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                placeholder={
                                    form.reportType === 'Crop'
                                        ? "Ví dụ: Sâu bệnh tấn công giai đoạn ra hoa"
                                        : "Ví dụ: Máy sơ chế bị lỗi, cà phê bị cháy khét"
                                }
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Mô tả chi tiết *</Label>
                            <Textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                rows={5}
                                placeholder={
                                    form.reportType === 'Crop'
                                        ? "Mô tả chi tiết vấn đề bạn gặp phải trong mùa vụ (sâu bệnh, thời tiết, dinh dưỡng...)"
                                        : "Mô tả chi tiết vấn đề bạn gặp phải trong quá trình sơ chế (máy móc, nhiệt độ, thời gian...)"
                                }
                            />
                        </div>

                        {/* Severity Level */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                                Mức độ nghiêm trọng *
                            </Label>
                            <Select
                                value={form.severityLevel.toString()}
                                onValueChange={(value) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        severityLevel: parseInt(value, 10) as SeverityLevelEnum,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.values(SeverityLevelEnum)
                                        .filter((val) => typeof val === 'number')
                                        .map((val) => (
                                            <SelectItem key={val} value={val.toString()}>
                                                {SeverityLevelLabel[val as SeverityLevelEnum]}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Media Section */}
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-sm font-medium text-gray-700 mb-4">Tài liệu đính kèm (tùy chọn)</h3>
                        </div>

                        {/* File Upload Section */}
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-sm font-medium text-gray-700 mb-4">📎 Tài liệu đính kèm (tùy chọn)</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Photo Files Upload */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Image className="w-4 h-4 text-green-500" />
                                        📸 Tải lên hình ảnh
                                    </Label>
                                    <Input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            handlePhotoFilesChange(files);
                                        }}
                                        className="cursor-pointer"
                                        placeholder="Chọn một hoặc nhiều ảnh..."
                                    />
                                    {form.photoFiles && form.photoFiles.length > 0 && (
                                        <div className="text-xs text-green-600 font-medium">
                                            ✅ Đã chọn {form.photoFiles.length} ảnh
                                        </div>
                                    )}
                                </div>

                                {/* Video Files Upload */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Video className="w-4 h-4 text-purple-500" />
                                        🎥 Tải lên video
                                    </Label>
                                    <Input
                                        type="file"
                                        multiple
                                        accept="video/*"
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            handleVideoFilesChange(files);
                                        }}
                                        className="cursor-pointer"
                                        placeholder="Chọn một hoặc nhiều video..."
                                    />
                                    {form.videoFiles && form.videoFiles.length > 0 && (
                                        <div className="text-xs text-purple-600 font-medium">
                                            ✅ Đã chọn {form.videoFiles.length} video
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-6 border-t border-gray-200">
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => router.back()}
                                    disabled={isSubmitting}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="min-w-[120px]"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Đang gửi...
                                        </>
                                    ) : (
                                        'Gửi'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Loading component for Suspense fallback
function CreateReportLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4">
            <div className="max-w-3xl mx-auto py-8">
                <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-6 mb-6">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Main page component with Suspense boundary
export default function CreateReportPage() {
    return (
        <Suspense fallback={<CreateReportLoading />}>
            <CreateReportForm />
        </Suspense>
    );
}
