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
  const [selectedStageCode, setSelectedStageCode] = useState<number>(0); // 🔧 CẢI THIỆN: Luôn bắt đầu với 0
  const [selectedStageName, setSelectedStageName] = useState<string>(''); // 🔧 CẢI THIỆN: Luôn bắt đầu với empty string
  const [selectedOrderIndex, setSelectedOrderIndex] = useState<number>(0); // 🔧 CẢI THIỆN: Luôn bắt đầu với 0
  const [availableStages, setAvailableStages] = useState<AvailableStage[]>([]);

  useEffect(() => {
    loadAvailableStages();
  }, []);

  // 🔧 CẢI THIỆN: KHÔNG auto-set stage - để expert chọn stage nào có lỗi
  // useEffect(() => {
  //   if (availableStages.length > 0 && selectedStageCode === 0) {
  //     // Nếu chưa có stage nào được chọn, thử set từ URL hoặc initial values
  //     if (urlStageCode) {
  //       const stageFromUrl = availableStages.find(s => s.code === Number(urlStageCode));
  //       if (stageFromUrl) {
  //         setSelectedStageCode(stageFromUrl.code);
  //         setSelectedStageName(stageFromUrl.name);
  //         setSelectedOrderIndex(stageFromUrl.orderIndex);
  //         console.log('🔧 AUTO-SET: Stage set from URL:', stageFromUrl);
  //       }
  //     } else if (initialStageCode) {
  //       const stageFromInitial = availableStages.find(s => s.code === Number(initialStageCode));
  //       if (stageFromInitial) {
  //         setSelectedStageCode(stageFromInitial.code);
  //         setSelectedStageName(stageFromInitial.name);
  //         setSelectedOrderIndex(stageFromInitial.orderIndex);
  //         console.log('🔧 AUTO-SET: Stage set from initial values:', stageFromInitial);
  //       }
  //     }
  //   }
  // }, [availableStages, urlStageCode, initialStageCode, selectedStageCode]);

  useEffect(() => {
    if (selectedStageCode) {
      loadCriteriaAndReasons();
    } else {
      setLoadingCriteria(false);
    }
  }, [selectedStageCode]);

  // 🔧 CẢI THIỆN: Debug useEffect để kiểm tra selectedStageName
  useEffect(() => {
    console.log('🔍 DEBUG: selectedStageName changed:', {
      selectedStageName,
      selectedStageCode,
      selectedOrderIndex,
      hasValue: selectedStageName && selectedStageName.trim() !== '',
      trimmedValue: selectedStageName?.trim()
    });
  }, [selectedStageName, selectedStageCode, selectedOrderIndex]);

  // 🔧 CẢI THIỆN: Debug useEffect để kiểm tra button state
  useEffect(() => {
    console.log('🔍 DEBUG: Button state check:', {
      loading,
      selectedStageCode,
      selectedStageName,
      criteriaLength: criteria.length,
      hasCriteriaValues: criteriaResults.some(r => r.actualValue > 0),
      buttonDisabled: loading || !selectedStageCode || !selectedStageName || criteria.length === 0 || !criteriaResults.some(r => r.actualValue > 0)
    });
  }, [loading, selectedStageCode, selectedStageName, criteria.length, criteriaResults]);

  const loadAvailableStages = async () => {
    try {
      if (!methodId) {
        console.warn('⚠️ WARNING: No methodId provided, cannot load stages from API');
        setAvailableStages([]);
        return;
      }
      
      console.log('🔍 DEBUG: Loading stages for methodId:', methodId);
      const stagesData = await getProcessingStagesByMethodId(Number(methodId));
      
      if (!stagesData || stagesData.length === 0) {
        console.warn('⚠️ WARNING: No stages found for methodId:', methodId);
        setAvailableStages([]);
        return;
      }
      
      const convertedStages: AvailableStage[] = stagesData
        .filter(stage => !stage.isDeleted) // Chỉ lấy stages chưa bị xóa
        .map(stage => ({
          code: stage.stageId,
          name: stage.stageName,
          orderIndex: stage.orderIndex
        }))
        .sort((a, b) => a.orderIndex - b.orderIndex); // Sắp xếp theo orderIndex
      
      console.log('✅ SUCCESS: Loaded stages from API:', convertedStages);
      setAvailableStages(convertedStages);
      

      console.log('🔧 INFO: Stages loaded, waiting for expert to select stage with issues');
      
    } catch (error) {
      console.error('❌ ERROR: Failed to load stages from API:', error);
      AppToast.error('Không thể tải danh sách giai đoạn từ máy chủ');
      setAvailableStages([]);
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
      console.log('🔍 DEBUG: Loading criteria and reasons for stageId:', {
        selectedStageCode,
        type: typeof selectedStageCode,
        stageName: selectedStageName
      });
      
      const [criteriaData, reasonsData] = await Promise.all([
        getEvaluationCriteriaForStageById(selectedStageCode), // ✅ Đã là number
        getFailureReasonsForStage(selectedStageCode.toString()) // ✅ Convert sang string cho API này
      ]);

      console.log('✅ SUCCESS: Loaded criteria and reasons:', {
        criteriaCount: criteriaData?.length || 0,
        reasonsCount: reasonsData?.length || 0
      });

      // 🔧 CẢI THIỆN: Kiểm tra data từ Backend
      if (!criteriaData || criteriaData.length === 0) {
        console.warn('⚠️ WARNING: No criteria data from Backend for stage:', selectedStageName);
        AppToast.warning(`Chưa có tiêu chí đánh giá cho giai đoạn "${selectedStageName}". Vui lòng liên hệ admin để cấu hình.`);
      }

      if (!reasonsData || reasonsData.length === 0) {
        console.warn('⚠️ WARNING: No failure reasons data from Backend for stage:', selectedStageName);
        AppToast.warning(`Chưa có lý do không đạt cho giai đoạn "${selectedStageName}". Vui lòng liên hệ admin để cấu hình.`);
      }

      setCriteria(criteriaData || []);
      setFailureReasons(reasonsData || []);

      const initialResults: CriteriaResult[] = (criteriaData || []).map(c => ({
        criteria: c,
        actualValue: 0,
        result: 'Pending',
        isPass: false
      }));
      
      setCriteriaResults(initialResults);
    } catch (error: any) {
      console.error('❌ Lỗi load criteria:', error);
      
      // 🔧 CẢI THIỆN: Xử lý lỗi chi tiết hơn
      let errorMessage = 'Không thể tải tiêu chí đánh giá';
      
      if (error.message?.includes('Không tìm thấy tiêu chí')) {
        errorMessage = `Chưa có tiêu chí đánh giá cho giai đoạn "${selectedStageName}". Vui lòng liên hệ admin để cấu hình.`;
      } else if (error.message?.includes('Không tìm thấy lý do')) {
        errorMessage = `Chưa có lý do không đạt cho giai đoạn "${selectedStageName}". Vui lòng liên hệ admin để cấu hình.`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      AppToast.error(errorMessage);
      
      // Reset data khi có lỗi
      setCriteria([]);
      setFailureReasons([]);
      setCriteriaResults([]);
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

      // 🔧 CẢI THIỆN: Kiểm tra selectedStageName có giá trị không
      if (!selectedStageName || selectedStageName.trim() === '') {
        console.error('❌ ERROR: selectedStageName is empty:', selectedStageName);
        AppToast.error('Tên giai đoạn không được để trống. Vui lòng chọn lại giai đoạn.');
        setLoading(false);
        return;
      }

      // 🔧 CẢI THIỆN: Kiểm tra selectedOrderIndex có giá trị không
      if (!selectedOrderIndex || selectedOrderIndex <= 0) {
        console.error('❌ ERROR: selectedOrderIndex is invalid:', selectedOrderIndex);
        AppToast.error('Thứ tự giai đoạn không hợp lệ. Vui lòng chọn lại giai đoạn.');
        setLoading(false);
        return;
      }

      const hasEmptyValues = criteriaResults.some(r => r.actualValue === 0);
      if (hasEmptyValues) {
        AppToast.error('Vui lòng nhập giá trị cho tất cả tiêu chí đánh giá');
        setLoading(false);
        return;
      }
      
      // 🔧 CẢI THIỆN: Debug log để kiểm tra dữ liệu
      console.log('🔍 DEBUG: Stage info before creating comment:', {
        selectedStageCode,
        selectedStageName: selectedStageName.trim(),
        selectedOrderIndex,
        criteriaResultsCount: criteriaResults.length
      });
      
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
        
        // 🔧 CẢI THIỆN: Đảm bảo stageName có giá trị và trim whitespace
        const stageName = selectedStageName.trim();
        let stageFailureFormat = `STAGE_EVALUATION:${stageName}|FAILED_STAGE_ID:${selectedOrderIndex}|FAILED_STAGE_NAME:${stageName}|DETAILS:Đánh giá STAGE "${stageName}" không đạt: ${failedCriteria.length}/${criteriaResults.length} tiêu chí|RECOMMENDATIONS:${recommendations}|EVALUATION_TYPE:Stage_Fail`;
        
        // 🔧 CẢI THIỆN: Debug log để kiểm tra format comment
        console.log('🔍 DEBUG: Created failure comment format:', stageFailureFormat);
        
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
        
        // 🔧 CẢI THIỆN: Comment rõ ràng về việc đánh giá theo stage
        finalComments = `Đánh giá STAGE "${selectedStageName}" thành công: ${passedCriteria.length}/${criteriaResults.length} tiêu chí đạt chuẩn. Chi tiết: ${criteriaDetails}. Điểm tổng: ${overallScore}/100`;
      }
      
      if (comments && comments.trim()) {
        finalComments += ` | Ghi chú: ${comments.trim()}`;
      }

      // 🔧 CẢI THIỆN: Debug log để kiểm tra final comment
      console.log('🔍 DEBUG: Final evaluation comment:', finalComments);

      const evaluationData = {
        BatchId: batchId,
        StageId: selectedStageCode,        // 🔧 CẢI THIỆN: Thêm StageId để đánh giá theo stage
        StageName: selectedStageName,      // 🔧 CẢI THIỆN: Thêm StageName để rõ ràng
        EvaluationResult: evaluationResult || EVALUATION_RESULTS.FAIL,
        Comments: finalComments,
        EvaluatedAt: new Date().toISOString()
      };

      const response = await createProcessingBatchEvaluation(evaluationData);
      
      // 🔧 CẢI THIỆN: Debug log chi tiết response
      console.log('🔍 DEBUG: Full API response:', {
        response,
        hasData: !!response?.data,
        hasWorkflow: !!response?.workflow,
        hasMessage: !!response?.message,
        messageContent: response?.message,
        workflowContent: response?.workflow,
        dataContent: response?.data
      });
      
      // 🔧 CẢI THIỆN: Kiểm tra response chi tiết hơn
      if (response) {
        console.log('✅ SUCCESS: Evaluation created successfully:', response);
        
        // 🔧 CẢI THIỆN: Kiểm tra xem response có chứa thông tin thành công không
        // EvaluationWorkflowResponse có cấu trúc: {data: ProcessingBatchEvaluation, message: string, workflow: {...}}
        const hasSuccessIndicator = 
          response.data || 
          response.workflow ||
          response.message?.toLowerCase().includes('thành công') ||
          response.message?.toLowerCase().includes('success') ||
          (response.workflow && (response.workflow as any).batchStatusUpdated);
        
        console.log('🔍 DEBUG: Success indicator check:', {
          hasData: !!response.data,
          hasWorkflow: !!response.workflow,
          messageIncludesSuccess: response.message?.toLowerCase().includes('thành công'),
          messageIncludesSuccessEn: response.message?.toLowerCase().includes('success'),
          workflowBatchStatusUpdated: response.workflow && (response.workflow as any).batchStatusUpdated,
          finalResult: hasSuccessIndicator
        });
        
        // 🔧 CẢI THIỆN: Nếu có response thì coi như thành công (Backend đã xử lý)
        if (response && (hasSuccessIndicator || Object.keys(response).length > 0)) {
          AppToast.success('Đánh giá thành công!');
          onSuccess();
          onClose();
          
          // 🔧 CẢI THIỆN: KHÔNG reload trang khi thành công - để component tự xử lý
          // window.location.reload();
        } else {
          console.warn('⚠️ WARNING: Response received but no clear success indicator');
          AppToast.success('Đánh giá đã được gửi. Vui lòng kiểm tra kết quả.');
          onSuccess();
          onClose();
        }
      } else {
        console.error('❌ ERROR: No response received from API');
        AppToast.error('Không nhận được phản hồi từ máy chủ. Vui lòng thử lại.');
      }
    } catch (error: any) {
      console.error('❌ Lỗi tạo đánh giá:', error);
      
      // 🔧 CẢI THIỆN: Hiển thị thông báo lỗi chi tiết hơn
      const errorMessage = error.message || 'Tạo đánh giá thất bại';
      AppToast.error(errorMessage);
      
      // 🔧 CẢI THIỆN: Log chi tiết lỗi để debug
      console.error('❌ ERROR Details:', {
        message: error.message,
        stack: error.stack,
        response: error.response,
        status: error.response?.status
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // 🔧 CẢI THIỆN: Kiểm tra xem có stages nào không
  if (availableStages.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Không thể tải giai đoạn</h2>
            <p className="text-gray-600 mb-4">
              {!methodId 
                ? 'Thiếu thông tin phương pháp sơ chế. Vui lòng kiểm tra lại.'
                : 'Không thể tải danh sách giai đoạn từ máy chủ. Vui lòng thử lại sau.'
              }
            </p>
            <Button onClick={onClose} className="w-full">
              Đóng
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Đánh giá tiêu chí - {selectedStageName || 'Chọn giai đoạn'}</h2>
          <Button variant="ghost" onClick={onClose} size="sm" className="hover:bg-gray-100 rounded-md p-2">
            <X className="w-5 h-5 text-gray-500" />
          </Button>
        </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Chọn giai đoạn */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-gray-900">Chọn giai đoạn đánh giá</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Giai đoạn *</Label>
                      <Select 
                        value={selectedStageCode.toString()} 
                        onValueChange={(value) => {
                          const stageId = Number(value);
                          console.log('🔍 DEBUG: Selecting stage with ID:', {
                            value,
                            stageId,
                            type: typeof stageId,
                            isNaN: isNaN(stageId)
                          });
                          
                          // 🔧 CẢI THIỆN: Kiểm tra stageId có hợp lệ không
                          if (isNaN(stageId) || stageId <= 0) {
                            console.error('❌ ERROR: Invalid stageId:', stageId);
                            AppToast.error('ID giai đoạn không hợp lệ. Vui lòng chọn lại.');
                            return;
                          }
                          
                          // 🔧 CẢI THIỆN: Tìm stage dựa vào stageId (code) trong availableStages
                          const stage = availableStages.find(s => s.code === stageId);
                          
                          if (stage) {
                            console.log('🔍 DEBUG: Found stage in availableStages:', {
                              code: stage.code,
                              name: stage.name,
                              orderIndex: stage.orderIndex,
                              stageId: stageId
                            });
                            
                            // 🔧 CẢI THIỆN: Validation kỹ hơn
                            if (!stage.name || stage.name.trim() === '') {
                              console.error('❌ ERROR: Stage name is empty for stage:', stage);
                              AppToast.error('Tên giai đoạn không hợp lệ. Vui lòng chọn giai đoạn khác.');
                              return;
                            }
                            
                            if (!stage.orderIndex || stage.orderIndex <= 0) {
                              console.error('❌ ERROR: Stage orderIndex is invalid:', stage.orderIndex);
                              AppToast.error('Thứ tự giai đoạn không hợp lệ. Vui lòng chọn giai đoạn khác.');
                              return;
                            }
                            
                            // 🔧 CẢI THIỆN: Set các giá trị từ stage được tìm thấy
                            setSelectedStageCode(stage.code);        // stageId
                            setSelectedStageName(stage.name);       // stageName
                            setSelectedOrderIndex(stage.orderIndex); // orderIndex
                            updateURL(stage.code);
                            
                            console.log('✅ SUCCESS: Stage selected successfully:', {
                              stageId: stage.code,
                              stageName: stage.name,
                              orderIndex: stage.orderIndex
                            });
                            
                            // 🔧 CẢI THIỆN: Kiểm tra xem có load được criteria không
                            if (stage.code) {
                              console.log('🔍 DEBUG: Will load criteria for stageId:', stage.code);
                            }
                            
                            // 🔧 CẢI THIỆN: Debug log để kiểm tra state update
                            setTimeout(() => {
                              console.log('🔍 DEBUG: State after stage selection:', {
                                selectedStageCode: stage.code,
                                selectedStageName: stage.name,
                                selectedOrderIndex: stage.orderIndex
                              });
                            }, 100);
                          } else {
                            console.error('❌ ERROR: Stage not found in availableStages for stageId:', stageId);
                            console.error('❌ ERROR: Available stages:', availableStages);
                            AppToast.error(`Không tìm thấy thông tin giai đoạn với ID: ${stageId}. Vui lòng chọn lại.`);
                          }
                        }}
                      >
                        <SelectTrigger className="h-10 border border-gray-300 focus:border-blue-500">
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
                      onClick={async () => {
                        // 🔧 CẢI THIỆN: "Đạt cả Batch" không cần chọn stage cụ thể
                        try {
                          setLoading(true);
                          
                          // Tạo comment đạt batch (không cần stage cụ thể)
                          const finalComments = `Đánh giá BATCH thành công: Tất cả giai đoạn đạt chuẩn. Điểm tổng: 100/100`;
                          
                          // 🔧 CẢI THIỆN: Tạo evaluation data cho cả batch với status Pass
                          const evaluationData = {
                            BatchId: batchId,
                            EvaluationResult: EVALUATION_RESULTS.PASS,
                            Comments: finalComments,
                            EvaluatedAt: new Date().toISOString()
                          };
                          
                          console.log('🔍 DEBUG: Creating PASS evaluation for batch:', evaluationData);
                          
                          const response = await createProcessingBatchEvaluation(evaluationData);
                          
                          if (response) {
                            console.log('✅ SUCCESS: PASS evaluation created successfully:', response);
                            AppToast.success('Đã đánh giá đạt BATCH và cập nhật trạng thái!');
                            onSuccess();
                            onClose();
                          } else {
                            console.error('❌ ERROR: No response received from API');
                            AppToast.error('Không nhận được phản hồi từ máy chủ. Vui lòng thử lại.');
                          }
                          
                        } catch (error: any) {
                          console.error('❌ Lỗi tạo đánh giá đạt:', error);
                          const errorMessage = error.message || 'Tạo đánh giá đạt thất bại';
                          AppToast.error(errorMessage);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 h-10 font-medium"
                      disabled={loading} // 🔧 CẢI THIỆN: Luôn enable, chỉ disable khi loading
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {loading ? 'Đang xử lý...' : 'Đạt cả Batch'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

           {/* Tiêu chí đánh giá */}
           {selectedStageCode ? (
             <>
               {loadingCriteria ? (
                 <div className="flex items-center justify-center py-8">
                   <div className="text-center">
                     <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
                     <span className="text-gray-600">Đang tải tiêu chí đánh giá...</span>
                   </div>
                 </div>
               ) : (
                 <>
                   {/* Danh sách tiêu chí */}
                   <Card className="border border-gray-200">
                     <CardHeader className="pb-3">
                       <CardTitle className="text-lg text-gray-900">Danh sách tiêu chí</CardTitle>
                     </CardHeader>
                     <CardContent>
                       <div className="space-y-4">
                         {criteria.map((criterion, index) => (
                           <div key={criterion.criteriaId} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                             <div className="flex items-center justify-between mb-3">
                               <Label className="font-medium text-gray-900">{criterion.criteriaName}</Label>
                               <Badge variant="outline" className="text-xs">
                                 {criterion.criteriaType}
                               </Badge>
                             </div>
                             
                             <p className="text-gray-600 mb-4 text-sm">{criterion.description}</p>
                             
                             <div className="grid grid-cols-3 gap-4">
                               <div>
                                 <Label className="text-sm font-medium text-gray-700 mb-2 block">Giá trị chuẩn</Label>
                                 <div className="text-sm text-gray-600 bg-white p-2 rounded border border-gray-200">
                                   {criterion.minValue && criterion.maxValue 
                                     ? `${criterion.minValue} - ${criterion.maxValue} ${criterion.unit}`
                                     : criterion.targetValue 
                                       ? `${criterion.targetValue} ${criterion.unit}`
                                       : 'Không có'
                                   }
                                 </div>
                               </div>
                               
                               <div>
                                 <Label className="text-sm font-medium text-gray-700 mb-2 block">Giá trị thực tế *</Label>
                                 <Input
                                   type="number"
                                   step="0.01"
                                   min="0"
                                   value={criteriaResults[index]?.actualValue || ''}
                                   onChange={(e) => {
                                     const value = e.target.value;
                                     // Chỉ cho phép số và dấu chấm thập phân
                                     if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                       handleCriteriaValueChange(index, parseFloat(value) || 0);
                                     }
                                   }}
                                   onKeyPress={(e) => {
                                     // Chặn hoàn toàn việc nhập chữ
                                     if (!/[\d\.]/.test(e.key)) {
                                       e.preventDefault();
                                     }
                                   }}
                                   onPaste={(e) => {
                                     // Chặn paste text không phải số
                                     e.preventDefault();
                                     const pastedText = e.clipboardData.getData('text');
                                     if (/^\d*\.?\d*$/.test(pastedText)) {
                                       const input = e.target as HTMLInputElement;
                                       input.value = pastedText;
                                       handleCriteriaValueChange(index, parseFloat(pastedText) || 0);
                                     }
                                   }}
                                   onDrop={(e) => {
                                     // Chặn drop text không phải số
                                     e.preventDefault();
                                   }}
                                   onInput={(e) => {
                                     // Biện pháp bảo vệ cuối cùng - chỉ giữ lại số
                                     const input = e.target as HTMLInputElement;
                                     const value = input.value;
                                     const numericValue = value.replace(/[^\d\.]/g, '');
                                     if (value !== numericValue) {
                                       input.value = numericValue;
                                       handleCriteriaValueChange(index, parseFloat(numericValue) || 0);
                                     }
                                   }}
                                   placeholder={`Nhập giá trị ${criterion.unit}`}
                                   className="h-9 border border-gray-300 focus:border-blue-500"
                                 />
                               </div>
                               
                               <div>
                                 <Label className="text-sm font-medium text-gray-700 mb-2 block">Đơn vị</Label>
                                 <div className="text-sm text-gray-600 bg-white p-2 rounded border border-gray-200">{criterion.unit}</div>
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     </CardContent>
                   </Card>

                   {/* Tiêu chí không đạt */}
                   {criteriaResults.some(r => !r.isPass) && (
                     <Card className="border border-red-200">
                       <CardHeader className="pb-3">
                         <CardTitle className="text-lg text-red-800 flex items-center gap-2">
                           <XCircle className="h-5 w-5 text-red-500" />
                           Tiêu chí không đạt
                         </CardTitle>
                       </CardHeader>
                       <CardContent>
                         <div className="grid grid-cols-2 gap-3">
                           {criteriaResults
                             .filter(r => !r.isPass)
                             .map((result) => (
                               <div key={result.criteria.criteriaId} className="flex items-center space-x-2 p-2 bg-red-50 rounded border border-red-200">
                                 <Checkbox
                                   id={result.criteria.criteriaId}
                                   checked={selectedFailedCriteria.includes(result.criteria.criteriaName)}
                                   onCheckedChange={() => handleFailedCriteriaToggle(result.criteria.criteriaName)}
                                 />
                                 <Label htmlFor={result.criteria.criteriaId} className="text-sm text-red-800">
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
                     <Card className="border border-orange-200">
                       <CardHeader className="pb-3">
                         <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
                           <AlertTriangle className="h-5 w-5 text-orange-500" />
                           Lý do không đạt
                         </CardTitle>
                       </CardHeader>
                       <CardContent>
                         <div className="grid grid-cols-2 gap-3">
                           {failureReasons.map((reason) => (
                             <div key={reason.reasonId} className="flex items-center space-x-2 p-2 bg-orange-50 rounded border border-orange-200">
                               <Checkbox
                                 id={reason.reasonId}
                                 checked={selectedFailureReasons.includes(reason.reasonName)}
                                 onCheckedChange={() => handleFailureReasonToggle(reason.reasonName)}
                               />
                               <Label htmlFor={reason.reasonId} className="text-sm text-orange-800">
                                 {reason.reasonName}
                               </Label>
                             </div>
                           ))}
                         </div>
                       </CardContent>
                     </Card>
                   )}

                   {/* Kết quả đánh giá */}
                   <Card className="border border-gray-200">
                     <CardHeader className="pb-3">
                       <CardTitle className="text-lg text-gray-900">Kết quả đánh giá</CardTitle>
                     </CardHeader>
                     <CardContent>
                       <div className="space-y-4">
                         <div className="grid grid-cols-2 gap-6">
                           <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                             <Label className="text-sm font-medium text-gray-700 mb-2 block">Điểm số</Label>
                             <div className="text-2xl font-bold text-blue-600 mb-2">
                               {overallScore.toFixed(1)}/100
                             </div>
                             <div className="w-full bg-gray-200 rounded-full h-2">
                               <div 
                                 className={`h-2 rounded-full ${
                                   overallScore >= 80 ? 'bg-green-500' :
                                   overallScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                 }`}
                                 style={{ width: `${overallScore}%` }}
                               />
                             </div>
                           </div>
                           
                           <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                             <Label className="text-sm font-medium text-gray-700 mb-2 block">Tiêu chí đạt</Label>
                             <div className="text-2xl font-bold text-green-600 mb-2">
                               {criteriaResults.filter(r => r.isPass).length}/{criteriaResults.length}
                             </div>
                             <div className="text-sm text-gray-600">
                               {criteriaResults.length > 0 ? 
                                 `${Math.round((criteriaResults.filter(r => r.isPass).length / criteriaResults.length) * 100)}% đạt chuẩn` : 
                                 'Chưa có dữ liệu'
                               }
                             </div>
                           </div>
                         </div>
                         
                         <div>
                           <Label className="text-sm font-medium text-gray-700 mb-2 block">Ghi chú bổ sung</Label>
                           <Textarea
                             value={comments}
                             onChange={(e) => setComments(e.target.value)}
                             placeholder="Nhập ghi chú bổ sung (nếu có)..."
                             rows={3}
                             className="border border-gray-300 focus:border-blue-500"
                           />
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                 </>
               )}
             </>
           ) : (
             // 🔧 CẢI THIỆN: Không hiển thị gì khi chưa chọn stage - đã có card hướng dẫn ở trên
             null
           )}

           {/* Buttons */}
           <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
             <Button type="button" variant="outline" onClick={onClose} className="px-6 py-2 h-9">
               Hủy
             </Button>
             <Button 
               type="submit" 
               disabled={loading || !selectedStageCode || !selectedStageName || criteria.length === 0}
               className={`px-6 py-2 h-9 ${
                 !selectedStageCode || !selectedStageName || criteria.length === 0 
                   ? 'opacity-50 cursor-not-allowed bg-gray-400 text-white' 
                   : 'bg-red-600 hover:bg-red-700 text-white'
               }`}
             >
               {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
               {!selectedStageCode || !selectedStageName ? 'Chọn giai đoạn trước' : 
                criteria.length === 0 ? 'Đang tải tiêu chí...' : 'Đánh giá Stage thất bại'}
             </Button>
           </div>
          </form>
        </div>
      </div>
    );
}

