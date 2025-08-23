"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  getEvaluationCriteriaForStage, 
  getEvaluationCriteriaForStageById,
  getFailureReasonsForStage,
  createProcessingBatchEvaluation,
  EvaluationCriteria,
  FailureReason,
  EVALUATION_RESULTS
} from '@/lib/api/processingBatchEvaluations';
import { getProcessingStagesByMethodId, ProcessingStage } from '@/lib/api/processingStages';
import { AppToast } from '@/components/ui/AppToast';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';

interface EvaluationCriteriaFormProps {
  batchId: string;
  methodId?: string;
  stageCode?: string;
  stageName?: string;
  orderIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CriteriaResult {
  criteria: EvaluationCriteria;
  actualValue: number;
  result: string;
  isPass: boolean;
}

interface AvailableStage {
  code: number;
  name: string;
  orderIndex: number;
}

export default function EvaluationCriteriaForm({
  batchId,
  methodId,
  stageCode: initialStageCode,
  stageName: initialStageName,
  orderIndex: initialOrderIndex,
  isOpen,
  onClose,
  onSuccess
}: EvaluationCriteriaFormProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const [loading, setLoading] = useState(false);
  const [loadingCriteria, setLoadingCriteria] = useState(false);
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([]);
  const [failureReasons, setFailureReasons] = useState<FailureReason[]>([]);
  const [criteriaResults, setCriteriaResults] = useState<CriteriaResult[]>([]);
  const [selectedFailureReasons, setSelectedFailureReasons] = useState<string[]>([]);
  const [selectedFailedCriteria, setSelectedFailedCriteria] = useState<string[]>([]);
  const [overallScore, setOverallScore] = useState<number>(0);
  const [evaluationResult, setEvaluationResult] = useState<string>(EVALUATION_RESULTS.PASS);
  const [comments, setComments] = useState<string>('');

  const urlStageCode = searchParams.get('stage');
  const [selectedStageCode, setSelectedStageCode] = useState<number>(
    urlStageCode ? Number(urlStageCode) : initialStageCode ? Number(initialStageCode) : 0
  );
  const [selectedStageName, setSelectedStageName] = useState<string>(initialStageName || '');
  const [selectedOrderIndex, setSelectedOrderIndex] = useState<number>(initialOrderIndex || 1);
  const [availableStages, setAvailableStages] = useState<AvailableStage[]>([]);

  useEffect(() => {
    loadAvailableStages();
  }, []);

  useEffect(() => {
    if (selectedStageCode) {
      loadCriteriaAndReasons();
    } else {
      setLoadingCriteria(false);
    }
  }, [selectedStageCode]);

  const loadAvailableStages = async () => {
    try {
      if (!methodId) {
        const fallbackStages: AvailableStage[] = [
          { code: 1, name: 'Thu hoạch', orderIndex: 1 },
          { code: 2, name: 'Sấy khô', orderIndex: 2 },
          { code: 3, name: 'Xát vỏ trấu', orderIndex: 3 },
          { code: 4, name: 'Phân loại', orderIndex: 4 },
          { code: 5, name: 'Lên men', orderIndex: 5 },
          { code: 6, name: 'Rửa sạch', orderIndex: 6 }
        ];
        setAvailableStages(fallbackStages);
        return;
      }
      
      const stagesData = await getProcessingStagesByMethodId(Number(methodId));
      const convertedStages: AvailableStage[] = stagesData.map(stage => ({
        code: stage.stageId,
        name: stage.stageName,
        orderIndex: stage.orderIndex
      }));
      
      setAvailableStages(convertedStages);
    } catch (error) {
      console.error('❌ Lỗi load stages:', error);
      const fallbackStages: AvailableStage[] = [
        { code: 1, name: 'Thu hoạch', orderIndex: 1 },
        { code: 2, name: 'Sấy khô', orderIndex: 2 },
        { code: 3, name: 'Xát vỏ trấu', orderIndex: 3 },
        { code: 4, name: 'Phân loại', orderIndex: 4 },
        { code: 5, name: 'Lên men', orderIndex: 5 },
        { code: 6, name: 'Rửa sạch', orderIndex: 6 }
      ];
      setAvailableStages(fallbackStages);
    }
  };

  const updateURL = (stageCode: number) => {
    const params = new URLSearchParams(searchParams);
    if (stageCode) {
      params.set('stage', stageCode.toString());
    } else {
      params.delete('stage');
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const loadCriteriaAndReasons = async () => {
    if (!selectedStageCode) return;
    
    setLoadingCriteria(true);
    try {
      const [criteriaData, reasonsData] = await Promise.all([
        getEvaluationCriteriaForStageById(selectedStageCode),
        getFailureReasonsForStage(selectedStageCode.toString())
      ]);

      setCriteria(criteriaData);
      setFailureReasons(reasonsData);

      const initialResults: CriteriaResult[] = criteriaData.map(c => ({
        criteria: c,
        actualValue: 0,
        result: 'Pending',
        isPass: false
      }));
      
      setCriteriaResults(initialResults);
    } catch (error) {
      console.error('❌ Lỗi load criteria:', error);
      AppToast.error('Không thể tải tiêu chí đánh giá');
    } finally {
      setLoadingCriteria(false);
    }
  };

  const handleCriteriaValueChange = (index: number, value: number) => {
    const updatedResults = [...criteriaResults];
    updatedResults[index].actualValue = value;
    
    const criterion = updatedResults[index].criteria;
    let isPass = true;
    let result = 'Pass';
    
    if (value > 0) {
      if (criterion.minValue !== undefined && criterion.maxValue !== undefined) {
        if (value < criterion.minValue || value > criterion.maxValue) {
          isPass = false;
          result = 'Fail';
        }
      } else if (criterion.targetValue !== undefined) {
        const tolerance = criterion.targetValue * 0.05;
        if (Math.abs(value - criterion.targetValue) > tolerance) {
          isPass = false;
          result = 'Fail';
        }
      }
    } else {
      result = 'Pending';
      isPass = false;
    }
    
    updatedResults[index].result = result;
    updatedResults[index].isPass = isPass;
    setCriteriaResults(updatedResults);
    calculateScore(updatedResults);
  };

  const calculateScore = (results: CriteriaResult[]) => {
    let totalScore = 0;
    let totalWeight = 0;

    results.forEach(result => {
      const weight = result.criteria.weight || 0;
      totalWeight += weight;
      
      if (result.isPass) {
        totalScore += weight * 100;
      } else {
        totalScore += weight * 0;
      }
    });

    const overallScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    setOverallScore(overallScore);
    
    if (overallScore >= 80) {
      setEvaluationResult(EVALUATION_RESULTS.PASS);
    } else if (overallScore >= 60) {
      setEvaluationResult(EVALUATION_RESULTS.NEEDS_IMPROVEMENT);
    } else {
      setEvaluationResult(EVALUATION_RESULTS.FAIL);
    }
  };

  const handleFailureReasonToggle = (reasonName: string) => {
    setSelectedFailureReasons(prev => 
      prev.includes(reasonName) 
        ? prev.filter(r => r !== reasonName)
        : [...prev, reasonName]
    );
  };

  const handleFailedCriteriaToggle = (criteriaName: string) => {
    setSelectedFailedCriteria(prev => 
      prev.includes(criteriaName) 
        ? prev.filter(c => c !== criteriaName)
        : [...prev, criteriaName]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!selectedStageCode) {
        AppToast.error('Vui lòng chọn giai đoạn cần đánh giá');
        setLoading(false);
        return;
      }

      const hasEmptyValues = criteriaResults.some(r => r.actualValue === 0);
      if (hasEmptyValues) {
        AppToast.error('Vui lòng nhập giá trị cho tất cả tiêu chí đánh giá');
        setLoading(false);
        return;
      }
      
      const failedCriteria = criteriaResults.filter(r => !r.isPass);
      let finalComments = '';
      
      if (failedCriteria.length > 0) {
        const failedCriteriaList = failedCriteria.map(c => ({
          criteriaId: c.criteria.criteriaId,
          criteriaName: c.criteria.criteriaName,
          actualValue: c.actualValue,
          expectedValue: c.criteria.minValue && c.criteria.maxValue 
            ? `${c.criteria.minValue}-${c.criteria.maxValue}` 
            : c.criteria.targetValue?.toString() || 'N/A',
          unit: c.criteria.unit,
          failureReason: 'Không đạt tiêu chuẩn'
        }));

        const failureDetails = `Đánh giá không đạt: ${failedCriteria.length}/${criteriaResults.length} tiêu chí`;
        const recommendations = 'Cần cải thiện các tiêu chí không đạt để đảm bảo chất lượng';
        
        let stageFailureFormat = `FAILED_STAGE_ID:${selectedOrderIndex}|FAILED_STAGE_NAME:${selectedStageName}|DETAILS:${failureDetails}|RECOMMENDATIONS:${recommendations}`;
        
        if (failedCriteriaList.length > 0) {
          const criteriaStr = failedCriteriaList.map(c => 
            `${c.criteriaId}:${c.criteriaName}:${c.actualValue}:${c.expectedValue}:${c.unit}:${c.failureReason}`
          ).join(';');
          stageFailureFormat += `|FAILED_CRITERIA:${criteriaStr}`;
        }
        
        if (selectedFailureReasons.length > 0) {
          stageFailureFormat += `|FAILURE_REASONS:${selectedFailureReasons.join(';')}`;
        }
        
        stageFailureFormat += `|OVERALL_SCORE:${overallScore}`;
        
        finalComments = stageFailureFormat;
      } else {
        const passedCriteria = criteriaResults.filter(r => r.isPass);
        const criteriaDetails = passedCriteria.map(c => 
          `${c.criteria.criteriaName}: ${c.actualValue} ${c.criteria.unit}`
        ).join(', ');
        
        finalComments = `Đánh giá thành công: ${passedCriteria.length}/${criteriaResults.length} tiêu chí đạt chuẩn. Chi tiết: ${criteriaDetails}. Điểm tổng: ${overallScore}/100`;
      }
      
      if (comments && comments.trim()) {
        finalComments += ` | Ghi chú: ${comments.trim()}`;
      }

      const evaluationData = {
        BatchId: batchId,
        EvaluationResult: evaluationResult || EVALUATION_RESULTS.FAIL,
        Comments: finalComments,
        EvaluatedAt: new Date().toISOString()
      };

      const response = await createProcessingBatchEvaluation(evaluationData);
      
      if (response) {
        AppToast.success('Đánh giá thành công!');
        onSuccess();
        onClose();
        
        // Reload trang sau khi đánh giá thành công
        window.location.reload();
      }
    } catch (error: any) {
      console.error('❌ Lỗi tạo đánh giá:', error);
      AppToast.error(error.message || 'Tạo đánh giá thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Đánh giá tiêu chí - {selectedStageName || 'Chọn giai đoạn'}</h2>
          <Button variant="ghost" onClick={onClose} size="sm">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Chọn giai đoạn */}
          <Card>
            <CardHeader>
              <CardTitle>Chọn giai đoạn đánh giá</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <Label>Giai đoạn *</Label>
                    <Select 
                      value={selectedStageCode.toString()} 
                      onValueChange={(value) => {
                        const stage = availableStages.find(s => s.code === Number(value));
                        if (stage) {
                          setSelectedStageCode(stage.code);
                          setSelectedStageName(stage.name);
                          setSelectedOrderIndex(stage.orderIndex);
                          updateURL(stage.code);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn giai đoạn cần đánh giá" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStages.map((stage) => (
                          <SelectItem key={stage.code} value={stage.code.toString()}>
                            {stage.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    type="button"
                    onClick={() => {
                      if (!selectedStageCode) {
                        AppToast.error('Vui lòng chọn giai đoạn trước');
                        return;
                      }
                      
                      // Tự động đánh giá đạt stage này
                      const autoResults = criteria.map(c => ({
                        criteria: c,
                        actualValue: c.minValue || c.targetValue || 100,
                        result: 'Pass',
                        isPass: true
                      }));
                      setCriteriaResults(autoResults);
                      setOverallScore(100);
                      setEvaluationResult(EVALUATION_RESULTS.PASS);
                      
                      // Tạo comment đạt toàn bộ
                      const passedCriteria = autoResults.filter(r => r.isPass);
                      const criteriaDetails = passedCriteria.map(c => 
                        `${c.criteria.criteriaName}: ${c.actualValue} ${c.criteria.unit}`
                      ).join(', ');
                      
                      const finalComments = `Đánh giá thành công: ${passedCriteria.length}/${autoResults.length} tiêu chí đạt chuẩn. Chi tiết: ${criteriaDetails}. Điểm tổng: 100/100`;
                      setComments(finalComments);
                      
                      AppToast.success(`Đã đánh giá đạt giai đoạn: ${selectedStageName}`);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Đạt
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tiêu chí đánh giá */}
          {selectedStageCode && (
            <>
              {loadingCriteria ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Đang tải tiêu chí đánh giá...</span>
                </div>
              ) : (
                <>
                  {/* Danh sách tiêu chí */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Danh sách tiêu chí</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {criteria.map((criterion, index) => (
                          <div key={criterion.criteriaId} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <Label className="font-medium">{criterion.criteriaName}</Label>
                              <Badge variant="outline">{criterion.criteriaType}</Badge>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3">{criterion.description}</p>
                            
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <Label>Giá trị chuẩn</Label>
                                <div className="text-sm text-gray-600">
                                  {criterion.minValue && criterion.maxValue 
                                    ? `${criterion.minValue} - ${criterion.maxValue} ${criterion.unit}`
                                    : criterion.targetValue 
                                      ? `${criterion.targetValue} ${criterion.unit}`
                                      : 'Không có'
                                  }
                                </div>
                              </div>
                              
                              <div>
                                <Label>Giá trị thực tế *</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={criteriaResults[index]?.actualValue || ''}
                                  onChange={(e) => handleCriteriaValueChange(index, parseFloat(e.target.value) || 0)}
                                  placeholder={`Nhập giá trị ${criterion.unit}`}
                                />
                              </div>
                              
                              <div>
                                <Label>Đơn vị</Label>
                                <div className="text-sm text-gray-600">{criterion.unit}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tiêu chí không đạt */}
                  {criteriaResults.some(r => !r.isPass) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <XCircle className="h-5 w-5 text-red-500" />
                          Tiêu chí không đạt
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          {criteriaResults
                            .filter(r => !r.isPass)
                            .map((result) => (
                              <div key={result.criteria.criteriaId} className="flex items-center space-x-2">
                                <Checkbox
                                  id={result.criteria.criteriaId}
                                  checked={selectedFailedCriteria.includes(result.criteria.criteriaName)}
                                  onCheckedChange={() => handleFailedCriteriaToggle(result.criteria.criteriaName)}
                                />
                                <Label htmlFor={result.criteria.criteriaId} className="text-sm">
                                  {result.criteria.criteriaName} ({result.actualValue} {result.criteria.unit})
                                </Label>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Lý do không đạt */}
                  {criteriaResults.some(r => !r.isPass) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                          Lý do không đạt
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          {failureReasons.map((reason) => (
                            <div key={reason.reasonId} className="flex items-center space-x-2">
                              <Checkbox
                                id={reason.reasonId}
                                checked={selectedFailureReasons.includes(reason.reasonName)}
                                onCheckedChange={() => handleFailureReasonToggle(reason.reasonName)}
                              />
                              <Label htmlFor={reason.reasonId} className="text-sm">
                                {reason.reasonName}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Kết quả đánh giá */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Kết quả đánh giá</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Điểm số</Label>
                            <div className="text-2xl font-bold text-blue-600">
                              {overallScore.toFixed(1)}/100
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  overallScore >= 80 ? 'bg-green-500' :
                                  overallScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${overallScore}%` }}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label>Tiêu chí đạt</Label>
                            <div className="text-2xl font-bold text-green-600">
                              {criteriaResults.filter(r => r.isPass).length}/{criteriaResults.length}
                            </div>
                            <div className="text-sm text-gray-500">
                              {criteriaResults.length > 0 ? 
                                `${Math.round((criteriaResults.filter(r => r.isPass).length / criteriaResults.length) * 100)}% đạt chuẩn` : 
                                'Chưa có dữ liệu'
                              }
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <Label>Ghi chú bổ sung</Label>
                          <Textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Nhập ghi chú bổ sung (nếu có)..."
                            rows={3}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading || !selectedStageCode}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Tạo đánh giá
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
