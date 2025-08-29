'use client';

import { useEffect, useState } from 'react';
import {
    ExpertAdvice,
    getExpertAdviceById,
    softDeleteExpertAdvice,
    updateExpertAdvice,
} from '@/lib/api/expertAdvice';
import { toast } from 'sonner';
import {
    X,
    Edit2,
    Trash2,
    FileText,
    User2,
    CalendarClock,
    Save,
    XCircle,
    Paperclip,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Props = {
    advices: ExpertAdvice[];
    onClose: () => void;
};

export default function AdviceHistoryDialog({ advices, onClose }: Props) {
    const [fullAdvices, setFullAdvices] = useState<ExpertAdvice[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<ExpertAdvice>>({});

    // Hàm chuyển đổi loại phản hồi sang tiếng Việt
    const getResponseTypeInVietnamese = (responseType: string): string => {
        const typeMap: Record<string, string> = {
            'Corrective': 'Khắc phục',
            'Preventive': 'Phòng ngừa',
            'Observation': 'Nhận xét',
            'Advisory': 'Tư vấn',
            'Emergency': 'Khẩn cấp',
            'Routine': 'Thường xuyên',
            'corrective': 'Khắc phục',
            'preventive': 'Phòng ngừa',
            'observation': 'Nhận xét',
            'advisory': 'Tư vấn',
            'emergency': 'Khẩn cấp',
            'routine': 'Thường xuyên'
        };

        return typeMap[responseType] || responseType;
    };

    useEffect(() => {
        const fetchAllDetails = async () => {
            try {
                const results = await Promise.all(advices.map((a) => getExpertAdviceById(a.adviceId)));
                setFullAdvices(results);
            } catch {
                toast.error('Không thể tải đầy đủ chi tiết phản hồi.');
            } finally {
                setLoading(false);
            }
        };

        fetchAllDetails();
    }, [advices]);

    const handleStartEdit = (advice: ExpertAdvice) => {
        setEditingId(advice.adviceId);
        setEditForm({
            responseType: advice.responseType,
            adviceSource: advice.adviceSource,
            adviceText: advice.adviceText,
            attachedFileUrl: editForm.attachedFileUrl?.trim() || undefined
        });
    };

    const handleSaveEdit = async (adviceId: string) => {
        try {
            await updateExpertAdvice(adviceId, {
                responseType: editForm.responseType!,
                adviceSource: editForm.adviceSource!,
                adviceText: editForm.adviceText,
                attachedFileUrl: editForm.attachedFileUrl,
            });

            toast.success('Cập nhật thành công.');
            setEditingId(null);

            const updated = await getExpertAdviceById(adviceId);
            setFullAdvices((prev) => prev.map((a) => (a.adviceId === adviceId ? updated : a)));
        } catch {
            toast.error('Cập nhật thất bại.');
        }
    };

    const handleDelete = async (adviceId: string) => {
        if (!confirm('Bạn có chắc muốn xoá phản hồi này?')) return;

        try {
            await softDeleteExpertAdvice(adviceId);
            toast.success('Đã xoá phản hồi.');
            setFullAdvices((prev) => prev.filter((a) => a.adviceId !== adviceId));
        } catch {
            toast.error('Xoá thất bại.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto relative">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-orange-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">Lịch sử phản hồi</h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </Button>
                </div>

                {loading ? (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="text-gray-500">Đang tải chi tiết phản hồi...</p>
                    </div>
                ) : fullAdvices.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">Chưa có phản hồi nào</p>
                        <p className="text-gray-400 text-sm">Chưa có phản hồi nào cho báo cáo này</p>
                    </div>
                ) : (
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                        {fullAdvices.map((advice) => (
                            <Card key={advice.adviceId} className="hover:shadow-md transition-shadow duration-200">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <User2 className="w-4 h-4" />
                                                    <span className="font-medium text-gray-800">{advice.expertName}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <CalendarClock className="w-4 h-4" />
                                                    <span>{new Date(advice.createdAt).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {editingId === advice.adviceId ? null : (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleStartEdit(advice)}
                                                        className="text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                                                    >
                                                        <Edit2 size={16} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(advice.adviceId)}
                                                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {editingId === advice.adviceId ? (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại phản hồi</label>
                                                    <Input
                                                        name="responseType"
                                                        value={editForm.responseType || ''}
                                                        onChange={(e) => setEditForm({ ...editForm, responseType: e.target.value })}
                                                        className="w-full"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nguồn tư vấn</label>
                                                    <Input
                                                        name="adviceSource"
                                                        value={editForm.adviceSource || ''}
                                                        onChange={(e) => setEditForm({ ...editForm, adviceSource: e.target.value })}
                                                        className="w-full"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung</label>
                                                <Textarea
                                                    name="adviceText"
                                                    value={editForm.adviceText || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, adviceText: e.target.value })}
                                                    className="w-full"
                                                    rows={4}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Tệp đính kèm (URL)</label>
                                                <Input
                                                    name="attachedFileUrl"
                                                    value={editForm.attachedFileUrl || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, attachedFileUrl: e.target.value })}
                                                    className="w-full"
                                                    placeholder="https://example.com/file.pdf"
                                                />
                                            </div>
                                            <div className="flex gap-3 pt-2">
                                                <Button
                                                    onClick={() => handleSaveEdit(advice.adviceId)}
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    <Save size={16} className="mr-2" />
                                                    Lưu thay đổi
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setEditingId(null)}
                                                >
                                                    <XCircle size={16} className="mr-2" />
                                                    Huỷ
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-gray-600">Loại:</span>
                                                <span className="font-medium text-gray-800">
                                                    {getResponseTypeInVietnamese(advice.responseType)}
                                                </span>
                                                <span className="text-gray-400">•</span>
                                                <span className="text-gray-600">Nguồn:</span>
                                                <span className="font-medium text-gray-800">{advice.adviceSource}</span>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <p className="text-gray-800 whitespace-pre-wrap">
                                                    {advice.adviceText || '(Không có nội dung)'}
                                                </p>
                                            </div>
                                            {advice.attachedFileUrl && (
                                                <div className="pt-2">
                                                    <a
                                                        href={advice.attachedFileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-800 font-medium"
                                                    >
                                                        <Paperclip size={16} />
                                                        Xem tệp đính kèm
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
