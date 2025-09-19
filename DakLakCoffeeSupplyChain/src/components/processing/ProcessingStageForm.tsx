"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  GripVertical,
  Settings,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { 
  createProcessingStages, 
  updateProcessingStages, 
  deleteProcessingStages,
  getProcessingStagesByMethodId,
  ProcessingStage 
} from "@/lib/api/processingStages";
import { AppToast } from "@/components/ui/AppToast";

interface ProcessingStageFormProps {
  methodId: number;
  methodName: string;
  onSuccess?: (stages: ProcessingStage[]) => void;
  onCancel?: () => void;
  isOpen?: boolean;
}

interface StageFormData {
  stageName: string;
  stageCode: string;
  description: string;
  orderIndex: number;
  isRequired: boolean;
}

export default function ProcessingStageForm({
  methodId,
  methodName,
  onSuccess,
  onCancel,
  isOpen = true
}: ProcessingStageFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stageForms, setStageForms] = useState<StageFormData[]>([]);
  const [editingStageId, setEditingStageId] = useState<number | null>(null);
  const [stages, setStages] = useState<ProcessingStage[]>([]);
  const [loadingStages, setLoadingStages] = useState(false);

  // Fetch stages for this method when component mounts or methodId changes
  useEffect(() => {
    const fetchStages = async () => {
      if (!methodId) return;
      
      try {
        setLoadingStages(true);
        console.log(`🔍 DEBUG: Fetching stages for methodId: ${methodId}`);
        console.log(`🔍 DEBUG: MethodId type:`, typeof methodId);
        const stagesData = await getProcessingStagesByMethodId(methodId);
        console.log(`🔍 DEBUG: Fetched stages:`, stagesData);
        console.log(`🔍 DEBUG: Stages count:`, stagesData?.length || 0);
        setStages(stagesData);
        
        if (stagesData && stagesData.length > 0) {
          const sortedStages = [...stagesData].sort((a, b) => a.orderIndex - b.orderIndex);
        
          setStageForms(sortedStages.map(stage => ({
            stageName: stage.stageName,
            stageCode: stage.stageCode || "",
            description: stage.description || "",
            orderIndex: stage.orderIndex,
            isRequired: stage.isRequired // ✅ Đúng field
          })));
        } else {
      
        }
      } catch (error) {
        console.error("❌ Error fetching stages:", error);
        setError("Lỗi khi tải giai đoạn");
        // Fallback to empty form
        setStageForms([
          { stageName: "", stageCode: "", description: "", orderIndex: 1, isRequired: true },
          { stageName: "", stageCode: "", description: "", orderIndex: 2, isRequired: true }
        ]);
      } finally {
        setLoadingStages(false);
      }
    };

    fetchStages();
  }, [methodId]);

  const handleStageChange = (index: number, field: keyof StageFormData, value: string | boolean | number) => {
    console.log(`🔍 DEBUG: handleStageChange called - index: ${index}, field: ${field}, value:`, value);
    console.log(`🔍 DEBUG: Current stageForms:`, stageForms);
    
    const newStages = [...stageForms];
    newStages[index] = {
      ...newStages[index],
      [field]: value
    };
    
    console.log(`🔍 DEBUG: New stageForms:`, newStages);
    setStageForms(newStages);
  };

  const addStage = () => {
    const newOrderIndex = Math.max(...stageForms.map(s => s.orderIndex), 0) + 1;
    setStageForms(prev => [...prev, {
      stageName: "",
      stageCode: "",
      description: "",
      orderIndex: newOrderIndex,
      isRequired: false
    }]);
  };

  const removeStage = (index: number) => {
    if (stageForms.length <= 1) {
      AppToast.error('Cần ít nhất một giai đoạn');
      return;
    }

    const newStages = stageForms.filter((_, i) => i !== index);
    // Reorder remaining stages
    const reorderedStages = newStages.map((stage, i) => ({
      ...stage,
      orderIndex: i + 1
    }));
    setStageForms(reorderedStages);
  };

  const moveStage = (index: number, direction: 'up' | 'down') => {
    const newStages = [...stageForms];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newStages.length) return;

    // Swap stages
    [newStages[index], newStages[targetIndex]] = [newStages[targetIndex], newStages[index]];
    
    // Update order indices
    newStages.forEach((stage, i) => {
      stage.orderIndex = i + 1;
    });
    
    setStageForms(newStages);
  };

  const validateForm = () => {
    console.log("🔍 DEBUG: Validating form with stages:", stageForms);
    console.log("🔍 DEBUG: Total stages count:", stageForms.length);
    
    // Filter out empty stages first
    const validStages = stageForms.filter(stage => stage && stage.stageName && stage.stageName.trim());
    console.log("🔍 DEBUG: Valid stages count:", validStages.length);
    console.log("🔍 DEBUG: Valid stages:", validStages);
    
    // Debug all stages
    console.log("🔍 DEBUG: All stages details:", stageForms.map((s, index) => ({ 
      index,
      stageName: s.stageName, 
      stageCode: s.stageCode, 
      description: s.description,
      orderIndex: s.orderIndex,
      isRequired: s.isRequired
    })));
    
    // Check for empty stage names
    const emptyStages = stageForms.filter(stage => !stage.stageName.trim());
    if (emptyStages.length > 0) {
      console.log("❌ Validation failed: Empty stage names", emptyStages);
      console.log("❌ Empty stages details:", emptyStages.map(s => ({ 
        stageName: s.stageName, 
        stageCode: s.stageCode, 
        description: s.description,
        orderIndex: s.orderIndex 
      })));
      setError(t('processing.stage.validation.stageNameRequired'));
      return false;
    }

    // Check for empty stage codes
    const emptyCodes = stageForms.filter(stage => !stage.stageCode.trim());
    if (emptyCodes.length > 0) {
      console.log("❌ Validation failed: Empty stage codes", emptyCodes);
      console.log("❌ Empty codes details:", emptyCodes.map(s => ({ stageName: s.stageName, stageCode: s.stageCode })));
      setError('Mã giai đoạn là bắt buộc');
      return false;
    }

    // Check for empty descriptions
    const emptyDescriptions = stageForms.filter(stage => !stage.description.trim());
    if (emptyDescriptions.length > 0) {
      console.log("❌ Validation failed: Empty descriptions", emptyDescriptions);
      console.log("❌ Empty descriptions details:", emptyDescriptions.map(s => ({ stageName: s.stageName, description: s.description })));
      setError('Mô tả là bắt buộc');
      return false;
    }

    // Check for duplicate stage names
    const stageNames = stageForms.map(s => s.stageName.trim().toLowerCase());
    const uniqueNames = new Set(stageNames);
    if (stageNames.length !== uniqueNames.size) {
      console.log("❌ Validation failed: Duplicate stage names", stageNames);
      console.log("❌ Duplicate names details:", stageNames);
      setError('Tên giai đoạn phải duy nhất');
      return false;
    }

    // Check for duplicate stage codes
    const stageCodes = stageForms.map(s => s.stageCode.trim().toLowerCase());
    const uniqueCodes = new Set(stageCodes);
    if (stageCodes.length !== uniqueCodes.size) {
      console.log("❌ Validation failed: Duplicate stage codes", stageCodes);
      console.log("❌ Duplicate codes details:", stageCodes);
      setError('Mã giai đoạn phải duy nhất');
      return false;
    }

    console.log("✅ Validation passed");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ Kiểm tra validation trước khi submit
    if (!validateForm()) {
      console.log("❌ Validation failed, not submitting");
      return;
    }

    console.log("✅ Validation passed, submitting...");
    setLoading(true);
    setError(null);

    try {
      const stagesToCreate = stageForms.map(stage => ({
        stageName: stage.stageName.trim(),
        stageCode: stage.stageCode.trim(),
        description: stage.description.trim(),
        orderIndex: stage.orderIndex,
        methodId: methodId,
        isRequired: stage.isRequired,
        isDeleted: false
      }));
      
      console.log(`🔍 DEBUG: Stages to create:`, stagesToCreate);

      // Update existing stages or create new ones
      const updatedStages: ProcessingStage[] = [];
      
      for (let i = 0; i < stageForms.length; i++) {
        const stageForm = stageForms[i];
        const existingStage = stages && stages[i] ? stages[i] : null;
        
        if (existingStage) {
          // Update existing stage
          console.log(`🔍 DEBUG: Updating stage ${existingStage.stageId}:`, {
            stageName: stageForm.stageName.trim(),
            orderIndex: stageForm.orderIndex,
            isRequired: stageForm.isRequired
          });
          
          const updatedStage = await updateProcessingStages(
            existingStage.stageId.toString(),
            {
              stageId: existingStage.stageId, // ✅ Thêm StageId vào request body
              stageName: stageForm.stageName.trim(),
              stageCode: stageForm.stageCode.trim(),
              description: stageForm.description.trim(),
              orderIndex: stageForm.orderIndex,
              methodId: methodId,
              isRequired: stageForm.isRequired,
              isDeleted: false
            }
          );
          updatedStages.push(updatedStage);
        } else {
          // Create new stage
          console.log(`🔍 DEBUG: Creating new stage:`, stageForm);
          
          const createdStage = await createProcessingStages({
            stageName: stageForm.stageName.trim(),
            stageCode: stageForm.stageCode.trim(),
            description: stageForm.description.trim(),
            orderIndex: stageForm.orderIndex,
            methodId: methodId,
            isRequired: stageForm.isRequired,
            isDeleted: false
          });
          updatedStages.push(createdStage);
        }
      }
      
      // Delete any extra existing stages that are no longer needed
      if (stages && stages.length > stageForms.length) {
        for (let i = stageForms.length; i < stages.length; i++) {
          console.log(`🔍 DEBUG: Deleting extra stage ${stages[i].stageId}`);
          await deleteProcessingStages(stages[i].stageId.toString());
        }
      }

      // ✅ Chỉ hiển thị success khi KHÔNG có lỗi
      AppToast.success('Lưu giai đoạn sơ chế thành công');
      onSuccess?.(updatedStages);
    } catch (err: any) {
      console.error("❌ Error saving processing stages:", err);
      console.error("❌ Error response:", err?.response?.data);
      console.error("❌ Error status:", err?.response?.status);
      console.error("❌ Error message:", err?.message);
      console.error("❌ Full error object:", err);
      setError(err?.response?.data?.message || err?.message || 'Lỗi khi lưu dữ liệu');
      // ✅ Không hiển thị toast success khi có lỗi
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {t('processing.stage.manageTitle')}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {t('processing.stage.configDescription', { methodName })}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {loadingStages ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
              <p className="text-gray-600">{t('processing.stage.loading')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <div className="flex items-center gap-2">
                      <span className="text-red-500">⚠️</span>
                      <span>{error}</span>
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      Debug: {JSON.stringify({ error, stageForms: stageForms.length })}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

            {/* Stages List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('processing.stage.title')}
                </h3>
                <Button
                  type="button"
                  onClick={addStage}
                  variant="outline"
                  size="sm"
                  className="border-orange-200 hover:bg-orange-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('processing.stage.addStage')}
                </Button>
              </div>

              <div className="space-y-3">
                {stageForms.map((stage, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 border border-orange-200 rounded-lg bg-orange-50/30">
                    {/* Order Controls */}
                    <div className="flex flex-col gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveStage(index, 'up')}
                        disabled={index === 0 || loading}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <Badge variant="outline" className="text-xs">
                        {stage.orderIndex}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveStage(index, 'down')}
                        disabled={index === stageForms.length - 1 || loading}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Stage Name */}
                    <div className="flex-1">
                      <Input
                        value={stage.stageName}
                        onChange={(e) => handleStageChange(index, 'stageName', e.target.value)}
                        placeholder={t('processing.stage.namePlaceholder')}
                        className="border-orange-200 focus:border-orange-400"
                        disabled={loading}
                      />
                    </div>
                    
                    {/* Stage Code */}
                    <div className="flex-1">
                      <Input
                        value={stage.stageCode}
                        onChange={(e) => handleStageChange(index, 'stageCode', e.target.value)}
                        placeholder={t('processing.stage.codePlaceholder')}
                        className="border-orange-200 focus:border-orange-400"
                        disabled={loading}
                      />
                    </div>
                    
                    {/* Description */}
                    <div className="flex-1">
                      <Input
                        value={stage.description}
                        onChange={(e) => handleStageChange(index, 'description', e.target.value)}
                        placeholder={t('processing.stage.descriptionPlaceholder')}
                        className="border-orange-200 focus:border-orange-400"
                        disabled={loading}
                      />
                    </div>

                    {/* Required Checkbox */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`required-${index}`}
                        checked={stage.isRequired}
                        onCheckedChange={(checked) => {
                          console.log(`🔍 DEBUG: Checkbox clicked for stage ${index}, checked:`, checked);
                          handleStageChange(index, 'isRequired', checked === true);
                        }}
                        disabled={loading}
                      />
                      <Label 
                        htmlFor={`required-${index}`} 
                        className="text-sm text-gray-700 cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          console.log(`🔍 DEBUG: Label clicked for stage ${index}`);
                          handleStageChange(index, 'isRequired', !stage.isRequired);
                        }}
                      >
                        {t('processing.stage.required')}
                      </Label>
                    </div>

                    {/* Remove Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStage(index)}
                      disabled={stageForms.length <= 1 || loading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="border-gray-300 hover:bg-gray-50"
              >
                <X className="w-4 h-4 mr-2" />
                {t('common.cancel')}
              </Button>
              
              <Button
                type="submit"
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {loading ? t('processing.stage.saving') : t('processing.stage.save')}
              </Button>
            </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
