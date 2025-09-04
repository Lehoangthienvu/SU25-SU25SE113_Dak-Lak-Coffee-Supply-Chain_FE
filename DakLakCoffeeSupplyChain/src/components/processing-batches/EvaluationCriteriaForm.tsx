  "use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  createProcessingBatchEvaluation,
  EVALUATION_RESULTS
} from '@/lib/api/processingBatchEvaluations';
import { 
  getProcessingBatchCriteria,
  ProcessingBatchCriteria
} from '@/lib/api/systemConfiguration';
import { 
  getProcessingStagesByMethodId,
  ProcessingStage
} from '@/lib/api/processingStages';
import { AppToast } from '@/components/ui/AppToast';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { FiSettings } from 'react-icons/fi';

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
  criteria: ProcessingBatchCriteria;
  actualValue: number;
  result: string;
  isPass: boolean;
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
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const [loading, setLoading] = useState(false);
  const [loadingCriteria, setLoadingCriteria] = useState(false);
  const [criteria, setCriteria] = useState<ProcessingBatchCriteria[]>([]);
  const [criteriaResults, setCriteriaResults] = useState<CriteriaResult[]>([]);
  const [overallScore, setOverallScore] = useState<number>(0);
  const [evaluationResult, setEvaluationResult] = useState<string>(EVALUATION_RESULTS.PASS);
  const [comments, setComments] = useState<string>('');
  const [showBatchPassConfirm, setShowBatchPassConfirm] = useState<boolean>(false);
  
  // 🔧 MỚI: State cho việc chọn stage khi fail
  const [stages, setStages] = useState<ProcessingStage[]>([]);
  const [loadingStages, setLoadingStages] = useState<boolean>(false);
  const [selectedFailedStages, setSelectedFailedStages] = useState<string[]>([]);

  // 🔧 MỚI: State cho trường hợp 50/50
  const [fiftyFiftyScenario, setFiftyFiftyScenario] = useState<boolean>(false);
  const [fiftyFiftyDecision, setFiftyFiftyDecision] = useState<'pass' | 'fail' | null>(null);

  // 🔧 MỚI: State để tránh duplicate toast
  const [toastShown, setToastShown] = useState<boolean>(false);

  // 🔧 CẢI THIỆN: Tự động load tiêu chí và stages khi form mở
  useEffect(() => {
    if (isOpen) {
      loadCriteria();
      if (methodId) {
        loadStages();
      }
    } else {
      // 🔧 MỚI: Reset các state khi form đóng
      setFiftyFiftyScenario(false);
      setFiftyFiftyDecision(null);
      setSelectedFailedStages([]);
      setToastShown(false); // Reset toastShown khi form đóng
    }
  }, [isOpen, methodId]);

  // 🔧 MỚI: Helper function để quản lý toast
  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    if (!toastShown) {
      switch (type) {
        case 'success':
          AppToast.success(message);
          break;
        case 'error':
          AppToast.error(message);
          break;
        case 'warning':
          AppToast.warning(message);
          break;
      }
      setToastShown(true);
      // Reset toastShown sau 3 giây
      setTimeout(() => setToastShown(false), 3000);
    }
  };

  const loadCriteria = async () => {
    try {
      setLoadingCriteria(true);
      const criteriaData = await getProcessingBatchCriteria();

      if (criteriaData && criteriaData.length > 0) {
        setCriteria(criteriaData);
        
        // Khởi tạo criteria results
        const initialResults = criteriaData.map((criteria: ProcessingBatchCriteria) => ({
          criteria,
          actualValue: 0,
          result: '',
          isPass: false
        }));
        setCriteriaResults(initialResults);
        console.log('✅ Loaded criteria:', criteriaData.length, 'items');
      } else {
        showToast('warning', 'Không có tiêu chí đánh giá nào được cấu hình');
        setCriteria([]);
        setCriteriaResults([]);
      }
    } catch (error: any) {
      console.error('❌ Error loading criteria:', error);
      showToast('error', 'Không thể tải danh sách tiêu chí đánh giá');
      setCriteria([]);
      setCriteriaResults([]);
    } finally {
      setLoadingCriteria(false);
    }
  };

  // 🔧 MỚI: Load danh sách stages của batch
  const loadStages = async () => {
    if (!methodId) return;
    
    try {
      setLoadingStages(true);
      const stagesData = await getProcessingStagesByMethodId(Number(methodId));

      if (stagesData && stagesData.length > 0) {
        setStages(stagesData);
        console.log('✅ Loaded stages:', stagesData.length, 'items');
      } else {
        console.log('⚠️ No stages found for method:', methodId);
        setStages([]);
      }
    } catch (error: any) {
      console.error('❌ Error loading stages:', error);
      showToast('error', 'Không thể tải danh sách các bước xử lý');
      setStages([]);
    } finally {
      setLoadingStages(false);
    }
  };

  const handleCriteriaChange = (index: number, value: number) => {
    const newResults = [...criteriaResults];
    const criteria = newResults[index];
    
    criteria.actualValue = value;
    
    // Kiểm tra pass/fail dựa trên operator và giá trị min/max
    let isPass = false;
    const { minValue, maxValue, operator } = criteria.criteria;
    
    switch (operator) {
      case '<=':
        if (maxValue !== null) {
          isPass = value <= maxValue;
        }
        break;
      case '>=':
        if (minValue !== null) {
          isPass = value >= minValue;
        }
        break;
      case '=':
        if (minValue !== null && maxValue !== null) {
          isPass = value === minValue && value === maxValue;
        } else if (minValue !== null) {
          isPass = value === minValue;
        } else if (maxValue !== null) {
          isPass = value === maxValue;
        }
        break;
      case '<':
        if (maxValue !== null) {
          isPass = value < maxValue;
        }
        break;
      case '>':
        if (minValue !== null) {
          isPass = value > minValue;
        }
        break;
      case 'between':
        if (minValue !== null && maxValue !== null) {
          isPass = value >= minValue && value <= maxValue;
        }
        break;
      default:
        isPass = false;
    }
    
    criteria.result = isPass ? 'PASS' : 'FAIL';
    criteria.isPass = isPass;
    
    setCriteriaResults(newResults);
    
    // Tính điểm tổng
    const passedCriteria = newResults.filter(r => r.isPass).length;
    const totalCriteria = newResults.length;
    const score = totalCriteria > 0 ? Math.round((passedCriteria / totalCriteria) * 100) : 0;
    
    setOverallScore(score);
    
    // Cập nhật kết quả đánh giá
    const passCount = newResults.filter(r => r.isPass).length;
    const failCount = newResults.filter(r => !r.isPass).length;
    
    // 🔧 MỚI: Xử lý trường hợp 50/50
    if (passCount === failCount && passCount > 0) {
      setFiftyFiftyScenario(true);
      setFiftyFiftyDecision(null); // Reset decision khi có thay đổi
      setEvaluationResult(EVALUATION_RESULTS.PASS); // Tạm thời set PASS, sẽ được cập nhật khi expert chọn
    } else {
      setFiftyFiftyScenario(false);
      setFiftyFiftyDecision(null);
      
      if (score >= 80) {
        setEvaluationResult(EVALUATION_RESULTS.PASS);
      } else {
        setEvaluationResult(EVALUATION_RESULTS.FAIL);
      }
    }
  };

  const handleSubmit = async () => {
    // 🔧 CẢI THIỆN: Ngăn chặn submit nhiều lần
    if (loading) {
      console.log('⚠️ Đang submit, bỏ qua request mới');
      return;
    }

    // 🔧 MỚI: Tập hợp tất cả lỗi validation trước khi hiển thị toast
    const validationErrors: string[] = [];

    if (criteriaResults.length === 0) {
      validationErrors.push('Không có tiêu chí đánh giá nào');
    }

    // Kiểm tra xem tất cả tiêu chí đã được nhập chưa
    const hasEmptyValues = criteriaResults.some(result => result.actualValue === null || result.actualValue === undefined);
    if (hasEmptyValues) {
      validationErrors.push(t('evaluation.error.incompleteCriteria'));
    }

    // 🔧 CẢI THIỆN: Kiểm tra chọn stage chỉ khi cần thiết
    if (evaluationResult === EVALUATION_RESULTS.FAIL) {
      const passCount = criteriaResults.filter(r => r.isPass).length;
      const failCount = criteriaResults.filter(r => !r.isPass).length;
      const shouldRequireStageSelection = failCount > passCount || 
        (passCount === failCount && passCount > 0) || 
        (fiftyFiftyScenario && fiftyFiftyDecision === 'fail');
      
      if (shouldRequireStageSelection && selectedFailedStages.length === 0) {
        validationErrors.push(t('evaluation.error.noFailedStagesSelected'));
      }
    }

    // 🔧 MỚI: Kiểm tra quyết định 50/50
    if (fiftyFiftyScenario && fiftyFiftyDecision === null) {
      validationErrors.push(t('evaluation.error.fiftyFiftyDecisionRequired'));
    }

    // 🔧 MỚI: Hiển thị tất cả lỗi validation cùng lúc
    if (validationErrors.length > 0) {
      showToast('error', validationErrors.join('\n'));
      return;
    }

    try {
      setLoading(true);
      setToastShown(false); // Reset toastShown khi bắt đầu submit
      
             // 🔧 CẢI THIỆN: Tạo comment chi tiết chỉ khi cần thiết
       let detailedComments = comments;
       if (evaluationResult === EVALUATION_RESULTS.FAIL && selectedFailedStages.length > 0) {
         const passCount = criteriaResults.filter(r => r.isPass).length;
         const failCount = criteriaResults.filter(r => !r.isPass).length;
         const shouldIncludeStageInfo = failCount > passCount || 
           (passCount === failCount && passCount > 0) || 
           (fiftyFiftyScenario && fiftyFiftyDecision === 'fail');
         
         if (shouldIncludeStageInfo) {
           const failedStageNames = stages
             .filter(stage => selectedFailedStages.includes(stage.stageId.toString()))
             .map(stage => `${stage.stageName} (${t('componentsprocessing.failedStagesInfo.order')}: ${stage.orderIndex})`)
             .join(', ');
           
           detailedComments = `${comments}\n\n🔧 ${t('componentsprocessing.failedStagesInfo.title')}:\n${failedStageNames}\n\n📋 ${t('componentsprocessing.failedStagesInfo.description')}`;
         }
       }

       // Tạo evaluation data với format mới
       const evaluationData = {
         BatchId: batchId,
         EvaluationResult: evaluationResult,
         // 🔧 MỚI: Thay OverallScore thành TotalScore để phù hợp với BE
         TotalScore: overallScore,
         Comments: detailedComments,
         QualityCriteriaEvaluations: criteriaResults.map(result => ({
           CriteriaId: result.criteria.id.toString(), // 🔧 FIX: Chuyển number thành string
           CriteriaName: result.criteria.name,
           Description: result.criteria.description,
           MinValue: result.criteria.minValue ?? undefined, // 🔧 FIX: null thành undefined
           MaxValue: result.criteria.maxValue ?? undefined, // 🔧 FIX: null thành undefined
           Unit: result.criteria.unit || '', // 🔧 FIX: Đảm bảo không null
           Operator: result.criteria.operator || '', // 🔧 FIX: Đảm bảo không null
           Severity: result.criteria.severity || 'Soft', // 🔧 FIX: Đảm bảo không null, default 'Soft'
           RuleGroup: result.criteria.ruleGroup || '', // 🔧 FIX: Đảm bảo không null
           ActualValue: result.actualValue,
           IsPassed: result.isPass,
           FailureReason: result.isPass ? undefined : generateFailureReason(result), // 🔧 FIX: null thành undefined
           Notes: ''
         })),
         ExpertNotes: comments,
         // 🔧 MỚI: Thêm ExpertSelectedStageId khi đánh giá fail
         ExpertSelectedStageId: (() => {
           if (evaluationResult !== EVALUATION_RESULTS.FAIL) return undefined;
           
           const passCount = criteriaResults.filter(r => r.isPass).length;
           const failCount = criteriaResults.filter(r => !r.isPass).length;
           const shouldIncludeStageId = failCount > passCount || 
             (passCount === failCount && passCount > 0) || 
             (fiftyFiftyScenario && fiftyFiftyDecision === 'fail');
           
           if (!shouldIncludeStageId || selectedFailedStages.length === 0) return undefined;
           
           // 🔧 MỚI: Chỉ lấy StageId đầu tiên được chọn (expert chỉ chọn 1 stage có vấn đề)
           const firstSelectedStageId = parseInt(selectedFailedStages[0]);
           console.log('🔧 Expert selected StageId:', firstSelectedStageId);
           return firstSelectedStageId;
         })(),
         // 🔧 CẢI THIỆN: Thêm thông tin về stages bị fail chỉ khi cần thiết
         ProblematicSteps: (() => {
           if (evaluationResult !== EVALUATION_RESULTS.FAIL) return [];
           
           const passCount = criteriaResults.filter(r => r.isPass).length;
           const failCount = criteriaResults.filter(r => !r.isPass).length;
           const shouldIncludeProblematicSteps = failCount > passCount || 
             (passCount === failCount && passCount > 0) || 
             (fiftyFiftyScenario && fiftyFiftyDecision === 'fail');
           
           if (!shouldIncludeProblematicSteps) return [];
           
           const problematicSteps = stages
             .filter(stage => selectedFailedStages.includes(stage.stageId.toString()))
             .map(stage => `${stage.stageName} (${t('componentsprocessing.failedStagesInfo.order')}: ${stage.orderIndex})`);
           console.log('🔧 Selected failed stages:', selectedFailedStages);
           console.log('🔧 Problematic steps:', problematicSteps);
           return problematicSteps;
         })()
       };

      console.log('🔧 Submitting evaluation data:', evaluationData);
      console.log('🔧 DEBUG: QualityCriteriaEvaluations details:');
      evaluationData.QualityCriteriaEvaluations?.forEach((criteria, index) => {
        console.log(`🔧 Criteria ${index}:`, {
          CriteriaId: criteria.CriteriaId,
          CriteriaName: criteria.CriteriaName,
          Unit: criteria.Unit,
          Operator: criteria.Operator,
          Severity: criteria.Severity,
          RuleGroup: criteria.RuleGroup
        });
      });
      
      await createProcessingBatchEvaluation(evaluationData);
      
      console.log('✅ Evaluation submitted successfully');
      
      // 🔧 MỚI: Chỉ hiển thị toast success một lần
      if (evaluationResult === EVALUATION_RESULTS.PASS) {
        showToast('success', t('evaluation.success.submitted'));
      } else {
        showToast('success', t('evaluation.success.failureSubmitted'));
      }
      
      onSuccess();
      onClose();
      
      // 🔧 MỚI: Chuyển về màn hình view ID khi đánh giá fail
      if (evaluationResult === EVALUATION_RESULTS.FAIL) {
        const viewIdUrl = `/dashboard/expert/evaluations/${batchId}`;
        router.push(viewIdUrl);
      }
      
    } catch (error: any) {
      console.error('❌ Lỗi tạo đánh giá:', error);
      const errorMessage = error.message || t('evaluation.error.submitFailed');
      
      // 🔧 MỚI: Chỉ hiển thị toast error một lần
      showToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchPass = () => {
    setShowBatchPassConfirm(true);
  };

  const confirmBatchPass = async () => {
    // 🔧 CẢI THIỆN: Ngăn chặn submit nhiều lần
    if (loading) {
      console.log('⚠️ Đang submit batch pass, bỏ qua request mới');
      return;
    }

    try {
      setLoading(true);
      setToastShown(false); // Reset toastShown khi bắt đầu submit
      
      const evaluationData = {
        BatchId: batchId,
        EvaluationResult: EVALUATION_RESULTS.PASS,
        // 🔧 MỚI: Thêm field IsPassAllBatch và TotalScore
        IsPassAllBatch: true,
        TotalScore: 100,
        Comments: t('evaluation.success.batchComment'),
        QualityCriteriaEvaluations: [],
        ExpertNotes: ''
      };

      console.log('🔧 DEBUG: Submitting batch pass with data:', evaluationData);

      await createProcessingBatchEvaluation(evaluationData);
      
      // 🔧 MỚI: Chỉ hiển thị toast success một lần
      showToast('success', t('evaluation.success.batchPassed'));
      
      onSuccess();
      onClose();
      
    } catch (error: any) {
      console.error('❌ Lỗi tạo đánh giá đạt:', error);
      const errorMessage = error.message || t('evaluation.error.batchPassFailed');
      
      // 🔧 MỚI: Chỉ hiển thị toast error một lần
      showToast('error', errorMessage);
    } finally {
      setLoading(false);
      setShowBatchPassConfirm(false);
    }
  };

  const cancelBatchPass = () => {
    setShowBatchPassConfirm(false);
  };

  // 🔧 MỚI: Handle quyết định 50/50
  const handleFiftyFiftyDecision = (decision: 'pass' | 'fail') => {
    setFiftyFiftyDecision(decision);
    if (decision === 'pass') {
      setEvaluationResult(EVALUATION_RESULTS.PASS);
    } else {
      setEvaluationResult(EVALUATION_RESULTS.FAIL);
    }
  };

  // 🔧 MỚI: Handle chọn stage khi fail
  const handleStageSelection = (stageId: string, checked: boolean) => {
    if (checked) {
      setSelectedFailedStages(prev => {
        // Kiểm tra xem stageId đã có trong mảng chưa để tránh duplicate
        if (prev.includes(stageId)) {
          return prev;
        }
        return [...prev, stageId];
      });
    } else {
      setSelectedFailedStages(prev => prev.filter(id => id !== stageId));
    }
  };

  // Function để format phạm vi tiêu chí
  const formatCriteriaRange = (criteria: ProcessingBatchCriteria) => {
    const { minValue, maxValue, operator, unit } = criteria;
    
    switch (operator) {
      case '<=':
        if (maxValue !== null) {
          return `≤ ${maxValue} ${unit}`;
        }
        break;
      case '>=':
        if (minValue !== null) {
          return `≥ ${minValue} ${unit}`;
        }
        break;
      case '=':
        if (minValue !== null && maxValue !== null && minValue === maxValue) {
          return `= ${minValue} ${unit}`;
        } else if (minValue !== null) {
          return `= ${minValue} ${unit}`;
        } else if (maxValue !== null) {
          return `= ${maxValue} ${unit}`;
        }
        break;
      case '<':
        if (maxValue !== null) {
          return `< ${maxValue} ${unit}`;
        }
        break;
      case '>':
        if (minValue !== null) {
          return `> ${minValue} ${unit}`;
        }
        break;
      case 'between':
        if (minValue !== null && maxValue !== null) {
          return `${minValue} - ${maxValue} ${unit}`;
        }
        break;
      default:
        return `${minValue || 0} - ${maxValue || 0} ${unit}`;
    }
    
    return `${minValue || 0} - ${maxValue || 0} ${unit}`;
  };

  // Function để tạo lý do thất bại
  const generateFailureReason = (result: CriteriaResult) => {
    const { actualValue, criteria } = result;
    const { minValue, maxValue, operator, unit, description } = criteria;
    
    switch (operator) {
      case '<=':
        if (maxValue !== null && actualValue > maxValue) {
          return `${description}: ${actualValue} ${unit} > ${maxValue} ${unit} (${t('evaluation.criteria.reason.exceedLimit')})`;
        }
        break;
      case '>=':
        if (minValue !== null && actualValue < minValue) {
          return `${description}: ${actualValue} ${unit} < ${minValue} ${unit} (${t('evaluation.criteria.reason.belowLimit')})`;
        }
        break;
      case '=':
        if (minValue !== null && maxValue !== null && minValue === maxValue) {
          if (actualValue !== minValue) {
            return `${description}: ${actualValue} ${unit} ≠ ${minValue} ${unit} (${t('evaluation.criteria.reason.notMatchRequired')})`;
          }
        } else if (minValue !== null && actualValue !== minValue) {
          return `${description}: ${actualValue} ${unit} ≠ ${minValue} ${unit} (${t('evaluation.criteria.reason.notMatchRequired')})`;
        } else if (maxValue !== null && actualValue !== maxValue) {
          return `${description}: ${actualValue} ${unit} ≠ ${maxValue} ${unit} (${t('evaluation.criteria.reason.notMatchRequired')})`;
        }
        break;
      case '<':
        if (maxValue !== null && actualValue >= maxValue) {
          return `${description}: ${actualValue} ${unit} >= ${maxValue} ${unit} (${t('evaluation.criteria.reason.notSatisfyCondition')})`;
        }
        break;
      case '>':
        if (minValue !== null && actualValue <= minValue) {
          return `${description}: ${actualValue} ${unit} <= ${minValue} ${unit} (${t('evaluation.criteria.reason.notSatisfyCondition')})`;
        }
        break;
      case 'between':
        if (minValue !== null && maxValue !== null) {
          if (actualValue < minValue) {
            return `${description}: ${actualValue} ${unit} < ${minValue} ${unit} (${t('evaluation.criteria.reason.belowLimit')})`;
          } else if (actualValue > maxValue) {
            return `${description}: ${actualValue} ${unit} > ${maxValue} ${unit} (${t('evaluation.criteria.reason.exceedLimit')})`;
          }
        }
        break;
    }
    
    return `${t('evaluation.criteria.actual')} ${actualValue} ${unit} ${t('evaluation.criteria.failed')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-semibold text-gray-900">{t('evaluation.title')} - Batch #{batchId}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Criteria Evaluation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                <FiSettings className="w-5 h-5" />
                {t('evaluation.criteria.title')} ({criteria.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCriteria ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  <span className="text-gray-600">{t('evaluation.criteria.loading')}</span>
                </div>
              ) : criteria.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="text-gray-400 text-4xl mx-auto mb-4" />
                  <p className="text-gray-500">{t('evaluation.warning.noCriteria')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {criteriaResults.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {result.criteria.name.replace('PB.', '')}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {result.criteria.description}
                          </p>
                          <p className="text-sm text-gray-500">
                            {t('evaluation.criteria.range')} {formatCriteriaRange(result.criteria)}
                          </p>
                        </div>
                        <Badge variant={result.isPass ? "default" : "destructive"}>
                          {result.result}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <Label className="text-sm font-medium text-gray-700">{t('evaluation.criteria.actualValue')}</Label>
                          <Input
                            type="number"
                            value={result.actualValue}
                            onChange={(e) => handleCriteriaChange(index, Number(e.target.value))}
                            className="mt-1"
                            min={0}
                            step={0.01}
                            placeholder={t('evaluation.criteria.actualValue') + ` ${result.criteria.unit}`}
                          />
                        </div>
                        <div className="text-sm text-gray-500">
                          {result.criteria.unit}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

                     {/* Evaluation Results */}
           {criteriaResults.length > 0 && (
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg text-gray-900">{t('evaluation.results.title')}</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <Label className="text-sm font-medium text-gray-700 mb-2 block">{t('evaluation.results.passedCriteria')}</Label>
                     <div className="text-2xl font-bold text-green-600">
                       {criteriaResults.filter(r => r.isPass).length}/{criteriaResults.length}
                     </div>
                   </div>
                   
                   <div>
                     <Label className="text-sm font-medium text-gray-700 mb-2 block">{t('evaluation.results.overallScore')}</Label>
                     <div className="text-2xl font-bold text-blue-600">
                       {overallScore}/100
                     </div>
                   </div>
                 </div>
                 
                 <div className="mt-4">
                   <Label className="text-sm font-medium text-gray-700 mb-2 block">{t('evaluation.results.additionalComments')}</Label>
                   <Textarea
                     value={comments}
                     onChange={(e) => setComments(e.target.value)}
                     placeholder={t('evaluation.results.commentsPlaceholder')}
                     rows={3}
                   />
                 </div>
               </CardContent>
             </Card>
           )}

           {/* 🔧 MỚI: 50/50 Decision Section */}
           {fiftyFiftyScenario && fiftyFiftyDecision === null && (
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                   <AlertTriangle className="w-5 h-5 text-yellow-500" />
                   {t('evaluation.fiftyFifty.title')}
                 </CardTitle>
                 <p className="text-sm text-gray-600">
                   {t('evaluation.fiftyFifty.description')}
                 </p>
               </CardHeader>
               <CardContent>
                 <div className="flex flex-col sm:flex-row gap-4">
                   <Button
                     onClick={() => handleFiftyFiftyDecision('pass')}
                     className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                   >
                     <CheckCircle className="w-4 h-4 mr-2" />
                     {t('evaluation.fiftyFifty.passDecision')}
                   </Button>
                   <Button
                     onClick={() => handleFiftyFiftyDecision('fail')}
                     className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                   >
                     <XCircle className="w-4 h-4 mr-2" />
                     {t('evaluation.fiftyFifty.failDecision')}
                   </Button>
                 </div>
               </CardContent>
             </Card>
           )}

           {/* 🔧 CẢI THIỆN: Stage Selection chỉ khi cần thiết */}
           {(() => {
             // Chỉ hiển thị khi Fail và có stages
             if (evaluationResult !== EVALUATION_RESULTS.FAIL || stages.length === 0) return null;
             
             // Tính toán số tiêu chí đạt/không đạt
             const passCount = criteriaResults.filter(r => r.isPass).length;
             const failCount = criteriaResults.filter(r => !r.isPass).length;
             
             // Chỉ hiển thị khi: Fail nhiều hơn Pass HOẶC bằng nhau (50/50) HOẶC 50/50 đã chọn fail
             const shouldShowStageSelection = failCount > passCount || 
               (passCount === failCount && passCount > 0) || 
               (fiftyFiftyScenario && fiftyFiftyDecision === 'fail');
             
             if (!shouldShowStageSelection) return null;
             
             return (
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                   <AlertTriangle className="w-5 h-5 text-red-500" />
                   {t('componentsprocessing.failedStagesInfo.title')}
                 </CardTitle>
                 <p className="text-sm text-gray-600">
                   {t('componentsprocessing.failedStagesInfo.description')}
                 </p>
               </CardHeader>
               <CardContent>
                 {loadingStages ? (
                   <div className="flex items-center justify-center py-4">
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     <span className="text-gray-600">{t('componentsprocessing.failedStagesInfo.loading')}</span>
                   </div>
                 ) : (
                   <div className="space-y-3">
                     {stages.map((stage) => (
                       <div key={stage.stageId} className="flex items-center space-x-3 p-3 border rounded-lg">
                         <Checkbox
                           id={`stage-${stage.stageId}`}
                           checked={selectedFailedStages.includes(stage.stageId.toString())}
                           onCheckedChange={(checked) => 
                             handleStageSelection(stage.stageId.toString(), checked as boolean)
                           }
                         />
                         <Label 
                           htmlFor={`stage-${stage.stageId}`}
                           className="flex-1 cursor-pointer"
                         >
                           <div className="flex items-center justify-between">
                             <span className="font-medium">{stage.stageName}</span>
                             <Badge variant="outline" className="text-xs">
                               {t('componentsprocessing.failedStagesInfo.order')} {stage.orderIndex}
                             </Badge>
                           </div>
                         </Label>
                       </div>
                     ))}
                   </div>
                 )}
                 
                 {selectedFailedStages.length > 0 && (
                   <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                     <div className="flex items-center gap-2">
                       <Info className="w-4 h-4 text-yellow-600" />
                       <span className="text-sm text-yellow-800">
                         {t('componentsprocessing.failedStagesInfo.selectedCount', { count: selectedFailedStages.length })}
                       </span>
                     </div>
                   </div>
                 )}
               </CardContent>
             </Card>
           );
           })()}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            
            {criteria.length > 0 && (
              <Button 
                onClick={handleSubmit} 
                disabled={loading || criteriaResults.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('evaluation.actions.submitting')}
                  </>
                ) : (
                  t('evaluation.actions.evaluateBatch')
                )}
              </Button>
            )}
            
            <Button 
              onClick={handleBatchPass} 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {t('evaluation.actions.passBatch')}
            </Button>
          </div>
        </div>
      </div>

      {/* Batch Pass Confirmation Popup */}
      {showBatchPassConfirm && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {t('evaluation.batchPassConfirm.title')}
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              {t('evaluation.batchPassConfirm.message')}
            </p>
            
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={cancelBatchPass}
                disabled={loading}
              >
                {t('evaluation.batchPassConfirm.cancel')}
              </Button>
              <Button 
                onClick={confirmBatchPass}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('evaluation.batchPassConfirm.processing')}
                  </>
                ) : (
                  t('evaluation.batchPassConfirm.confirm')
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

