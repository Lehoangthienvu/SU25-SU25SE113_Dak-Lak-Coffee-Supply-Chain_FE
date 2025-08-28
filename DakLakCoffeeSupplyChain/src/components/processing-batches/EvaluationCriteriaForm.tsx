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
  const { t } = useTranslation();
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
  //         console.log('🔧 AUTO-SET: Stage set from initial:', stageFromInitial);
  //       }
  //     }
  //   }
  // }, [availableStages, urlStageCode, initialStageCode, initialStageName, initialOrderIndex]);

  const loadAvailableStages = async () => {
    if (!methodId) {
      console.log('❌ No methodId provided');
      return;
    }

    try {
      const stages = await getProcessingStagesByMethodId(Number(methodId));
             const availableStages = stages
         .filter(stage => !stage.isDeleted)
         .map(stage => ({
           code: stage.stageId,
           name: stage.stageName,
           orderIndex: stage.orderIndex
         }))
         .sort((a, b) => a.orderIndex - b.orderIndex);

      setAvailableStages(availableStages);
      console.log('🔧 Available stages loaded:', availableStages);
    } catch (error) {
      console.error('❌ Error loading stages:', error);
      AppToast.error(t('evaluation.error.loadingStages'));
    }
  };

  const loadCriteria = async () => {
    if (!selectedStageCode) {
      AppToast.warning(t('evaluation.warning.noStageSelected'));
      return;
    }

    try {
      setLoadingCriteria(true);
             const criteriaData = await getEvaluationCriteriaForStage(selectedStageCode.toString());
       const failureReasonsData = await getFailureReasonsForStage(selectedStageCode.toString());

      if (criteriaData && criteriaData.length > 0) {
        setCriteria(criteriaData);
        setFailureReasons(failureReasonsData || []);
        
        // Khởi tạo criteria results
        const initialResults = criteriaData.map(criteria => ({
          criteria,
          actualValue: 0,
          result: '',
          isPass: false
        }));
        setCriteriaResults(initialResults);
      } else {
        AppToast.warning(t('evaluation.warning.noCriteria', { stageName: selectedStageName }));
        setCriteria([]);
        setCriteriaResults([]);
      }
    } catch (error: any) {
      console.error('❌ Error loading criteria:', error);
      let errorMessage = t('evaluation.error.loadingCriteria');
      
      if (error.message?.includes('Không tìm thấy tiêu chí')) {
        errorMessage = t('evaluation.error.noCriteriaForStage', { stageName: selectedStageName });
      }
      
      AppToast.error(errorMessage);
      setCriteria([]);
      setCriteriaResults([]);
    } finally {
      setLoadingCriteria(false);
    }
  };

  const handleStageChange = (stageCode: string) => {
    const stageCodeNum = Number(stageCode);
    const selectedStage = availableStages.find(s => s.code === stageCodeNum);
    
    if (selectedStage) {
      setSelectedStageCode(selectedStage.code);
      setSelectedStageName(selectedStage.name);
      setSelectedOrderIndex(selectedStage.orderIndex);
      
      // Reset criteria khi thay đổi stage
      setCriteria([]);
      setCriteriaResults([]);
      setSelectedFailureReasons([]);
      setSelectedFailedCriteria([]);
      setOverallScore(0);
      setEvaluationResult(EVALUATION_RESULTS.PASS);
      setComments('');
      
      console.log('🔧 Stage changed to:', selectedStage);
    }
  };

  const handleCriteriaChange = (index: number, value: number) => {
    const newResults = [...criteriaResults];
    const criteria = newResults[index];
    
    criteria.actualValue = value;
    
         // Kiểm tra pass/fail
     if (criteria.criteria.minValue !== undefined && criteria.criteria.maxValue !== undefined &&
         value >= criteria.criteria.minValue && value <= criteria.criteria.maxValue) {
       criteria.result = 'PASS';
       criteria.isPass = true;
     } else {
       criteria.result = 'FAIL';
       criteria.isPass = false;
     }
    
    setCriteriaResults(newResults);
    
    // Tính điểm tổng
    const passedCriteria = newResults.filter(r => r.isPass).length;
    const totalCriteria = newResults.length;
    const score = totalCriteria > 0 ? Math.round((passedCriteria / totalCriteria) * 100) : 0;
    
    setOverallScore(score);
    
    // Cập nhật kết quả đánh giá
    if (score >= 80) {
      setEvaluationResult(EVALUATION_RESULTS.PASS);
    } else {
      setEvaluationResult(EVALUATION_RESULTS.FAIL);
    }
    
    // Cập nhật danh sách tiêu chí không đạt
    const failedCriteria = newResults.filter(r => !r.isPass).map(r => r.criteria.criteriaName);
    setSelectedFailedCriteria(failedCriteria);
  };

  const handleFailureReasonChange = (reasonId: string, checked: boolean) => {
    if (checked) {
      setSelectedFailureReasons(prev => [...prev, reasonId]);
    } else {
      setSelectedFailureReasons(prev => prev.filter(id => id !== reasonId));
    }
  };

  const handleSubmit = async () => {
    if (!selectedStageCode) {
      AppToast.error(t('evaluation.error.noStageSelected'));
      return;
    }

    if (criteriaResults.length === 0) {
      AppToast.error(t('evaluation.error.noCriteria'));
      return;
    }

    // Kiểm tra xem tất cả tiêu chí đã được nhập chưa
    const hasEmptyValues = criteriaResults.some(result => result.actualValue === 0);
    if (hasEmptyValues) {
      AppToast.error(t('evaluation.error.incompleteCriteria'));
      return;
    }

    try {
      setLoading(true);
      
      let finalComments = '';
      
      if (evaluationResult === EVALUATION_RESULTS.FAIL) {
        const failedCriteria = criteriaResults.filter(r => !r.isPass);
        const stageName = selectedStageName;
        
        const failureDetails = t('evaluation.failure.details', { 
          failedCount: failedCriteria.length, 
          totalCount: criteriaResults.length 
        });
        const recommendations = t('evaluation.failure.recommendations');
        
        // Tạo comment cho stage fail
        finalComments = t('evaluation.failure.stageComment', {
          stageName,
          failedCount: failedCriteria.length,
          totalCount: criteriaResults.length,
          failureDetails,
          recommendations
        });
        
        // Thêm thông tin về tiêu chí không đạt
        const failedCriteriaNames = failedCriteria.map(r => r.criteria.criteriaName).join(', ');
        finalComments += ` | ${t('evaluation.failure.failedCriteria')}: ${failedCriteriaNames}`;
        
        // Thêm lý do thất bại nếu có
        if (selectedFailureReasons.length > 0) {
          const failureReasonNames = failureReasons
            .filter(r => selectedFailureReasons.includes(r.reasonId))
            .map(r => r.reasonName)
            .join(', ');
          finalComments += ` | ${t('evaluation.failure.reasons')}: ${failureReasonNames}`;
        }
      } else {
        // 🔧 CẢI THIỆN: Comment rõ ràng về việc đánh giá theo stage
        const passedCriteria = criteriaResults.filter(r => r.isPass).length;
        const criteriaDetails = criteriaResults
          .map(r => `${r.criteria.criteriaName}: ${r.actualValue}`)
          .join(', ');
        
        finalComments = t('evaluation.success.stageComment', {
          stageName: selectedStageName,
          passedCount: passedCriteria,
          totalCount: criteriaResults.length,
          criteriaDetails,
          score: overallScore
        });
        
        if (comments.trim()) {
          finalComments += ` | ${t('evaluation.comments')}: ${comments.trim()}`;
        }
      }

      const evaluationData = {
        BatchId: batchId,
        StageId: selectedStageCode,        // 🔧 CẢI THIỆN: Thêm StageId để đánh giá theo stage
        EvaluationResult: evaluationResult,
        OverallScore: overallScore,
        Comments: finalComments,
                 CriteriaResults: criteriaResults.map(result => ({
           CriteriaId: result.criteria.criteriaId,
           ActualValue: result.actualValue,
           Result: result.result,
           IsPass: result.isPass
         })),
        FailureReasons: selectedFailureReasons,
        FailedCriteria: selectedFailedCriteria
      };

      console.log('🔧 Submitting evaluation data:', evaluationData);
      
      await createProcessingBatchEvaluation(evaluationData);
      
      // 🔧 CẢI THIỆN: Kiểm tra xem response có chứa thông tin thành công không
      console.log('✅ Evaluation submitted successfully');
      
      if (evaluationResult === EVALUATION_RESULTS.PASS) {
        AppToast.success(t('evaluation.success.submitted'));
      } else {
        AppToast.success(t('evaluation.success.failureSubmitted'));
      }
      
      onSuccess();
      onClose();
      
    } catch (error: any) {
      console.error('❌ Lỗi tạo đánh giá:', error);
      const errorMessage = error.message || t('evaluation.error.submitFailed');
      AppToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchPass = async () => {
    if (!methodId) {
      AppToast.error(t('evaluation.error.noMethodId'));
      return;
    }

    try {
      setLoading(true);
      
      const finalComments = t('evaluation.success.batchComment');
      
      const evaluationData = {
        BatchId: batchId,
        EvaluationResult: EVALUATION_RESULTS.PASS,
        OverallScore: 100,
        Comments: finalComments,
        CriteriaResults: [],
        FailureReasons: [],
        FailedCriteria: []
      };

      await createProcessingBatchEvaluation(evaluationData);
      
      AppToast.success(t('evaluation.success.batchPassed'));
      onSuccess();
      onClose();
      
    } catch (error: any) {
      console.error('❌ Lỗi tạo đánh giá đạt:', error);
      const errorMessage = error.message || t('evaluation.error.batchPassFailed');
      AppToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-semibold text-gray-900">{t('evaluation.title')} - {selectedStageName || t('evaluation.selectStage')}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Stage Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">{t('evaluation.stageSelection.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">{t('evaluation.stageSelection.label')}</Label>
                  <Select value={selectedStageCode.toString()} onValueChange={handleStageChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('evaluation.stageSelection.placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStages.map((stage) => (
                        <SelectItem key={stage.code} value={stage.code.toString()}>
                          {t('evaluation.stageSelection.option', { 
                            order: stage.orderIndex, 
                            name: stage.name 
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedStageCode > 0 && (
                  <Button 
                    onClick={loadCriteria} 
                    disabled={loadingCriteria}
                    className="w-full"
                  >
                    {loadingCriteria ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('evaluation.stageSelection.loading')}
                      </>
                    ) : (
                      t('evaluation.stageSelection.loadCriteria')
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Criteria Evaluation */}
          {criteria.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">{t('evaluation.criteria.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingCriteria ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    <span className="text-gray-600">{t('evaluation.criteria.loading')}</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {criteriaResults.map((result, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{result.criteria.criteriaName}</h4>
                            <p className="text-sm text-gray-600">
                              {t('evaluation.criteria.range', { 
                                min: result.criteria.minValue, 
                                max: result.criteria.maxValue,
                                unit: result.criteria.unit 
                              })}
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
          )}

          {/* Failure Reasons */}
          {evaluationResult === EVALUATION_RESULTS.FAIL && failureReasons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">{t('evaluation.failureReasons.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {failureReasons.map((reason) => (
                                         <div key={reason.reasonId} className="flex items-center space-x-3">
                                             <Checkbox
                         id={reason.reasonId}
                         checked={selectedFailureReasons.includes(reason.reasonId)}
                         onCheckedChange={(checked) => 
                           handleFailureReasonChange(reason.reasonId, checked as boolean)
                         }
                       />
                       <Label htmlFor={reason.reasonId} className="text-sm text-gray-700">
                         {reason.reasonName}
                       </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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
                  criteria.length === 0 ? 'Đang tải tiêu chí...' : t('evaluation.actions.evaluateStage')
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
    </div>
  );
}

