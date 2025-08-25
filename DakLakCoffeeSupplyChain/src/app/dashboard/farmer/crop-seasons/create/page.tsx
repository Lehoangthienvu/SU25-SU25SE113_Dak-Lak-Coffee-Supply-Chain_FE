'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuthGuard } from '@/lib/auth/useAuthGuard';
import { createCropSeason } from '@/lib/api/cropSeasons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AppToast } from '@/components/ui/AppToast';
import { getErrorMessage } from '@/lib/utils';
import { getAvailableCommitments, FarmingCommitment, FarmingCommitmentDetail } from '@/lib/api/farmingCommitments';
import { Calendar, Coffee, CheckCircle, AlertCircle } from 'lucide-react';

export default function CreateCropSeasonPage() {
    useAuthGuard(['farmer']);
    const router = useRouter();

    const [form, setForm] = useState({
        seasonName: '',
        startDate: '',
        endDate: '',
        note: '',
        commitmentId: '',
    });

    const [availableCommitments, setAvailableCommitments] = useState<FarmingCommitment[]>([]);
    const [isLoadingCommitments, setIsLoadingCommitments] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCommitment, setSelectedCommitment] = useState<FarmingCommitment | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Helper function to compare dates accurately
    const compareDates = (date1: string, date2: string): number => {
        // Parse dates and create Date objects
        const d1 = new Date(date1);
        const d2 = new Date(date2);

        // Check if dates are valid
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
            console.error('Invalid date format:', { date1, date2 });
            return 0;
        }

        // Create new Date objects with only year, month, day (no time)
        const dateOnly1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
        const dateOnly2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());

        return dateOnly1.getTime() - dateOnly2.getTime();
    };

    // Load danh sách cam kết khả dụng
    useEffect(() => {
        const fetchCommitments = async () => {
            try {
                setIsLoadingCommitments(true);
                const data = await getAvailableCommitments();
                setAvailableCommitments(data);
            } catch (error) {
                console.error('Error fetching commitments:', error);
                AppToast.error('Không thể tải danh sách cam kết.');
            } finally {
                setIsLoadingCommitments(false);
            }
        };
        fetchCommitments();
    }, []);

    // Tự động điều chỉnh thời gian mùa vụ khi chọn commitment
    useEffect(() => {
        if (selectedCommitment && selectedCommitment.farmingCommitmentDetails) {
            // Kiểm tra nếu có approvedAt từ commitment
            if (selectedCommitment.approvedAt) {
                const approvedDate = new Date(selectedCommitment.approvedAt);

                // Tính thời gian mùa vụ dựa trên approvedAt
                // Start date: bắt đầu từ ngày approved (cùng ngày)
                const seasonStart = new Date(approvedDate);

                // End date: 11 tháng sau start date
                const seasonEnd = new Date(seasonStart);
                seasonEnd.setMonth(seasonEnd.getMonth() + 11); // 11 tháng sau start date

                // Sử dụng local date để tránh timezone issue
                const formatDateForInput = (date: Date) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                };

                const startDateStr = formatDateForInput(seasonStart);
                const endDateStr = formatDateForInput(seasonEnd);

                setForm(prev => ({
                    ...prev,
                    startDate: startDateStr,
                    endDate: endDateStr
                }));
            } else {
                // Commitment chưa được duyệt - không thể tạo mùa vụ
                // Clear form dates
                setForm(prev => ({
                    ...prev,
                    startDate: '',
                    endDate: ''
                }));
            }
        }
    }, [selectedCommitment]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        if (name === 'commitmentId') {
            const commitment = availableCommitments.find(c => c.commitmentId === value);
            setSelectedCommitment(commitment || null);
        }

        setForm((prev) => ({ ...prev, [name]: value }));

        // Clear error khi user thay đổi giá trị
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = (): Record<string, string> => {
        const newErrors: Record<string, string> = {};

        // Validation cơ bản
        if (!form.seasonName.trim()) {
            newErrors.seasonName = 'Tên mùa vụ không được để trống';
        } else if (form.seasonName.trim().length < 3) {
            newErrors.seasonName = 'Tên mùa vụ phải có ít nhất 3 ký tự';
        }

        if (!form.startDate) {
            newErrors.startDate = 'Ngày bắt đầu không được để trống';
        }

        if (!form.endDate) {
            newErrors.endDate = 'Ngày kết thúc không được để trống';
        } else if (form.startDate && form.endDate) {
            const startDate = new Date(form.startDate);
            const endDate = new Date(form.endDate);

            if (startDate >= endDate) {
                newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
            } else if (selectedCommitment && selectedCommitment.approvedAt) {
                // Kiểm tra thời gian mùa vụ phải trong khoảng 11-12 tháng
                const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                    (endDate.getMonth() - startDate.getMonth());

                if (monthsDiff < 11 || monthsDiff > 13) { // Cho phép sai số 1 tháng
                    newErrors.endDate = 'Thời gian mùa vụ phải trong khoảng 11-12 tháng';
                }
            }
        }

        if (!form.commitmentId) {
            newErrors.commitmentId = 'Vui lòng chọn cam kết';
        } else if (selectedCommitment && !selectedCommitment.approvedAt) {
            newErrors.commitmentId = 'Chỉ có thể tạo mùa vụ từ cam kết đã được duyệt';
        }

        // Validation logic
        if (form.startDate && form.endDate) {
            const startDate = new Date(form.startDate);
            const endDate = new Date(form.endDate);

            // Kiểm tra thời gian mùa vụ có bao gồm thời gian thu hoạch không
            if (selectedCommitment && selectedCommitment.farmingCommitmentDetails) {
                const harvestDates = selectedCommitment.farmingCommitmentDetails
                    .filter((detail: Partial<FarmingCommitmentDetail>) => detail.expectedHarvestStart && detail.expectedHarvestEnd)
                    .map((detail: Partial<FarmingCommitmentDetail>) => ({
                        start: new Date(detail.expectedHarvestStart!),
                        end: new Date(detail.expectedHarvestEnd!)
                    }));

                if (harvestDates.length > 0) {
                    const latestHarvestEnd = harvestDates.reduce((latest, current) =>
                        current.end > latest.end ? current : latest
                    );

                    // Kiểm tra start date phải trước harvest start
                    if (startDate > latestHarvestEnd.start) {
                        newErrors.startDate = 'Ngày bắt đầu mùa vụ phải trước thời gian thu hoạch dự kiến';
                    }

                    if (endDate < latestHarvestEnd.end) {
                        newErrors.endDate = 'Thời gian mùa vụ phải bao gồm thời gian thu hoạch dự kiến';
                    }
                }
            }
        }

        // Kiểm tra start date phải sau hoặc bằng ngày approved
        if (selectedCommitment?.approvedAt && form.startDate) {
            const comparison = compareDates(form.startDate, selectedCommitment.approvedAt);

            console.log('Date comparison debug:', {
                startDate: form.startDate,
                approvedAt: selectedCommitment.approvedAt,
                comparison: comparison,
                startDateObj: new Date(form.startDate),
                approvedAtObj: new Date(selectedCommitment.approvedAt),
                startDateOnly: new Date(new Date(form.startDate).getFullYear(), new Date(form.startDate).getMonth(), new Date(form.startDate).getDate()),
                approvedAtOnly: new Date(new Date(selectedCommitment.approvedAt).getFullYear(), new Date(selectedCommitment.approvedAt).getMonth(), new Date(selectedCommitment.approvedAt).getDate())
            });

            if (comparison < 0) {
                newErrors.startDate = 'Ngày bắt đầu mùa vụ phải sau hoặc bằng ngày cam kết được duyệt (có thể bắt đầu cùng ngày)';
            }
        }

        return newErrors;
    };

    const handleSubmit = async () => {
        // Reset errors trước khi submit
        setErrors({});

        // Validate form
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            AppToast.error('Vui lòng kiểm tra và sửa các lỗi trong form');
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await createCropSeason({
                commitmentId: form.commitmentId,
                seasonName: form.seasonName.trim(),
                startDate: form.startDate,
                endDate: form.endDate,
                note: form.note.trim() || undefined,
            });

            if (result && result.code === 1) {
                AppToast.success('Tạo mùa vụ thành công!');
                router.push('/dashboard/farmer/crop-seasons');
            } else {
                throw new Error(result?.message || 'Tạo mùa vụ thất bại');
            }
        } catch (err) {
            const errorMessage = getErrorMessage(err);

            // Xử lý các loại lỗi cụ thể
            if (errorMessage.includes('Ngày bắt đầu phải trước ngày kết thúc')) {
                setErrors({ endDate: 'Ngày kết thúc phải sau ngày bắt đầu' });
            } else if (errorMessage.includes('Thời gian mùa vụ phải bao gồm thời gian thu hoạch')) {
                setErrors({ endDate: 'Thời gian mùa vụ phải bao gồm thời gian thu hoạch dự kiến' });
            } else if (errorMessage.includes('Ngày bắt đầu mùa vụ phải trước thời gian thu hoạch dự kiến')) {
                setErrors({ startDate: 'Ngày bắt đầu mùa vụ phải trước thời gian thu hoạch dự kiến' });
            } else if (errorMessage.includes('Ngày bắt đầu mùa vụ phải sau hoặc bằng ngày cam kết được duyệt')) {
                setErrors({ startDate: 'Ngày bắt đầu mùa vụ phải sau hoặc bằng ngày cam kết được duyệt (có thể bắt đầu cùng ngày)' });
            } else if (errorMessage.includes('Thời gian mùa vụ phải trong khoảng 11-12 tháng')) {
                setErrors({ endDate: 'Thời gian mùa vụ phải trong khoảng 11-12 tháng' });
            } else if (errorMessage.includes('Cam kết này đã có mùa vụ')) {
                AppToast.error('Cam kết này đã có mùa vụ. Mỗi cam kết chỉ được tạo một mùa vụ duy nhất.');
            } else if (errorMessage.includes('Thời gian mùa vụ trùng')) {
                AppToast.error('Thời gian mùa vụ trùng với mùa vụ khác trong cùng cam kết.');
            } else {
                AppToast.error(errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            <Card>
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
                    <CardTitle className="flex items-center gap-3 text-orange-800">
                        <Calendar className="w-6 h-6" />
                        Tạo mùa vụ mới
                    </CardTitle>
                    <p className="text-orange-600 text-sm">
                        Tạo mùa vụ mới dựa trên cam kết sản xuất với doanh nghiệp
                    </p>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                    {/* Thông tin cơ bản */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Coffee className="w-5 h-5 text-orange-600" />
                            Thông tin cơ bản
                        </h3>

                        <div>
                            <Label htmlFor="seasonName" className="text-sm font-medium text-gray-700">
                                Tên mùa vụ <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="seasonName"
                                name="seasonName"
                                value={form.seasonName}
                                onChange={handleChange}
                                placeholder="Ví dụ: Mùa vụ 2025, Mùa vụ Xuân-Hè 2025..."
                                className={`mt-1 ${errors.seasonName ? "border-red-500 focus:border-red-500 focus:ring-red-200" : ""}`}
                            />
                            {errors.seasonName && (
                                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.seasonName}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="startDate" className="text-sm font-medium text-gray-700">
                                    Ngày bắt đầu <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    name="startDate"
                                    value={form.startDate}
                                    onChange={handleChange}
                                    className={`mt-1 ${errors.startDate ? "border-red-500 focus:border-red-500 focus:ring-red-200" : ""}`}
                                />
                                {errors.startDate && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.startDate}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="endDate" className="text-sm font-medium text-gray-700">
                                    Ngày kết thúc <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    name="endDate"
                                    value={form.endDate}
                                    onChange={handleChange}
                                    className={`mt-1 ${errors.endDate ? "border-red-500 focus:border-red-500 focus:ring-red-200" : ""}`}
                                />
                                {errors.endDate && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.endDate}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="note" className="text-sm font-medium text-gray-700">
                                Ghi chú
                            </Label>
                            <Textarea
                                id="note"
                                name="note"
                                value={form.note}
                                onChange={handleChange}
                                placeholder="Mô tả thêm về mùa vụ, điều kiện đặc biệt..."
                                className="mt-1"
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Chọn cam kết */}
                    <div className="space-y-4">


                        <div>
                            <Label htmlFor="commitmentId" className="text-sm font-medium text-gray-700">
                                Cam kết <span className="text-red-500">*</span>
                            </Label>

                            {isLoadingCommitments ? (
                                <div className="mt-2 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                    <div className="flex items-center justify-center gap-2 text-gray-500">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                                        Đang tải danh sách cam kết...
                                    </div>
                                </div>
                            ) : availableCommitments.length === 0 ? (
                                <div className="mt-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center gap-2 text-blue-700">
                                        <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-blue-600 text-xs font-bold">ℹ</span>
                                        </div>
                                        <div>
                                            <p className="font-medium">Không có cam kết khả dụng</p>
                                            <p className="text-sm">Tất cả cam kết của bạn đã có mùa vụ hoặc chưa được duyệt.</p>
                                            <p className="text-sm mt-1">
                                                <strong>Lưu ý:</strong> Mỗi cam kết chỉ được tạo một mùa vụ duy nhất.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <select
                                        id="commitmentId"
                                        name="commitmentId"
                                        value={form.commitmentId}
                                        onChange={handleChange}
                                        className={`mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${errors.commitmentId ? "border-red-500" : "border-gray-300"
                                            }`}
                                        aria-label="Chọn cam kết sản xuất"
                                    >
                                        <option value="">-- Chọn cam kết sản xuất --</option>
                                        {availableCommitments.map((commitment) => (
                                            <option key={commitment.commitmentId} value={commitment.commitmentId}>
                                                {commitment.commitmentCode} - {commitment.commitmentName}
                                            </option>
                                        ))}
                                    </select>

                                    {errors.commitmentId && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" />
                                            {errors.commitmentId}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Thông tin cam kết được chọn */}
                        {selectedCommitment && (
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <h4 className="font-medium text-blue-900 mb-2">
                                            Thông tin cam kết đã chọn
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="font-medium text-blue-700">Mã cam kết:</span>
                                                <p className="text-blue-800">{selectedCommitment.commitmentCode}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-blue-700">Tên cam kết:</span>
                                                <p className="text-blue-800">{selectedCommitment.commitmentName}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-blue-700">Doanh nghiệp:</span>
                                                <p className="text-blue-800">{selectedCommitment.companyName}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-blue-700">Tổng giá trị:</span>
                                                <p className="text-blue-800">{selectedCommitment.totalPrice?.toLocaleString()} VNĐ</p>
                                            </div>
                                            {selectedCommitment.approvedAt && (
                                                <div>
                                                    <span className="font-medium text-blue-700">Ngày duyệt:</span>
                                                    <p className="text-blue-800">{new Date(selectedCommitment.approvedAt).toLocaleDateString('vi-VN')}</p>
                                                </div>
                                            )}
                                        </div>

                                        {selectedCommitment.farmingCommitmentDetails && selectedCommitment.farmingCommitmentDetails.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-blue-200">
                                                <h5 className="font-medium text-blue-700 mb-2">Chi tiết sản phẩm:</h5>
                                                <div className="space-y-2">
                                                    {selectedCommitment.farmingCommitmentDetails.map((detail, index) => (
                                                        <div key={index} className="flex items-center justify-between p-2 bg-blue-100 rounded">
                                                            <span className="text-blue-800 text-sm">
                                                                {detail.coffeeTypeName || 'Không xác định'}
                                                            </span>
                                                            <span className="text-blue-700 text-sm font-medium">
                                                                {detail.committedQuantity || 0} kg
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Thông báo cho trường hợp không có approvedAt */}
                                        {!selectedCommitment.approvedAt && (
                                            <div className="mt-3 pt-3 border-t border-red-200">
                                                <h5 className="font-medium text-red-700 mb-2">⚠️ Lưu ý quan trọng:</h5>
                                                <div className="p-2 bg-red-100 rounded border border-red-200">
                                                    <div className="text-xs text-red-700 space-y-1">
                                                        <p><strong>Cam kết chưa được duyệt:</strong> Chỉ có thể tạo mùa vụ từ cam kết đã được business manager duyệt.</p>
                                                        <p><strong>Ngày tạo cam kết:</strong> {selectedCommitment.commitmentDate ? new Date(selectedCommitment.commitmentDate).toLocaleDateString('vi-VN') : 'Không có'}</p>
                                                        <p><strong>Trạng thái:</strong> {selectedCommitment.status}</p>
                                                        <p className="font-medium">❌ Không thể tự động tính thời gian mùa vụ. Vui lòng chọn cam kết đã được duyệt.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Nút submit */}
                    <div className="flex justify-end pt-4 border-t border-gray-200">
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !form.commitmentId || isLoadingCommitments || !selectedCommitment?.approvedAt}
                            className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Đang tạo...
                                </div>
                            ) : (
                                'Tạo mùa vụ'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
